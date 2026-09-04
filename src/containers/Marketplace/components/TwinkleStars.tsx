/* eslint-disable unicorn/filename-case --
   Matches the PascalCase convention every sibling component in this
   directory already uses (TemplateCard.tsx, TemplateCardSkeleton.tsx,
   Skeleton.tsx). */
import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

type Star = { x: number; y: number; r: number; opacity: number; phase: number };

// Three out-of-phase groups, same trick as the Home hero's TwinkleDots — one
// animation driver per group instead of one per star, scattered rather than
// pulsing in lockstep.
const PHASES = 3;
// A handful of the brightest stars get a soft halo behind their core, the
// one thing a flat dot field can't fake — that's the "high fidelity" bit.
const HALO_COUNT = 6;

function makeField(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      opacity: 0.35 + Math.random() * 0.55,
      phase: i % PHASES,
    });
  }
  // Brightest/largest first, so slicing the front gives the halo to stars
  // that would read as foreground anyway.
  return stars.sort((a, b) => b.r - a.r);
}

function StarLayer({
  stars,
  index,
  color,
}: {
  stars: Star[];
  index: number;
  color: string;
}) {
  const v = useSharedValue(0);

  React.useEffect(() => {
    v.value = withDelay(
      index * 700,
      withRepeat(
        withTiming(1, {
          duration: 1700 + index * 550,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    return () => cancelAnimation(v);
  }, [v, index]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + 0.5 * v.value,
  }));

  return (
    <Reanimated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        {stars.map((s, i) => (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={color}
            opacity={s.opacity}
          />
        ))}
      </Svg>
    </Reanimated.View>
  );
}

/** A scattered, twinkling starfield — the Marketplace background in place of
 * the old pair of blurred brand-colour circles. Positions are randomised
 * once per mount (`useMemo`, no seed) since this is decorative and never
 * needs to reproduce the same field twice. */
export function TwinkleStars({
  width,
  height,
  color,
  count = 90,
}: {
  width: number;
  height: number;
  color: string;
  count?: number;
}) {
  const isFocused = useIsFocused();
  const stars = React.useMemo(
    () => makeField(width, height, count),
    [width, height, count]
  );
  const layers = React.useMemo(
    () =>
      Array.from({ length: PHASES }, (_, i) =>
        stars.filter((s) => s.phase === i)
      ),
    [stars]
  );
  const haloStars = React.useMemo(
    () => stars.slice(0, Math.min(HALO_COUNT, stars.length)),
    [stars]
  );

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {haloStars.map((s, i) => (
          <Circle
            key={`halo-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * 4}
            fill={color}
            opacity={0.1}
          />
        ))}
      </Svg>
      {isFocused &&
        layers.map((layerStars, i) => (
          <StarLayer key={i} stars={layerStars} index={i} color={color} />
        ))}
    </View>
  );
}
