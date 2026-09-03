/**
 * SlidingFill — the moving brand fill behind a segmented control.
 *
 * Both prompt composers (Home's `AgentV2`, rendered twice, and the Agent
 * tab's `AppTypePills`) have a Web/Mobile switch, and both were lighting one
 * segment while extinguishing the other. That reads as two independent
 * buttons. A single fill that TRAVELS reads as one control with one selection
 * in it, and travelling is only convincing if both switches move identically
 * — hence one component rather than the same easing typed twice.
 *
 * The caller owns the track and the labels; this owns only the fill and its
 * motion. Position it in a container with `position: relative`.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { brandGradient } from '@/lib/theme';

/** One slide. Long enough to read as the fill MOVING rather than as a colour
 *  swap, short enough not to lag the tap that caused it. */
export const SLIDE_MS = 260;

type Props = {
  /** How many segments share the track. */
  count: number;
  /** Which one is selected. */
  index: number;
  /** Usable track width — the container's width minus its own padding. */
  trackWidth: number;
  /** Corner radius of the fill itself. */
  radius: number;
  /** Inset from the track's edges. Defaults to 0 for borderless tracks. */
  inset?: number;
};

export function SlidingFill({
  count,
  index,
  trackWidth,
  radius,
  inset = 0,
}: Props) {
  // Driven off the selected index rather than off a tap handler, so the fill
  // also animates when the selection changes from outside the control.
  const progress = useDerivedValue(
    () =>
      withTiming(index < 0 ? 0 : index, {
        duration: SLIDE_MS,
        // Decelerating: the fill leaves promptly and settles softly, which is
        // what makes it read as weight sliding rather than a linear wipe.
        easing: Easing.out(Easing.cubic),
      }),
    [index]
  );

  const segment = trackWidth > 0 ? trackWidth / count : 0;

  const style = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: progress.value * segment }],
  }));

  if (segment <= 0) return null;

  return (
    <Reanimated.View
      pointerEvents="none"
      style={[
        s.fill,
        { left: inset, top: inset, bottom: inset, borderRadius: radius },
        style,
      ]}
    >
      <LinearGradient
        colors={brandGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Reanimated.View>
  );
}

const s = StyleSheet.create({
  // Absolute, so it slides UNDER the labels instead of displacing them.
  fill: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
