import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useHapticsEnabled } from '@/lib/hooks/use-haptics-enabled';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';

type Scheme = 'light' | 'dark';

const SEG_W = 52;
const SEG_H = 26;
const PAD = 2;
const SPRING = { damping: 20, stiffness: 320, mass: 0.7 };

const OPTIONS = [
  { value: 'light', label: 'White' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: Scheme; label: string }[];

/** Colours for the switch, per scheme. White: inset track, raised thumb on a
 *  hairline, no shadow (docs/white-theme.md). Dark: the drawer's own greys. */
const PALETTE = {
  light: {
    track: '#F4F4F2',
    trackBorder: '#E7E7E4',
    thumb: '#FFFFFF',
    thumbBorder: '#E7E7E4',
    on: '#0B0B0C',
    off: '#9C9DA3',
  },
  dark: {
    track: 'rgba(255,255,255,0.06)',
    trackBorder: 'rgba(255,255,255,0.08)',
    thumb: 'rgba(255,255,255,0.16)',
    thumbBorder: 'rgba(255,255,255,0.10)',
    on: '#FFFFFF',
    off: 'rgba(255,255,255,0.45)',
  },
} as const;

/**
 * The drawer's compact two-option segmented switch: a spring-animated thumb
 * over a track, styled per on-screen scheme. Pressing the active segment
 * taps; picking the other one calls `onChange` (which owns the haptic).
 */
function SegmentSwitch<T extends string>({
  scheme,
  value,
  options,
  onChange,
  label,
}: {
  scheme: Scheme;
  value: T;
  options: readonly [{ value: T; label: string }, { value: T; label: string }];
  onChange: (next: T) => void;
  label: string;
}) {
  const c = PALETTE[scheme];
  const second = options[1].value;
  const x = useSharedValue(value === second ? SEG_W : 0);

  React.useEffect(() => {
    x.value = withSpring(value === second ? SEG_W : 0, SPRING);
  }, [value, second, x]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const choose = (next: T) => {
    if (next === value) return;
    x.value = withSpring(next === second ? SEG_W : 0, SPRING);
    onChange(next);
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        st.track,
        { backgroundColor: c.track, borderColor: c.trackBorder },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          st.thumb,
          { backgroundColor: c.thumb, borderColor: c.thumbBorder },
          thumbStyle,
        ]}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => choose(o.value)}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${label}: ${o.label}`}
            style={st.seg}
          >
            <Text style={[st.label, { color: active ? c.on : c.off }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The user-facing dark-mode setting: a compact White | Dark segmented switch
 * with a spring-animated thumb and a toggle haptic. It writes through
 * `useSelectedTheme`, so the choice is persisted and applied app-wide.
 *
 * `scheme` is the scheme currently on screen, which is what the thumb shows —
 * a stored 'system' resolves to whatever the phone is using right now.
 */
export function AppearanceSwitch({ scheme }: { scheme: Scheme }) {
  const { setSelectedTheme } = useSelectedTheme();
  return (
    <SegmentSwitch
      scheme={scheme}
      value={scheme}
      options={OPTIONS}
      label="Appearance"
      onChange={(next) => {
        haptic.toggle(next === 'dark');
        setSelectedTheme(next);
      }}
    />
  );
}

const HAPTIC_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
] as const;

/**
 * Off | On for the app's haptics, same look as the Appearance switch.
 * Turning off ticks once on the way out; turning on answers with
 * `toggle(true)` (from `useHapticsEnabled`).
 */
export function HapticsSwitch({ scheme }: { scheme: Scheme }) {
  const [enabled, setEnabled] = useHapticsEnabled();
  return (
    <SegmentSwitch
      scheme={scheme}
      value={enabled ? 'on' : 'off'}
      options={HAPTIC_OPTIONS}
      label="Haptics"
      onChange={(next) => {
        if (next === 'off') haptic.toggle(false);
        setEnabled(next === 'on');
      }}
    />
  );
}

const st = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: (SEG_H + PAD * 2) / 2,
    borderWidth: 1,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    width: SEG_W,
    height: SEG_H,
    borderRadius: SEG_H / 2,
    borderWidth: 1,
  },
  seg: {
    width: SEG_W,
    height: SEG_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: F.sans600,
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
});
