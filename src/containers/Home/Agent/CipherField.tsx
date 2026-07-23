import * as React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { AppColors } from '@/lib/theme';

import { CHAR_INFLUENCE_RADIUS, PROMPT_CARD_RADIUS, type Orbit, type Rect as RectType, proximityCurve } from './orbits';

/**
 * CipherField — dark backdrop scattered with monospace cipher characters, plus
 * a soft two-tone glow that hugs the prompt card's rounded-rect edge.
 *
 * The glow is NOT a pair of travelling circles (those read as hard-edged discs
 * with a visible boundary). Instead it's a *border bloom*: several concentric
 * rounded-rect strokes tracing the exact card outline, each one wider, further
 * out and fainter than the last, painted with a single orange→purple→blue
 * horizontal gradient. Stacked, they fake a gaussian bloom that fades to
 * nothing at its outer edge, so there's no perceptible circle — the light
 * simply radiates outward from the input's border (see reference).
 *
 * The cipher characters still fade orange/blue as the two invisible orbit
 * clocks sweep past them, keeping the field alive without any visible orb.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const CHAR_ORANGE = '#FF8A5C';
const CHAR_BLUE = '#78AAFF';

// Mid stop of the border gradient — a violet where orange meets blue, matching
// the app's blue→purple send button so the whole screen reads as one palette.
const BLOOM_MID = '#8B5CF6';

// Concentric rounded-rect strokes, outer → inner. `outset` pushes the stroke
// away from the card edge, `sw` is its width, `op` its opacity. The wide/faint
// outer rings melt into the background (no edge); the tight/bright inner ring
// is the crisp glowing rim right at the border.
const BLOOM_LAYERS = [
  { outset: 46, sw: 66, op: 0.035 },
  { outset: 31, sw: 48, op: 0.06 },
  { outset: 20, sw: 34, op: 0.09 },
  { outset: 12, sw: 24, op: 0.13 },
  { outset: 6, sw: 15, op: 0.2 },
  { outset: 2, sw: 8, op: 0.32 },
  { outset: 0.75, sw: 3, op: 0.9 },
] as const;

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

type Cell = {
  key: string;
  x: number;
  y: number;
  char: string;
  fontSize: number;
  orangeCurve: number[];
  blueCurve: number[];
};

// ─── Border bloom ─────────────────────────────────────────────────────────────
function BorderBloom({
  rect,
  width,
  height,
  orange,
  blue,
}: {
  rect: RectType;
  width: number;
  height: number;
  orange: string;
  blue: string;
}) {
  // Gentle breathing so the rim feels alive without any motion that would
  // reveal an edge. Native-driver opacity only — no per-frame JS, and none of
  // the SVG-attribute animation that destabilises Fabric on this device.
  const breathe = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, useNativeDriver: true, isInteraction: false }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const opacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient
            id="agentBloomGrad"
            x1={rect.x}
            y1={rect.y}
            x2={rect.x + rect.width}
            y2={rect.y}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={orange} />
            <Stop offset="0.5" stopColor={BLOOM_MID} />
            <Stop offset="1" stopColor={blue} />
          </LinearGradient>
        </Defs>
        {BLOOM_LAYERS.map((l, i) => (
          <Rect
            key={i}
            x={rect.x - l.outset}
            y={rect.y - l.outset}
            width={rect.width + l.outset * 2}
            height={rect.height + l.outset * 2}
            rx={PROMPT_CARD_RADIUS + l.outset}
            ry={PROMPT_CARD_RADIUS + l.outset}
            fill="none"
            stroke="url(#agentBloomGrad)"
            strokeWidth={l.sw}
            opacity={l.op}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// ─── CipherField ────────────────────────────────────────────────────────────
type Props = {
  width: number;
  height: number;
  t: AppColors;
  cardRect: RectType | null;
  orangeOrbit: Orbit | null;
  blueOrbit: Orbit | null;
  orangeClock: Animated.Value;
  blueClock: Animated.Value;
};

export function CipherField({ width, height, t, cardRect, orangeOrbit, blueOrbit, orangeClock, blueClock }: Props) {
  const cells = React.useMemo<Cell[]>(() => {
    if (width <= 0 || height <= 0 || !orangeOrbit || !blueOrbit) return [];

    // Wider spacing + lower density cuts the surviving glyph count
    // significantly — each survivor renders 2 Animated.Text nodes (one per
    // orb colour), all interpolating opacity every frame; the old
    // spacing/density here produced 200-300+ of them, a real, measured
    // source of app-wide lag while this screen is focused.
    const spacing = 26;
    const cols = Math.max(1, Math.ceil(width / spacing));
    const rows = Math.max(1, Math.ceil(height / spacing));
    const rand = mulberry32(20260711);
    const density = 0.35;

    const arr: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > density) continue;
        const x = c * spacing + spacing * 0.5 + (rand() - 0.5) * spacing * 0.6;
        const y = r * spacing + spacing * 0.5 + (rand() - 0.5) * spacing * 0.6;
        const char = CHARS[Math.floor(rand() * CHARS.length)];
        const fontSize = 10;

        const oCurve = proximityCurve(x, y, orangeOrbit, CHAR_INFLUENCE_RADIUS);
        const bCurve = proximityCurve(x, y, blueOrbit, CHAR_INFLUENCE_RADIUS);

        // Keep only cells an orb actually reaches; store BOTH curves so the
        // glyph can light for whichever orb is currently near it.
        if (oCurve.minDist >= CHAR_INFLUENCE_RADIUS && bCurve.minDist >= CHAR_INFLUENCE_RADIUS) continue;

        arr.push({ key: `${r}-${c}`, x, y, char, fontSize, orangeCurve: oCurve.curve, blueCurve: bCurve.curve });
      }
    }

    return arr;
  }, [width, height, orangeOrbit, blueOrbit]);

  if (!orangeOrbit || !blueOrbit) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, overflow: 'hidden' }]} pointerEvents="none">
      {cardRect && cardRect.width > 0 && cardRect.height > 0 ? (
        <BorderBloom rect={cardRect} width={width} height={height} orange={t.agentGlowOrange} blue={t.agentGlowBlue} />
      ) : null}

      {cells.map((cell) => {
        const orangeOpacity = orangeClock.interpolate({ inputRange: orangeOrbit.input, outputRange: cell.orangeCurve });
        const blueOpacity = blueClock.interpolate({ inputRange: blueOrbit.input, outputRange: cell.blueCurve });
        return (
          <React.Fragment key={cell.key}>
            <Animated.Text style={[s.char, { left: cell.x, top: cell.y, fontSize: cell.fontSize, color: CHAR_ORANGE, opacity: orangeOpacity }]}>
              {cell.char}
            </Animated.Text>
            <Animated.Text style={[s.char, { left: cell.x, top: cell.y, fontSize: cell.fontSize, color: CHAR_BLUE, opacity: blueOpacity }]}>
              {cell.char}
            </Animated.Text>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  char: {
    position: 'absolute',
    fontFamily: MONO,
  },
});
