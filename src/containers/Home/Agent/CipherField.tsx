import * as React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

/**
 * CipherField — dark backdrop scattered with cipher-like characters, with two
 * soft glow orbs (orange + blue) that drift slowly clockwise, brightening
 * whichever characters they pass near.
 *
 * Motion + highlight are both precomputed once (useMemo) as ~32-point orbit
 * checkpoints, then driven by a single looping `Animated.Value` per orb via
 * `interpolate` — entirely on the native thread, no per-frame JS work. Each
 * character is rendered as a static dim base (cheap, always visible) plus,
 * only for cells a glow actually gets close to, a bright colour overlay whose
 * opacity follows that glow's own clock — so the highlight and the glow move
 * in perfect sync. Mirrors the base+overlay pattern already used by
 * `TwinkleDots` on the Home hero.
 */

const STEPS = 32;
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+=×÷πΩσΔ%#.:*'.split('');
const ORB_SIZE = 190;
const INFLUENCE_RADIUS = 100;
const BASE_FLOOR = 0.05;
const PEAK = 1;

// Deterministic PRNG so the character field layout is stable across
// re-renders / theme toggles (only regenerates when the field is resized).
function mulberry32(seed: number) {
  let s = seed;
  return function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Orbit = { input: number[]; xs: number[]; ys: number[] };

function buildOrbit(cx: number, cy: number, rx: number, ry: number, phaseDeg: number): Orbit {
  const input: number[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  const phase = (phaseDeg * Math.PI) / 180;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const theta = t * Math.PI * 2 + phase;
    input.push(t);
    // Clockwise: angle 0 = top, increasing angle sweeps top → right → bottom → left.
    xs.push(cx + rx * Math.sin(theta));
    ys.push(cy - ry * Math.cos(theta));
  }
  return { input, xs, ys };
}

function closestApproachCurve(cellX: number, cellY: number, orbit: Orbit) {
  let minDist = Infinity;
  const curve: number[] = [];
  for (let i = 0; i < orbit.input.length; i++) {
    const dx = cellX - orbit.xs[i];
    const dy = cellY - orbit.ys[i];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
    const k = Math.max(0, 1 - dist / INFLUENCE_RADIUS);
    curve.push(BASE_FLOOR + k * (PEAK - BASE_FLOOR));
  }
  return { curve, minDist };
}

type Cell = {
  key: string;
  x: number;
  y: number;
  char: string;
  fontSize: number;
  glow: 'orange' | 'blue' | null;
  curve: number[] | null;
};

// ─── Glow orb ─────────────────────────────────────────────────────────────────
function GlowOrb({
  gradientId,
  color,
  tx,
  ty,
}: {
  gradientId: string;
  color: string;
  tx: Animated.AnimatedInterpolation<number>;
  ty: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.orb,
        { transform: [{ translateX: tx }, { translateY: ty }] },
      ]}
    >
      <Svg width={ORB_SIZE} height={ORB_SIZE}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="45%" stopColor={color} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={ORB_SIZE / 2} cy={ORB_SIZE / 2} r={ORB_SIZE / 2} fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

// ─── CipherField ────────────────────────────────────────────────────────────
type Props = {
  width: number;
  height: number;
  t: AppColors;
};

export function CipherField({ width, height, t }: Props) {
  const orangeClock = React.useRef(new Animated.Value(0)).current;
  const blueClock = React.useRef(new Animated.Value(0)).current;

  const { orangeOrbit, blueOrbit, cells } = React.useMemo(() => {
    if (width <= 0 || height <= 0) {
      return { orangeOrbit: null as Orbit | null, blueOrbit: null as Orbit | null, cells: [] as Cell[] };
    }

    const oOrbit = buildOrbit(width * 0.4, height * 0.32, width * 0.26, height * 0.22, 0);
    const bOrbit = buildOrbit(width * 0.5, height * 0.46, width * 0.30, height * 0.20, 170);

    const spacing = 34;
    const cols = Math.max(1, Math.ceil(width / spacing));
    const rows = Math.max(1, Math.ceil(height / spacing));
    const rand = mulberry32(20260711);
    const density = 0.62;

    const arr: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > density) continue;
        const x = c * spacing + spacing * 0.5 + (rand() - 0.5) * spacing * 0.7;
        const y = r * spacing + spacing * 0.5 + (rand() - 0.5) * spacing * 0.7;
        const char = CHARS[Math.floor(rand() * CHARS.length)];
        const fontSize = 11 + rand() * 3;

        const oCurve = closestApproachCurve(x, y, oOrbit);
        const bCurve = closestApproachCurve(x, y, bOrbit);

        let glow: Cell['glow'] = null;
        let curve: number[] | null = null;
        if (oCurve.minDist < INFLUENCE_RADIUS || bCurve.minDist < INFLUENCE_RADIUS) {
          if (oCurve.minDist <= bCurve.minDist) {
            glow = 'orange';
            curve = oCurve.curve;
          } else {
            glow = 'blue';
            curve = bCurve.curve;
          }
        }

        arr.push({ key: `${r}-${c}`, x, y, char, fontSize, glow, curve });
      }
    }

    return { orangeOrbit: oOrbit, blueOrbit: bOrbit, cells: arr };
  }, [width, height]);

  React.useEffect(() => {
    if (!orangeOrbit || !blueOrbit) return;

    orangeClock.setValue(0);
    blueClock.setValue(0);

    const orangeLoop = Animated.loop(
      Animated.timing(orangeClock, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    const blueLoop = Animated.loop(
      Animated.timing(blueClock, {
        toValue: 1,
        duration: 27000,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    orangeLoop.start();
    blueLoop.start();
    return () => {
      orangeLoop.stop();
      blueLoop.stop();
    };
  }, [orangeOrbit, blueOrbit, orangeClock, blueClock]);

  if (!orangeOrbit || !blueOrbit) return null;

  const orangeX = orangeClock.interpolate({ inputRange: orangeOrbit.input, outputRange: orangeOrbit.xs.map((v) => v - ORB_SIZE / 2) });
  const orangeY = orangeClock.interpolate({ inputRange: orangeOrbit.input, outputRange: orangeOrbit.ys.map((v) => v - ORB_SIZE / 2) });
  const blueX = blueClock.interpolate({ inputRange: blueOrbit.input, outputRange: blueOrbit.xs.map((v) => v - ORB_SIZE / 2) });
  const blueY = blueClock.interpolate({ inputRange: blueOrbit.input, outputRange: blueOrbit.ys.map((v) => v - ORB_SIZE / 2) });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, overflow: 'hidden' }]} pointerEvents="none">
      <GlowOrb gradientId="agentGlowOrange" color={t.agentGlowOrange} tx={orangeX} ty={orangeY} />
      <GlowOrb gradientId="agentGlowBlue" color={t.agentGlowBlue} tx={blueX} ty={blueY} />

      {/* Dim base characters — always visible, cheap static nodes */}
      {cells.map((cell) => (
        <Text
          key={cell.key}
          style={[
            s.char,
            {
              left: cell.x,
              top: cell.y,
              fontSize: cell.fontSize,
              color: t.agentCipherColor,
            },
          ]}
        >
          {cell.char}
        </Text>
      ))}

      {/* Bright overlay — only cells a glow actually passes near, opacity
          driven by that glow's own clock so it stays in sync with the orb. */}
      {cells.map((cell) => {
        if (!cell.glow || !cell.curve) return null;
        const clock = cell.glow === 'orange' ? orangeClock : blueClock;
        const orbit = cell.glow === 'orange' ? orangeOrbit : blueOrbit;
        const color = cell.glow === 'orange' ? t.agentGlowOrange : t.agentGlowBlue;
        const opacity = clock.interpolate({ inputRange: orbit.input, outputRange: cell.curve });
        return (
          <Animated.Text
            key={`${cell.key}-glow`}
            style={[
              s.char,
              {
                left: cell.x,
                top: cell.y,
                fontSize: cell.fontSize,
                color,
                opacity,
              },
            ]}
          >
            {cell.char}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  char: {
    position: 'absolute',
    fontFamily: F.sans700,
  },
});
