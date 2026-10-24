import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { F } from '@/lib/fonts';

import { type Device, DEVICES } from './live-url';
import { BRAND_ORANGE } from './theme';

/**
 * Mobile | Tablet | Desktop as pills (`compact`: icon-only, in the details
 * box's top row beside the tags): a frosted
 * glass capsule (the live site blurs through it) with an orange thumb that
 * slides to the chosen device. The live site re-renders at that device's
 * width (live-preview.tsx). Mobile is the default.
 */

const SIZES = {
  full: { seg: 64, h: 34, pad: 3, icon: 13 },
  compact: { seg: 36, h: 26, pad: 2, icon: 13 },
} as const;

const ICONS: Record<Device, React.ComponentProps<typeof Ionicons>['name']> = {
  mobile: 'phone-portrait-outline',
  tablet: 'tablet-portrait-outline',
  desktop: 'desktop-outline',
};

type Props = {
  value: Device;
  onChange: (d: Device) => void;
  dark: boolean;
  /** Icon-only and shorter, to sit in a row of chips. */
  compact?: boolean;
};

/** The capsule's frosted fill: a blur plus a light (or graphite) wash. */
function Glass({ dark }: { dark: boolean }) {
  return (
    <>
      <BlurView
        intensity={dark ? 40 : 60}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: dark
              ? 'rgba(17,17,19,0.35)'
              : 'rgba(255,255,255,0.45)',
          },
        ]}
      />
    </>
  );
}

export const DeviceSwitch = React.memo(function DeviceSwitch({
  value,
  onChange,
  dark,
  compact = false,
}: Props) {
  const z = SIZES[compact ? 'compact' : 'full'];
  const at = DEVICES.findIndex((d) => d.key === value);
  const pos = useDerivedValue(() =>
    withTiming(at * z.seg, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    })
  );
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value }],
  }));
  const ink = dark ? '#FFFFFF' : '#0B0B0C';
  return (
    <View
      style={[
        s.wrap,
        { height: z.h, padding: z.pad, borderRadius: z.h / 2 },
        {
          borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
        },
      ]}
    >
      <Glass dark={dark} />
      <Animated.View
        style={[
          s.thumb,
          {
            top: z.pad,
            left: z.pad,
            width: z.seg,
            height: z.h - z.pad * 2,
            borderRadius: (z.h - z.pad * 2) / 2,
            backgroundColor: BRAND_ORANGE,
          },
          thumb,
        ]}
      />
      {DEVICES.map((d) => {
        const on = d.key === value;
        const color = on ? '#FFFFFF' : ink;
        return (
          <Pressable
            key={d.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${d.label} view`}
            onPress={() => onChange(d.key)}
            hitSlop={compact ? 6 : 0}
            style={[s.seg, { width: z.seg }]}
          >
            <Ionicons name={ICONS[d.key]} size={z.icon} color={color} />
            {compact ? null : (
              <Text style={[s.label, { color }]}>{d.label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { position: 'absolute' },
  seg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { fontFamily: F.sans700, fontSize: 11.5 },
});
