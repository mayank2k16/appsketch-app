import * as React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { AppColors } from '@/lib/theme';

const DOTS = 3;
const STEP_MS = 220; // stagger between dots
const CYCLE_MS = 1320; // one dot's full up-and-down

/** The three squares that walk while the agent is thinking.
 *
 * Why this exists on top of the activity feed: the feed only moves when a STEP
 * arrives, and the gaps between steps are the long ones — a model call, an npm
 * install, a build. In those gaps the screen was completely still, which reads
 * as "it hung" rather than "it's working". This is the one element that is
 * always moving while a turn is live, and it sits at the very bottom of the
 * feed so it is what the eye lands on.
 *
 * Squares rather than circles, matching the web workspace's loader.
 */
export function ThinkingDots({
  colors,
  size = 6,
  color,
}: {
  colors: AppColors;
  size?: number;
  color?: string;
}) {
  // One driver per dot: they run the same animation, offset in time, which is
  // cheaper and steadier than interpolating one value into three phases.
  const values = React.useRef(
    Array.from({ length: DOTS }, () => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * STEP_MS),
          Animated.timing(v, {
            toValue: 1,
            duration: CYCLE_MS / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: CYCLE_MS / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          // Hold, so the group visibly pauses before walking again instead of
          // churning continuously (which is what makes a loader feel frantic).
          Animated.delay((DOTS - i) * STEP_MS),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values]);

  const tint = color ?? colors.codeEditorTimelineActive;

  return (
    <View
      style={st.row}
      accessibilityRole="progressbar"
      accessibilityLabel="Agent is working"
    >
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            st.dot,
            {
              width: size,
              height: size,
              borderRadius: size * 0.32,
              backgroundColor: tint,
              opacity: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0.28, 1],
              }),
              transform: [
                {
                  translateY: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -size * 0.7],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 12,
  },
  dot: {},
});
