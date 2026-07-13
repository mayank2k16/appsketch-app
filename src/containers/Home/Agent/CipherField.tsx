import * as React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { AppColors } from '@/lib/theme';

import { CHAR_INFLUENCE_RADIUS, ORB_SIZE, type Orbit, proximityCurve } from './orbits';

/**
 * CipherField — dark backdrop scattered with monospace cipher characters, with
 * two soft glow orbs (orange + blue) travelling around the prompt card. Every
 * character is invisible by default; it fades in — orange or blue — only while
 * an orb's glow is close to it, so the SAME character can light orange when the
 * orange orb passes and blue when the blue orb passes half a lap later.
 *
 * Each near-path cell renders two overlaid glyphs (one per orb), each driven by
 * that orb's own looping clock (owned by `AgentScreen`) over a precomputed
 * distance curve — all native-driver opacity, no per-frame JS. This mirrors the
 * validated HTML prototype exactly.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const CHAR_ORANGE = '#FF8A5C';
const CHAR_BLUE = '#78AAFF';

// Orb radial-gradient stops, cloned from the prototype — a hot bright core that
// reddens / deepens toward the transparent edge.
const ORANGE_STOPS = [
  { offset: '0%', color: '#FF783C', opacity: 0.98 },
  { offset: '16%', color: '#FF5A28', opacity: 0.75 },
  { offset: '36%', color: '#FF461E', opacity: 0.4 },
  { offset: '62%', color: '#FF3C19', opacity: 0.14 },
  { offset: '100%', color: '#FF3C19', opacity: 0 },
] as const;
const BLUE_STOPS = [
  { offset: '0%', color: '#6EAAFF', opacity: 0.98 },
  { offset: '16%', color: '#5096FF', opacity: 0.75 },
  { offset: '36%', color: '#3C82FF', opacity: 0.4 },
  { offset: '62%', color: '#3C78FF', opacity: 0.14 },
  { offset: '100%', color: '#3C78FF', opacity: 0 },
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

// ─── Glow orb ─────────────────────────────────────────────────────────────────
function GlowOrb({
  gradientId,
  stops,
  tx,
  ty,
}: {
  gradientId: string;
  stops: readonly { offset: string; color: string; opacity: number }[];
  tx: Animated.AnimatedInterpolation<number>;
  ty: Animated.AnimatedInterpolation<number>;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[s.orb, { transform: [{ translateX: tx }, { translateY: ty }] }]}
    >
      <Svg width={ORB_SIZE} height={ORB_SIZE}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            {stops.map((st) => (
              <Stop key={st.offset} offset={st.offset} stopColor={st.color} stopOpacity={st.opacity} />
            ))}
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
  orangeOrbit: Orbit | null;
  blueOrbit: Orbit | null;
  orangeClock: Animated.Value;
  blueClock: Animated.Value;
};

export function CipherField({ width, height, t, orangeOrbit, blueOrbit, orangeClock, blueClock }: Props) {
  const cells = React.useMemo<Cell[]>(() => {
    if (width <= 0 || height <= 0 || !orangeOrbit || !blueOrbit) return [];

    const spacing = 20;
    const cols = Math.max(1, Math.ceil(width / spacing));
    const rows = Math.max(1, Math.ceil(height / spacing));
    const rand = mulberry32(20260711);
    const density = 0.65;

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

  const orangeX = orangeClock.interpolate({ inputRange: orangeOrbit.input, outputRange: orangeOrbit.xs.map((v) => v - ORB_SIZE / 2) });
  const orangeY = orangeClock.interpolate({ inputRange: orangeOrbit.input, outputRange: orangeOrbit.ys.map((v) => v - ORB_SIZE / 2) });
  const blueX = blueClock.interpolate({ inputRange: blueOrbit.input, outputRange: blueOrbit.xs.map((v) => v - ORB_SIZE / 2) });
  const blueY = blueClock.interpolate({ inputRange: blueOrbit.input, outputRange: blueOrbit.ys.map((v) => v - ORB_SIZE / 2) });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg, overflow: 'hidden' }]} pointerEvents="none">
      <GlowOrb gradientId="agentGlowOrange" stops={ORANGE_STOPS} tx={orangeX} ty={orangeY} />
      <GlowOrb gradientId="agentGlowBlue" stops={BLUE_STOPS} tx={blueX} ty={blueY} />

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
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  char: {
    position: 'absolute',
    fontFamily: MONO,
  },
});
