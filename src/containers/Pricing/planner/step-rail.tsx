import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { ServicesPalette } from '@/components/services';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';

const STEPS = ['Choose what we build', 'Add extras', 'Review & checkout'];
const DOT = 22;

/** A spring pop when a step becomes current; at step 3 (reached by a
 *  pick) an orange ring bursts out and a success haptic plays. */
function useDotMotion(on: boolean, n: number, cheer: boolean) {
  const pop = useSharedValue(1);
  const burst = useSharedValue(0);
  React.useEffect(() => {
    if (!on) return;
    pop.value = withSequence(
      withSpring(n === 3 ? 1.35 : 1.18, { damping: 8, stiffness: 420 }),
      withSpring(1, { damping: 12, stiffness: 260 })
    );
    if (n === 3 && cheer) {
      haptic.success();
      burst.value = 0;
      burst.value = withTiming(1, {
        duration: 650,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [on, n, cheer, pop, burst]);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: burst.value > 0 && burst.value < 1 ? 0.55 * (1 - burst.value) : 0,
    transform: [{ scale: 1 + burst.value * 1.4 }],
  }));
  return { dotStyle, ring };
}

function Dot({
  s,
  i,
  step,
  cheer,
}: {
  s: ServicesPalette;
  i: number;
  step: number;
  /** Reached step 3 by a pick (not by restoring the cart). */
  cheer: boolean;
}) {
  const n = i + 1;
  const done = step > n;
  const on = step === n;
  const { dotStyle, ring } = useDotMotion(on, n, cheer);
  const filled = done || on;
  return (
    <View style={st.col}>
      <View style={st.dotWrap}>
        <Animated.View style={[st.ring, { borderColor: s.orange }, ring]} />
        <Animated.View
          style={[
            st.dot,
            {
              backgroundColor: filled ? s.ink : s.inset,
              borderColor: filled ? s.ink : s.hairline,
            },
            dotStyle,
          ]}
        >
          {done ? (
            <Ionicons name="checkmark" size={13} color={s.onInk} />
          ) : (
            <Text style={[st.num, { color: on ? s.onInk : s.muted }]}>{n}</Text>
          )}
        </Animated.View>
      </View>
      <Text
        numberOfLines={2}
        style={[st.label, { color: filled ? s.text : s.muted }]}
      >
        {STEPS[i]}
      </Text>
    </View>
  );
}

/** 1 → 2 → 3 with a fill that grows as the visitor moves through. */
export function StepRail({ s, step }: { s: ServicesPalette; step: 1 | 2 | 3 }) {
  const [w, setW] = React.useState(0);
  // Previous-render value, the React way (no ref read during render).
  const [last, setLast] = React.useState(step);
  const [cheer, setCheer] = React.useState(false);
  if (last !== step) {
    setLast(step);
    setCheer(last === 2 && step === 3);
  }
  const fill = useAnimatedStyle(() => ({
    width: withTiming(((step - 1) / 2) * (w * (2 / 3)), {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    }),
  }));
  return (
    <View style={st.rail} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View
        style={[
          st.track,
          { left: w / 6, right: w / 6, backgroundColor: s.hairline },
        ]}
      />
      <Animated.View
        style={[st.fill, { left: w / 6, backgroundColor: s.ink }, fill]}
      />
      {STEPS.map((_, i) => (
        <Dot key={i} s={s} i={i} step={step} cheer={cheer} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  rail: { flexDirection: 'row', marginTop: 14, marginBottom: 4 },
  track: { position: 'absolute', top: DOT / 2 - 1, height: 2, borderRadius: 1 },
  fill: { position: 'absolute', top: DOT / 2 - 1, height: 2, borderRadius: 1 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  dotWrap: {
    width: DOT,
    height: DOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: F.sans700, fontSize: 11 },
  label: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    lineHeight: 13,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
