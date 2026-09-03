import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The lit gradient edge, spinning clockwise forever.
 *
 * This lived inside Home's AgentV2 as the prompt card's border. It was pulled
 * out when the bottom tab bar was asked for "the same as the prompt" — the
 * only way to make that literally true is for both to be this component, not
 * two implementations that agree today.
 *
 * HOW IT WORKS. The gradient view is sized to the host's own DIAGONAL and
 * centred before it rotates: a square that size covers the host's bounding
 * box at every angle (its inscribed circle — the one guarantee independent of
 * rotation — has to reach the corners), so nothing outside the lit band is
 * ever exposed as the sweep comes round.
 *
 * This component does NOT mask itself down to a stroke. It fills its parent,
 * and the caller does the masking: a wrapper with `overflow: hidden` and
 * `padding` equal to the border width, with an opaque child on top. That is
 * `ringMask`/`cardInner` in AgentV2 and `ring`/`inner` in GlowTabBar.
 *
 * A caller wanting most of the edge dark between sweeps passes a fully
 * transparent tail stop pulled in early via `locations`, so the ring sits at
 * flat zero alpha rather than dissolving slowly enough to read as a faint
 * border everywhere.
 */
const DEFAULT_SPIN_MS = 6000;

export function RotatingBorderGradient({
  colors,
  locations,
  durationMs = DEFAULT_SPIN_MS,
}: {
  colors: [string, string, ...string[]];
  locations: [number, number, ...number[]];
  /** Time for one full turn. Longer reads calmer; the tab bar runs slower
   *  than the prompt card because it is on screen on every single route. */
  durationMs?: number;
}) {
  const [box, setBox] = React.useState({ width: 0, height: 0 });
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: durationMs,
        easing: ReanimatedEasing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, [rotation, durationMs]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const diag = Math.ceil(Math.hypot(box.width, box.height)) + 2;

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      {box.width > 0 && (
        <Reanimated.View
          style={[
            {
              position: 'absolute',
              width: diag,
              height: diag,
              left: (box.width - diag) / 2,
              top: (box.height - diag) / 2,
            },
            spinStyle,
          ]}
        >
          <LinearGradient
            colors={colors}
            locations={locations}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}
    </View>
  );
}
