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
 * Mobile | Tablet | Desktop as pills on top of a website's hero: a frosted
 * glass capsule (the live site blurs through it) with an orange thumb that
 * slides to the chosen device. The live site re-renders at that device's
 * width (live-preview.tsx). Mobile is the default.
 */

const SEG_W = 66; // the capsule clears the close X on a 375pt phone
const H = 34;
const PAD = 3;

const ICONS: Record<Device, React.ComponentProps<typeof Ionicons>['name']> = {
  mobile: 'phone-portrait-outline',
  tablet: 'tablet-portrait-outline',
  desktop: 'desktop-outline',
};

type Props = {
  value: Device;
  onChange: (d: Device) => void;
  dark: boolean;
  /** Shown before the segments, inside the capsule (the LIVE status). */
  lead?: React.ReactNode;
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
  lead,
}: Props) {
  const [leadW, setLeadW] = React.useState(0);
  const at = DEVICES.findIndex((d) => d.key === value);
  const pos = useDerivedValue(() =>
    withTiming(leadW + at * SEG_W, {
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
        {
          borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
        },
      ]}
    >
      <Glass dark={dark} />
      <Animated.View
        style={[s.thumb, { backgroundColor: BRAND_ORANGE }, thumb]}
      />
      {lead ? (
        <View
          style={s.lead}
          onLayout={(e) => setLeadW(e.nativeEvent.layout.width)}
        >
          {lead}
        </View>
      ) : null}
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
            style={s.seg}
          >
            <Ionicons name={ICONS[d.key]} size={13} color={color} />
            <Text style={[s.label, { color }]}>{d.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    height: H,
    padding: PAD,
    borderRadius: H / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: SEG_W,
    height: H - PAD * 2,
    borderRadius: (H - PAD * 2) / 2,
  },
  lead: { justifyContent: 'center' },
  seg: {
    width: SEG_W,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { fontFamily: F.sans700, fontSize: 11.5 },
});
