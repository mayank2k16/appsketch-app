import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import type { PlanInterval } from '@/lib/iap';

import type { PricingPalette } from './theme';

const TRACK_W = 232;
const PAD = 3;
const TRACK_H = 42;
/** Absolute children sit inside the 1px border. */
const THUMB_W = (TRACK_W - 2 - PAD * 2) / 2;

type Props = {
  p: PricingPalette;
  sub: string;
  value: PlanInterval;
  saving: number;
  onChange: (v: PlanInterval) => void;
};

function Option({
  label,
  selected,
  color,
  onPress,
}: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={st.option}
      haptic={selected ? false : 'select'}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
    >
      <Text style={[st.optionText, { color }]}>{label}</Text>
    </PressableScale>
  );
}

/** Yearly / Monthly segmented pill (yearly first, as on the website) with a sliding ink thumb and the
 *  yearly saving (computed from the prices on screen) underneath. */
export function BillingToggle({ p, sub, value, saving, onChange }: Props) {
  const thumb = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(value === 'monthly' ? THUMB_W : 0, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }));
  return (
    <View style={st.wrap}>
      <View
        style={[
          st.track,
          { backgroundColor: p.track, borderColor: p.trackBorder },
        ]}
      >
        <Animated.View
          style={[st.thumb, { backgroundColor: p.thumb }, thumb]}
        />
        <Option
          label="Yearly"
          selected={value === 'yearly'}
          color={value === 'yearly' ? p.thumbText : sub}
          onPress={() => onChange('yearly')}
        />
        <Option
          label="Monthly"
          selected={value === 'monthly'}
          color={value === 'monthly' ? p.thumbText : sub}
          onPress={() => onChange('monthly')}
        />
      </View>
      {saving > 0 ? (
        <View style={[st.save, { backgroundColor: p.saveBg }]}>
          <Text style={[st.saveText, { color: p.saveText }]}>
            Save {saving}% with yearly
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  track: {
    flexDirection: 'row',
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    borderWidth: 1,
    padding: PAD,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: THUMB_W,
    height: TRACK_H - 2 - PAD * 2,
    borderRadius: (TRACK_H - 2 - PAD * 2) / 2,
  },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontFamily: F.sans600, fontSize: 13.5 },
  save: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  saveText: { fontFamily: F.sans700, fontSize: 11, letterSpacing: 0.2 },
});
