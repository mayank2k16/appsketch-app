import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';

/**
 * The metal rim shared by the phone and browser frames — the appsketch.ai
 * landing-page device: brushed SILVER in white, GRAPHITE in dark, laid at
 * ~150° with one faint hairline at its outer edge. No drop shadow (white
 * theme rule): the rim's own light/dark bands are the depth.
 */

const SILVER = ['#fbfbfc', '#cfd0d4', '#efeff1', '#b5b7bb', '#e2e3e6'] as const;
const SILVER_AT = [0, 0.2, 0.46, 0.74, 1] as const;
const GRAPHITE = ['#4a4b50', '#1d1e21', '#3c3d42', '#202124'] as const;
const GRAPHITE_AT = [0, 0.34, 0.66, 1] as const;

// CSS 150deg: the unit vector (sin 150°, −cos 150°) through the box centre.
const START = { x: 0.25, y: 0.067 };
const END = { x: 0.75, y: 0.933 };

type RimProps = {
  dark: boolean;
  style: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export const Rim = React.memo(function Rim({
  dark,
  style,
  children,
}: RimProps) {
  return (
    <LinearGradient
      colors={dark ? GRAPHITE : SILVER}
      locations={dark ? GRAPHITE_AT : SILVER_AT}
      start={START}
      end={END}
      style={[s.rim, style]}
    >
      {children}
    </LinearGradient>
  );
});

const s = StyleSheet.create({
  rim: {
    overflow: 'hidden',
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: 'rgba(30,32,38,0.24)',
  },
});
