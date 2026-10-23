import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

import { F } from '@/lib/fonts';

import { type Device, DEVICES } from './live-url';
import type { PageTheme } from './theme';

/**
 * Mobile | Tablet | Desktop in the slim row under a website's hero: a capsule
 * in the panel colour with the panels' edge, and an ink thumb (white in
 * dark) that springs to the chosen device. The live site re-renders at
 * that device's width (live-preview.tsx). Mobile is the default.
 */

const SEG_W = 66;
const H = 32;
const PAD = 3;

type Props = {
  value: Device;
  onChange: (d: Device) => void;
  t: PageTheme;
  dark: boolean;
  /** Shown before the segments, inside the capsule (the LIVE status). */
  lead?: React.ReactNode;
};

export const DeviceSwitch = React.memo(function DeviceSwitch({
  value,
  onChange,
  t,
  dark,
  lead,
}: Props) {
  const [leadW, setLeadW] = React.useState(0);
  const at = DEVICES.findIndex((d) => d.key === value);
  const pos = useDerivedValue(() =>
    withSpring(leadW + at * SEG_W, { damping: 20, stiffness: 260 })
  );
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value }],
  }));
  return (
    <View
      style={[s.wrap, { backgroundColor: t.panel, borderColor: t.panelEdge }]}
    >
      <Animated.View style={[s.thumb, { backgroundColor: t.ink }, thumb]} />
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
        return (
          <Pressable
            key={d.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${d.label} view`}
            onPress={() => onChange(d.key)}
            style={s.seg}
          >
            <Text
              style={[
                s.label,
                { color: on ? (dark ? '#0B0B0C' : '#FFFFFF') : t.ink },
              ]}
            >
              {d.label}
            </Text>
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
    borderWidth: 1.5,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: SEG_W,
    height: H - PAD * 2 - 3,
    borderRadius: (H - PAD * 2 - 3) / 2,
  },
  lead: { justifyContent: 'center' },
  seg: { width: SEG_W, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.sans600, fontSize: 12 },
});
