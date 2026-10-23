import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedTotal, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { Planner } from './use-planner';

/** The dark running-total bar: what is picked, the counting total and the
 *  orange "Review & checkout". Empty state when nothing is picked. */
export function SummaryBar({ s, pl }: { s: ServicesPalette; pl: Planner }) {
  const empty = !pl.unlocked;
  return (
    <LinearGradient
      colors={s.barGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={st.bar}
    >
      <View style={st.sum}>
        <Text style={[st.label, { color: s.barText }]} numberOfLines={1}>
          {empty ? 'Nothing selected yet' : pl.label}
        </Text>
        {empty ? (
          <Text style={[st.sub, { color: s.barSub }]} numberOfLines={1}>
            Pick a build to see your one-time total.
          </Text>
        ) : (
          <AnimatedTotal
            value={pl.total}
            suffix=" one-time"
            style={[st.total, { color: s.barSub }]}
          />
        )}
      </View>
      <PressableScale
        onPress={pl.checkout}
        disabled={empty}
        disabledOpacity={0.45}
        style={[st.btn, { backgroundColor: s.orange }]}
        accessibilityLabel="Review and checkout"
      >
        <Text style={[st.btnText, { color: s.onOrange }]}>
          Review & checkout
        </Text>
        <Ionicons name="arrow-forward" size={14} color={s.onOrange} />
      </PressableScale>
    </LinearGradient>
  );
}

/**
 * The same bar pinned above the tab bar while the in-card bar is off screen
 * (anything picked). Visibility is derived from the scroll offset on the UI
 * thread — no React render while scrolling.
 */
export function StickySummary({
  s,
  pl,
  scrollY,
  inlineY,
  viewH,
  bottom,
}: {
  s: ServicesPalette;
  pl: Planner;
  scrollY: SharedValue<number>;
  inlineY: SharedValue<number>;
  viewH: SharedValue<number>;
  bottom: number;
}) {
  const picked = pl.unlocked;
  const show = useDerivedValue(() => {
    if (!picked || inlineY.value <= 0) return 0;
    const top = inlineY.value - scrollY.value;
    const visible = top > 40 && top < viewH.value - bottom - 70;
    return visible ? 0 : 1;
  });
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(show.value, { duration: 200 }),
    transform: [
      { translateY: withTiming(show.value ? 0 : 160, { duration: 260 }) },
    ],
  }));
  return (
    <Animated.View
      pointerEvents={picked ? 'box-none' : 'none'}
      style={[st.sticky, { bottom, backgroundColor: s.canvas }, style]}
    >
      <SummaryBar s={s} pl={pl} />
    </Animated.View>
  );
}

const st = StyleSheet.create({
  bar: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sum: { flex: 1 },
  label: { fontFamily: F.sans700, fontSize: 13.5 },
  sub: { fontFamily: F.sans500, fontSize: 11.5, marginTop: 2 },
  total: { fontFamily: F.sans600, fontSize: 12.5, marginTop: 2 },
  btn: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnText: { fontFamily: F.sans700, fontSize: 12.5 },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
});
