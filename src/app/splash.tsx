import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { hydrateAuth, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

const { width, height } = Dimensions.get('window');

const HORIZON_Y = height * 0.5; // where the orb sits / horizon line
const ORB_SIZE = Math.min(width * 0.86, 320); // soft glow diameter

// Palette — the SKY stays pure black and white (that's what killed the old
// "blue screen" look: the background itself was tinted). Colour is spent only
// on light sources — the orbiting ring dots and the ".ai" brand accent.
const C = {
  bg: '#000000',
  ink: '#F4F4F7', // wordmark
  inkHot: '#FFFFFF', // star cores
  accent: '#7A68FF', // ".ai" indigo
  muted: 'rgba(255,255,255,0.46)',
  loader: 'rgba(255,255,255,0.62)',
};

// Light sources allowed to carry hue — indigo-led, with rare cyan/pink sparks.
const DOT_COLORS = [
  '#FFFFFF',
  '#C9C2FF',
  '#9B8BFF',
  '#7A68FF',
  '#6C5CE7',
  '#C9C2FF',
  '#9B8BFF',
  '#5CE7D7', // rare cyan spark
  '#E75CA8', // rare pink spark
];

// How long the whole intro takes before we start holding / navigating
const HOLD_MS = 5000;

// ─────────────────────────────────────────────────────────────
// Geometry helpers
// ─────────────────────────────────────────────────────────────

/**
 * A filled circle expressed as an SVG sub-path. Batching hundreds of dots into
 * a handful of `<Path>` elements (instead of hundreds of `<Circle>` nodes)
 * keeps the meteor tails cheap — react-native-svg allocates a native node per
 * element, and a dense dotted tail is ~60 dots each.
 */
function dotPath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// ─────────────────────────────────────────────────────────────
// Starfield — static dots batched into opacity bands
// ─────────────────────────────────────────────────────────────
function makeStarLayer(count: number, maxR: number, bands: number) {
  const paths: string[] = new Array(bands).fill('');
  for (let i = 0; i < count; i++) {
    const t = Math.random(); // brightness/size seed
    const band = Math.min(bands - 1, Math.floor(t * bands));
    const r = 0.4 + Math.pow(t, 1.6) * maxR;
    paths[band] += dotPath(Math.random() * width, Math.random() * height, r);
  }
  return paths;
}

function StarLayer({
  paths,
  opacity,
  bands,
}: {
  paths: string[];
  opacity: number;
  bands: number;
}) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {paths.map((d, i) =>
        d ? (
          <Path
            key={i}
            d={d}
            fill="#FFFFFF"
            fillOpacity={opacity * (0.12 + (i / (bands - 1)) * 0.88)}
          />
        ) : null
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero stars — the handful that actually twinkle
// ─────────────────────────────────────────────────────────────
type StarSpec = {
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
  base: number;
};

function makeStars(count: number): StarSpec[] {
  const out: StarSpec[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() < 0.8 ? 1.6 : 2.6,
      delay: Math.random() * 2200,
      dur: 900 + Math.random() * 1600,
      base: 0.15 + Math.random() * 0.25,
    });
  }
  return out;
}

function Star({ spec }: { spec: StarSpec }) {
  const o = useSharedValue(0);

  React.useEffect(() => {
    // fade in, then twinkle forever
    o.value = withDelay(
      spec.delay,
      withSequence(
        withTiming(spec.base + 0.5, { duration: 600 }),
        withRepeat(
          withSequence(
            withTiming(spec.base, { duration: spec.dur }),
            withTiming(spec.base + 0.55, { duration: spec.dur })
          ),
          -1,
          true
        )
      )
    );
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <ReAnimated.View
      style={[
        {
          position: 'absolute',
          left: spec.x,
          top: spec.y,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size,
          backgroundColor: '#fff',
        },
        st,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Meteor shower
// ─────────────────────────────────────────────────────────────
//
// Every meteor is ONE animated view whose contents are a static SVG, so the UI
// thread only ever pushes a transform — no per-frame re-render of the tail.
//
// Local SVG space: the tail runs left→right, head at the right edge. The view's
// `transformOrigin` is pinned to that head, so rotating the view swings the
// tail behind the head, and translating it moves the head along the flight
// path. Every meteor falls STRAIGHT down (rotation 90°, i.e. the tail points at
// the top of the screen) — the streaks stay parallel to the device edges.

const MET_H = 34; // svg height — leaves room for the head glow + tail spray
const MET_ROT = 90; // atan2(1, 0) in degrees — straight down the screen

type MeteorSpec = {
  key: number;
  tailLen: number;
  headR: number; // glow radius
  coreR: number;
  startX: number;
  startY: number;
  travel: number;
  dur: number; // ms of visible flight
  gap: number; // ms parked off-screen before the next pass
  delay: number;
  bright: number;
  color: string;
  bands: { d: string; o: number }[];
};

/** Builds the dotted tail: dense near the head, dispersing into dust behind. */
function makeTail(tailLen: number, headR: number, bright: number) {
  const BANDS = 8;
  const acc: string[] = new Array(BANDS).fill('');
  const L = tailLen - headR - 2; // dots stop just short of the head
  const n = Math.max(28, Math.round(L / 4.2)); // "high density"
  const cy = MET_H / 2;

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = far tail, 1 = at the head

    // Dotted, not solid: gaps get more frequent the further back you go.
    if (Math.random() > 0.34 + 0.66 * t) continue;

    // Dust disperses sideways at the tail, tightens to a point at the head.
    const spread = (1 - t) * (1 - t) * 7.5;
    const x = t * L + rand(-1.6, 1.6);
    const y = cy + rand(-spread, spread);

    const sparkle = Math.random() < 0.06;
    const r = (0.34 + Math.pow(t, 2.1) * 1.55) * (sparkle ? 1.9 : 1);

    // Quantise opacity into bands so the whole tail is 8 paths, not 60 nodes.
    const lum = Math.pow(t, 1.7) * (sparkle ? 1 : rand(0.55, 1));
    const band = Math.min(BANDS - 1, Math.max(0, Math.floor(lum * BANDS)));
    acc[band] += dotPath(x, y, r);
  }

  return acc
    .map((d, i) => ({
      d,
      o: bright * (0.05 + Math.pow((i + 1) / BANDS, 1.35) * 0.95),
    }))
    .filter((b) => b.d.length > 0);
}

function makeMeteors(count: number): MeteorSpec[] {
  const out: MeteorSpec[] = [];

  for (let i = 0; i < count; i++) {
    const bolide = i % 5 === 0; // one in five is a big, slow fireball
    const tailLen = bolide ? rand(300, 430) : rand(140, 260);
    const headR = bolide ? 13 : rand(6, 9.5);
    const bright = bolide ? 1 : rand(0.45, 0.85);

    // Mostly white; a few carry a faint indigo cast so the rain reads as light
    // rather than as a colour wash.
    const tint = Math.random();
    const color = tint < 0.68 ? '#FFFFFF' : tint < 0.88 ? '#D5CFFF' : '#A99BFF';

    out.push({
      key: i,
      tailLen,
      headR,
      coreR: bolide ? 2.6 : rand(1.2, 1.9),
      // Spawn above the top edge, spread across the full width. The fall is
      // perfectly vertical, so startX is also the column it rains down.
      startX: rand(0.03, 0.97) * width,
      startY: rand(-0.3, -0.02) * height,
      travel: height * rand(1.35, 1.7),
      dur: bolide ? rand(2200, 2900) : rand(950, 1750),
      gap: rand(700, 4200),
      delay: rand(0, 3200),
      bright,
      color,
      bands: makeTail(tailLen, headR, bright),
    });
  }

  return out;
}

function Meteor({ spec }: { spec: MeteorSpec }) {
  const p = useSharedValue(0);
  const total = spec.dur + spec.gap;

  React.useEffect(() => {
    // One linear ramp across flight + pause. Mapping the pause inside the
    // worklet (rather than resetting a shared value) means there is never a
    // one-frame flash of a meteor sitting at its start point.
    p.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: total, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const st = useAnimatedStyle(() => {
    const elapsed = p.value * total;
    const flying = elapsed <= spec.dur;
    const k = flying ? elapsed / spec.dur : 1;

    // Fade in fast, burn, fade out as it dies.
    let op = 0;
    if (flying) {
      if (k < 0.1) op = k / 0.1;
      else if (k > 0.72) op = Math.max(0, (1 - k) / 0.28);
      else op = 1;
    }

    return {
      opacity: op,
      transform: [
        { translateX: spec.startX },
        { translateY: spec.startY + k * spec.travel },
        { rotate: `${MET_ROT}deg` },
      ],
    };
  });

  const hx = spec.tailLen - spec.headR; // head centre in local space
  const cy = MET_H / 2;

  return (
    <ReAnimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          // Base position puts the head at the parent's (0,0); the animated
          // translate then drives the head along the flight path.
          left: -hx,
          top: -cy,
          width: spec.tailLen,
          height: MET_H,
          transformOrigin: [hx, cy, 0],
        },
        st,
      ]}
    >
      <Svg width={spec.tailLen} height={MET_H}>
        <Defs>
          <LinearGradient id={`mstreak${spec.key}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={spec.color} stopOpacity="0" />
            <Stop offset="0.55" stopColor={spec.color} stopOpacity="0.05" />
            <Stop offset="1" stopColor={spec.color} stopOpacity="0.22" />
          </LinearGradient>
          <RadialGradient id={`mhead${spec.key}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="26%" stopColor={spec.color} stopOpacity="0.42" />
            <Stop offset="60%" stopColor={spec.color} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={spec.color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Faint continuous streak the dots ride on top of */}
        <Rect
          x={0}
          y={cy - 0.7}
          width={hx}
          height={1.4}
          fill={`url(#mstreak${spec.key})`}
          opacity={spec.bright}
        />

        {/* The dotted tail */}
        {spec.bands.map((b, i) => (
          <Path key={i} d={b.d} fill={spec.color} fillOpacity={b.o} />
        ))}

        {/* Head: soft glow + hard core */}
        <Circle
          cx={hx}
          cy={cy}
          r={spec.headR}
          fill={`url(#mhead${spec.key})`}
        />
        <Ellipse
          cx={hx - spec.headR * 0.35}
          cy={cy}
          rx={spec.headR * 0.9}
          ry={spec.coreR * 0.75}
          fill={spec.color}
          opacity={0.35 * spec.bright}
        />
        <Circle cx={hx} cy={cy} r={spec.coreR} fill="#FFFFFF" />
      </Svg>
    </ReAnimated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Orbital rings — dotted circles of light turning around the core
// ─────────────────────────────────────────────────────────────
//
// Same trick as the meteors: the ring's contents are a static SVG and only the
// wrapper's `rotate` is animated, so a full orbit costs one transform per frame
// no matter how many dots sit on the ring.

const RING_R_MAX = Math.min(width * 0.44, 190);

type OrbitDot = { a: number; r: number; color: string; glow: number };
type RingSpec = {
  key: number;
  radius: number;
  dots: OrbitDot[];
  dur: number; // ms per revolution
  dir: 1 | -1;
  strokeOpacity: number;
  dash: string;
  delay: number;
};

function makeRings(): RingSpec[] {
  const scales = [0.42, 0.58, 0.78, 1.0];

  return scales.map((s, i) => {
    const radius = RING_R_MAX * s;
    const count = 4 + i * 2; // outer rings carry more dots
    const dots: OrbitDot[] = [];

    for (let d = 0; d < count; d++) {
      // Even spacing with a little scatter so it never looks like a clock face.
      const a = (d / count) * Math.PI * 2 + rand(-0.22, 0.22);
      const big = Math.random() < 0.3;
      dots.push({
        a,
        r: big ? rand(2.4, 3.4) : rand(1.2, 2),
        color: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        glow: big ? rand(6, 9) : rand(3.5, 5.5),
      });
    }

    return {
      key: i,
      radius,
      dots,
      dur: 14000 + i * 5200,
      dir: i % 2 === 0 ? 1 : -1, // neighbours counter-rotate
      strokeOpacity: 0.16 - i * 0.025,
      dash: i % 2 === 0 ? '1 7' : '1.4 10',
      delay: 900 + i * 220,
    };
  });
}

function Ring({ spec }: { spec: RingSpec }) {
  const rot = useSharedValue(0);
  const op = useSharedValue(0);
  const sc = useSharedValue(0.82);

  React.useEffect(() => {
    op.value = withDelay(spec.delay, withTiming(1, { duration: 1000 }));
    sc.value = withDelay(
      spec.delay,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
    rot.value = withRepeat(
      withTiming(1, { duration: spec.dur, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const st = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { scale: sc.value },
      { rotate: `${spec.dir * rot.value * 360}deg` },
    ],
  }));

  const pad = 12; // room for the outermost dot glow
  const size = spec.radius * 2 + pad * 2;
  const c = size / 2;

  return (
    <ReAnimated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: width / 2 - size / 2,
          top: HORIZON_Y - size / 2,
          width: size,
          height: size,
        },
        st,
      ]}
    >
      <Svg width={size} height={size}>
        <Defs>
          {spec.dots.map((d, i) => (
            <RadialGradient
              key={i}
              id={`rg${spec.key}_${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop offset="0%" stopColor={d.color} stopOpacity="0.55" />
              <Stop offset="45%" stopColor={d.color} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={d.color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>

        {/* The orbit itself — a dotted hairline */}
        <Circle
          cx={c}
          cy={c}
          r={spec.radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={0.8}
          strokeOpacity={spec.strokeOpacity}
          strokeDasharray={spec.dash}
          strokeLinecap="round"
        />

        {/* Dots riding the orbit */}
        {spec.dots.map((d, i) => {
          const x = c + Math.cos(d.a) * spec.radius;
          const y = c + Math.sin(d.a) * spec.radius;
          return (
            <G key={i}>
              <Circle
                cx={x}
                cy={y}
                r={d.glow}
                fill={`url(#rg${spec.key}_${i})`}
              />
              <Circle cx={x} cy={y} r={d.r} fill={d.color} />
            </G>
          );
        })}
      </Svg>
    </ReAnimated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Per-letter reveal for the wordmark
// ─────────────────────────────────────────────────────────────
function Letter({
  char,
  delay,
  color,
  glow,
}: {
  char: string;
  delay: number;
  color: string;
  glow?: boolean;
}) {
  const o = useSharedValue(0);
  const ty = useSharedValue(16);

  React.useEffect(() => {
    o.value = withDelay(
      delay,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })
    );
    ty.value = withDelay(
      delay,
      withTiming(0, { duration: 620, easing: Easing.out(Easing.exp) })
    );
  }, []);

  const st = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <ReAnimated.Text
      style={[styles.wordChar, glow && styles.wordCharGlow, { color }, st]}
    >
      {char}
    </ReAnimated.Text>
  );
}

function Wordmark() {
  // "appsketch" soft white, ".ai" indigo with a matching halo — appearing
  // left→right. The indigo lives only here and on the orbiting dots, so it
  // reads as brand accent instead of a tinted screen.
  const base = 'appsketch'.split('');
  const accent = '.ai'.split('');
  const step = 55; // ms between letters
  const accentStart = 1150 + base.length * step + 120;

  return (
    <View style={styles.wordRow}>
      {base.map((ch, i) => (
        <Letter key={`w${i}`} char={ch} delay={1150 + i * step} color={C.ink} />
      ))}
      {accent.map((ch, i) => (
        <Letter
          key={`a${i}`}
          char={ch}
          delay={accentStart + i * step}
          color={C.accent}
          glow
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Loader dots
// ─────────────────────────────────────────────────────────────
function Dot({ index }: { index: number }) {
  const o = useSharedValue(0.25);

  React.useEffect(() => {
    o.value = withDelay(
      2400 + index * 160,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420 }),
          withTiming(0.25, { duration: 420 })
        ),
        -1,
        false
      )
    );
  }, []);

  const st = useAnimatedStyle(() => ({ opacity: o.value }));

  return <ReAnimated.View style={[styles.dot, st]} />;
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────
export default function BrandSplashScreen() {
  const router = useRouter();
  const stars = React.useMemo(() => makeStars(22), []);
  const farStars = React.useMemo(() => makeStarLayer(190, 0.9, 5), []);
  const midStars = React.useMemo(() => makeStarLayer(90, 1.4, 5), []);
  const meteors = React.useMemo(() => makeMeteors(14), []);
  const rings = React.useMemo(() => makeRings(), []);
  const navigated = React.useRef(false);

  // intro shared values
  const skyOp = useSharedValue(0); // background + stars container
  const drift = useSharedValue(0); // slow parallax on the far starfield
  const orbScale = useSharedValue(0.15);
  const orbOp = useSharedValue(0);
  const horizonSX = useSharedValue(0); // horizon line draws outward
  const beamSY = useSharedValue(0.1); // beam sweeps open
  const beamOp = useSharedValue(0);
  const tagOp = useSharedValue(0);
  const tagSpace = useSharedValue(10);
  const loaderOp = useSharedValue(0);

  React.useEffect(() => {
    hydrateAuth();
    SplashScreen.hideAsync().catch(() => {});

    // 1. sky fades up
    skyOp.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
    drift.value = withRepeat(
      withTiming(1, { duration: 26000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // 2. orb ignites from a pinpoint → blooms, then breathes forever
    orbOp.value = withDelay(400, withTiming(1, { duration: 700 }));
    orbScale.value = withDelay(
      400,
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.out(Easing.exp) }),
        withRepeat(
          withSequence(
            withTiming(0.97, {
              duration: 2200,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(1.06, {
              duration: 2200,
              easing: Easing.inOut(Easing.sin),
            })
          ),
          -1,
          true
        )
      )
    );

    // 3. horizon line draws outward from centre
    horizonSX.value = withDelay(
      650,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    // 4. vertical beam sweeps open, then gently pulses
    beamOp.value = withDelay(900, withTiming(0.9, { duration: 700 }));
    beamSY.value = withDelay(
      900,
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withRepeat(
          withSequence(
            withTiming(0.94, {
              duration: 1800,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      )
    );

    // 5. tagline tracks-in (letters settle together)
    tagOp.value = withDelay(1900, withTiming(1, { duration: 700 }));
    tagSpace.value = withDelay(
      1900,
      withTiming(3.5, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    // 6. loader fades in
    loaderOp.value = withDelay(2350, withTiming(1, { duration: 600 }));

    // 7. auto - advance
    const t = setTimeout(doExit, HOLD_MS);
    return () => clearTimeout(t);
  }, []);

  const doExit = () => {
    if (navigated.current) return;
    navigated.current = true;

    // Navigate immediately — logged-out users go to login, everyone else home.
    //
    // This used to fade a full-screen `#E7E6FF` overlay to opacity 1 ("exit
    // bloom") and navigate 340ms later. That read as a ~1s WHITE FLASH between
    // splash and home, and it never reset: because `navigated` latches, any
    // later `router.back()` that landed on this screen (e.g. the login screen's
    // goBack) showed a permanently blank near-white overlay with no way out.
    // The splash background (#000) and the app background (#0A0A0C) are within
    // a hair of each other, so a straight cut is seamless — no overlay needed.
    const authStatus = useAuth.getState().status;
    const isLoggedOut = authStatus === 'guest' || authStatus === 'signOut';
    router.replace(isLoggedOut ? '/login' : '/home');
  };

  // animated styles
  const skyStyle = useAnimatedStyle(() => ({ opacity: skyOp.value }));
  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: drift.value * 22 - 11 },
      { translateX: drift.value * -14 + 7 },
    ],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    opacity: orbOp.value,
    transform: [{ scale: orbScale.value }],
  }));
  const horizonStyle = useAnimatedStyle(() => ({
    opacity: skyOp.value,
    transform: [{ scaleX: horizonSX.value }],
  }));
  const beamStyle = useAnimatedStyle(() => ({
    opacity: beamOp.value,
    transform: [{ scaleY: beamSY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOp.value,
    letterSpacing: tagSpace.value,
  }));
  const loaderStyle = useAnimatedStyle(() => ({ opacity: loaderOp.value }));

  return (
    <Pressable style={styles.screen} onPress={doExit}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Deep-space background — pure black, lit only by white light */}
      <ReAnimated.View style={[StyleSheet.absoluteFill, skyStyle]}>
        {/* Nebula haze: two very faint grey clouds for depth (no hue) */}
        <Svg
          width={width}
          height={height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="neb1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.075" />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.022" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="neb2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={width * 0.5}
            cy={HORIZON_Y}
            rx={width * 0.95}
            ry={height * 0.42}
            fill="url(#neb1)"
          />
          <Ellipse
            cx={width * 0.12}
            cy={height * 0.16}
            rx={width * 0.55}
            ry={height * 0.2}
            fill="url(#neb2)"
          />
          <Ellipse
            cx={width * 0.92}
            cy={height * 0.82}
            rx={width * 0.5}
            ry={height * 0.18}
            fill="url(#neb2)"
          />
        </Svg>

        {/* Starfield — far layer drifts for parallax, mid layer sits still */}
        <ReAnimated.View
          style={[StyleSheet.absoluteFill, driftStyle]}
          pointerEvents="none"
        >
          <StarLayer paths={farStars} opacity={0.42} bands={5} />
        </ReAnimated.View>
        <StarLayer paths={midStars} opacity={0.72} bands={5} />

        {stars.map((s, i) => (
          <Star key={i} spec={s} />
        ))}
      </ReAnimated.View>

      {/* Meteor shower — streaks rain straight down, parallel to the screen */}
      <ReAnimated.View
        style={[StyleSheet.absoluteFill, skyStyle]}
        pointerEvents="none"
      >
        {meteors.map((m) => (
          <Meteor key={m.key} spec={m} />
        ))}
      </ReAnimated.View>

      {/* Orbital rings of coloured dots turning around the core */}
      {rings.map((r) => (
        <Ring key={r.key} spec={r} />
      ))}

      {/* Vertical light beam through the orb */}
      <ReAnimated.View style={[styles.beam, beamStyle]} pointerEvents="none">
        <Svg width={4} height={height}>
          <Defs>
            <LinearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.04" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.5" />
              <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.04" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={4} height={height} fill="url(#beam)" />
        </Svg>
      </ReAnimated.View>

      {/* Horizon line — draws outward from centre */}
      <ReAnimated.View
        style={[styles.horizon, horizonStyle]}
        pointerEvents="none"
      >
        <Svg width={width} height={2}>
          <Defs>
            <LinearGradient id="horizon" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={2} fill="url(#horizon)" />
        </Svg>
      </ReAnimated.View>

      {/* The glowing orb — white-hot core falling off into black */}
      <ReAnimated.View style={[styles.orbWrap, orbStyle]} pointerEvents="none">
        <Svg width={ORB_SIZE} height={ORB_SIZE}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="9%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <Stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.42" />
              <Stop offset="42%" stopColor="#E6E6EA" stopOpacity="0.16" />
              <Stop offset="70%" stopColor="#8A8A93" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={ORB_SIZE / 2}
            cy={ORB_SIZE / 2}
            r={ORB_SIZE / 2}
            fill="url(#orb)"
          />
        </Svg>
      </ReAnimated.View>

      {/* Wordmark + tagline */}
      <View style={styles.brandBlock} pointerEvents="none">
        <Wordmark />
        <ReAnimated.Text style={[styles.tagline, tagStyle]}>
          SKETCH · BUILD · LAUNCH
        </ReAnimated.Text>
      </View>

      {/* Loader */}
      <ReAnimated.View
        style={[styles.loaderWrap, loaderStyle]}
        pointerEvents="none"
      >
        <Text style={styles.loaderText}>INITIALIZING</Text>
        <View style={styles.dots}>
          <Dot index={0} />
          <Dot index={1} />
          <Dot index={2} />
        </View>
      </ReAnimated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: 'hidden', // keeps meteors from painting outside the screen
  },

  beam: {
    position: 'absolute',
    left: width / 2 - 2,
    top: 0,
    width: 4,
    height,
  },

  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: HORIZON_Y - 1,
    height: 2,
  },

  orbWrap: {
    position: 'absolute',
    left: width / 2 - ORB_SIZE / 2,
    top: HORIZON_Y - ORB_SIZE / 2,
  },

  brandBlock: {
    // Sits near the bottom, just above the INITIALIZING loader (rather than
    // over the centred orb).
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 118 : 102,
    alignItems: 'center',
  },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  wordChar: {
    fontFamily: F.sans600,
    fontSize: Math.min(width * 0.11, 44),
    letterSpacing: 0,
    marginHorizontal: 2.5,
    color: C.ink,
    includeFontPadding: false,
  },

  wordCharGlow: {
    textShadowColor: 'rgba(122,104,255,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  tagline: {
    marginTop: 14,
    fontFamily: F.sans400,
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },

  loaderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 64 : 48,
    alignItems: 'center',
  },

  loaderText: {
    fontFamily: F.sans400,
    fontSize: 10,
    letterSpacing: 4,
    color: C.loader,
    marginBottom: 10,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.loader,
  },
});
