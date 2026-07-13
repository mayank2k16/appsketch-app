import * as React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import { CHAR_INFLUENCE_RADIUS, ORB_SIZE, type Orbit, proximityCurve } from './orbits';

/**
 * CipherField — dark backdrop scattered with cipher-like characters, with two
 * soft glow orbs (orange + blue) that drift slowly clockwise. Characters are
 * invisible by default and only fade in when a glow actually passes near them
 * — there is no always-on dim layer.
 *
 * Motion + highlight are both precomputed once (useMemo) as ~32-point orbit
 * checkpoints, then driven by a single looping `Animated.Value` per orb (owned
 * by `AgentScreen`, passed in as props so `PromptBar` can react to the same
 * clocks) via `interpolate` — entirely on the native thread, no per-frame JS
 * work.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
            <Stop offset="22%" stopColor={color} stopOpacity={0.42} />
            <Stop offset="48%" stopColor={color} stopOpacity={0.24} />
            <Stop offset="75%" stopColor={color} stopOpacity={0.09} />
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
  orangeOrbit: Orbit | null;
  blueOrbit: Orbit | null;
  orangeClock: Animated.Value;
  blueClock: Animated.Value;
};

export function CipherField({ width, height, t, orangeOrbit, blueOrbit, orangeClock, blueClock }: Props) {
  const cells = React.useMemo<Cell[]>(() => {
    if (width <= 0 || height <= 0 || !orangeOrbit || !blueOrbit) return [];

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

        const oCurve = proximityCurve(x, y, orangeOrbit, CHAR_INFLUENCE_RADIUS);
        const bCurve = proximityCurve(x, y, blueOrbit, CHAR_INFLUENCE_RADIUS);

        let glow: Cell['glow'] = null;
        let curve: number[] | null = null;
        if (oCurve.minDist < CHAR_INFLUENCE_RADIUS || bCurve.minDist < CHAR_INFLUENCE_RADIUS) {
          if (oCurve.minDist <= bCurve.minDist) {
            glow = 'orange';
            curve = oCurve.curve;
          } else {
            glow = 'blue';
            curve = bCurve.curve;
          }
        }

        // Cells no orbit ever comes near are skipped entirely — nothing is
        // drawn there, matching "only visible when the glow hits it".
        if (!glow) continue;

        arr.push({ key: `${r}-${c}`, x, y, char, fontSize, glow, curve });
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
      <GlowOrb gradientId="agentGlowOrange" color={t.agentGlowOrange} tx={orangeX} ty={orangeY} />
      <GlowOrb gradientId="agentGlowBlue" color={t.agentGlowBlue} tx={blueX} ty={blueY} />

      {/* Characters only exist where a glow can reach them, and their
          opacity is driven entirely by that glow's own clock — nothing is
          visible until the orb actually approaches. */}
      {cells.map((cell) => {
        const clock = cell.glow === 'orange' ? orangeClock : blueClock;
        const orbit = cell.glow === 'orange' ? orangeOrbit : blueOrbit;
        const color = cell.glow === 'orange' ? t.agentGlowOrange : t.agentGlowBlue;
        const opacity = clock.interpolate({ inputRange: orbit.input, outputRange: cell.curve! });
        return (
          <Animated.Text
            key={cell.key}
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
