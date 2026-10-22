import * as React from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CLOCK_MS } from '@/components/splash/white-collage';
import { appTheme } from '@/lib/theme';

/** When each part arrives (ms after mount). The buttons come up once the
 *  collage's tiles have settled. */
export const WELCOME_T = {
  icon: 420,
  word: 600,
  tagline: 720,
  actions: 980,
  step: 70,
} as const;

const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** The collage clock: 0 → CLOCK_MS, linear, on the UI thread. */
export function useCollageClock() {
  const clock = useSharedValue(0);
  React.useEffect(() => {
    clock.value = withTiming(CLOCK_MS, {
      duration: CLOCK_MS,
      easing: Easing.linear,
    });
  }, [clock]);
  return clock;
}

/** Rises `from` px into place: text rises out of a clipped slot, buttons
 *  from below the screen edge. Movement only, never a fade. */
export function useRiseIn(delay: number, from: number) {
  const p = useSharedValue(0);
  React.useEffect(() => {
    p.value = withDelay(
      delay,
      withTiming(1, { duration: 760, easing: EXPO_OUT })
    );
  }, [p, delay]);
  return useAnimatedStyle(() => ({
    transform: [{ translateY: from * (1 - p.value) }],
  }));
}

/** Springs in from nothing (the icon, the Skip pill). */
export function useSpringIn(delay: number) {
  const p = useSharedValue(0);
  React.useEffect(() => {
    p.value = withDelay(
      delay,
      withSpring(1, { damping: 14, stiffness: 170, mass: 0.8 })
    );
  }, [p, delay]);
  return useAnimatedStyle(() => ({ transform: [{ scale: p.value }] }));
}

export function welcomeTheme(dark: boolean) {
  const t = appTheme[dark ? 'dark' : 'light'];
  return {
    bg: t.bg,
    ink: t.authHeading,
    sub: t.authSub,
    googleBg: t.authSecondaryBg,
    googleBorder: t.authSecBorder,
    googleText: t.authSecText,
    primaryBg: t.authPrimaryBg,
    primaryText: t.authPrimaryText,
    terms: t.authFooter,
    termsLink: t.authFooterLink,
    statusBar: t.statusBar,
  };
}

export type WelcomeTheme = ReturnType<typeof welcomeTheme>;
