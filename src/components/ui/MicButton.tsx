/**
 * MicButton — the composer's voice control, with a listening indicator.
 *
 * This is the one control in the composer row that opens a live, LISTENING
 * surface, so it is the one that advertises itself. Everything either side of
 * it is a static circle, which is what lets a single moving element read as
 * "this is the voice one" rather than as noise. Shared by both composers so
 * the indicator is literally the same animation in Home and the Agent tab.
 *
 * The indicator is a pair of arcs sweeping outward from the glyph — the
 * `((( • )))` of sound leaving a source. It replaced a filled circle that
 * pulsed behind the button: at this size a growing disc read as a magenta
 * blob breathing under the icon, not as listening, and it put a second
 * coloured circle next to the send button it sits beside.
 *
 * Arcs rather than full rings, and only on the sides, so the motion reads as
 * emanating outward rather than as a target closing in on the mic.
 */
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { type AppColors, BRAND_MID } from '@/lib/theme';

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

/** One full emanation. Slow enough to read as breathing, not buzzing. */
const WAVE_MS = 1700;
/** How far apart the two arcs are in that cycle — the second sets off when
 *  the first is a third of the way out, so they read as a train of waves
 *  rather than two edges of one thick ring. */
const STAGGER = 0.33;

/** One side's arc at a given radius, drawn as a shallow vertical bracket. */
function arcPath({
  c,
  r,
  side,
}: {
  /** Centre of the button, in SVG units. */
  c: number;
  r: number;
  /** 1 draws the right-hand bracket, -1 the left. */
  side: 1 | -1;
}) {
  const dy = r * 0.72;
  const ends = c + side * r * 0.45;
  return `M ${ends} ${c - dy} Q ${c + side * r} ${c} ${ends} ${c + dy}`;
}

function Wave({
  phase,
  size,
  delay,
}: {
  phase: Reanimated.SharedValue<number>;
  size: number;
  delay: number;
}) {
  const c = size / 2;
  const rMin = size * 0.22;
  const rMax = size * 0.46;

  const props = useAnimatedProps(() => {
    // Each arc runs the same 0→1 sweep, offset — `% 1` wraps it so the
    // trailing arc is simply further along the identical path.
    const p = (phase.value + delay) % 1;
    const r = rMin + (rMax - rMin) * p;
    // Fades in quickly, then out across the rest of the sweep, so an arc is
    // never born or killed at full strength.
    const opacity = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
    return {
      d: `${arcPath({ c, r, side: 1 })} ${arcPath({ c, r, side: -1 })}`,
      opacity: opacity * 0.9,
    };
  });

  return (
    <AnimatedPath
      animatedProps={props}
      stroke={BRAND_MID}
      strokeWidth={1.3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

export function MicButton({
  t,
  onPress,
  size = 34,
  iconSize = 18,
}: {
  t: AppColors;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}) {
  const phase = useSharedValue(0);

  React.useEffect(() => {
    // Linear and wrapping: the arcs' own easing lives in their radius/opacity
    // curves, so the driver itself has to run at a constant rate or the wave
    // train would bunch up once per cycle.
    phase.value = withRepeat(
      withTiming(1, { duration: WAVE_MS, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(phase);
  }, [phase]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        s.btn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: t.agentBtnBg,
          borderColor: t.agentBtnBorder,
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size}>
          <Wave phase={phase} size={size} delay={0} />
          <Wave phase={phase} size={size} delay={STAGGER} />
        </Svg>
      </View>
      <Ionicons name="mic-outline" size={iconSize} color={t.agentBtnIcon} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Keeps the outermost arc inside the circle rather than poking past it.
    overflow: 'hidden',
  },
});
