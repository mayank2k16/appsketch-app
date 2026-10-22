import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, StatusBar, StyleSheet } from 'react-native';

import { LogoSplash, SPLASH_T } from '@/components/splash/logo-splash';
import { hydrateAuth, useAuth } from '@/hooks/useAuth';
import { appTheme } from '@/lib/theme';

/** Leaves the splash once: to /home when signed in, else to /welcome. */
function useSplashExit() {
  const router = useRouter();
  const navigated = React.useRef(false);
  return React.useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    const authStatus = useAuth.getState().status;
    const isLoggedOut = authStatus === 'guest' || authStatus === 'signOut';
    router.replace(isLoggedOut ? '/welcome' : '/home');
  }, [router]);
}

/**
 * Hides the native launch screen and reports when it is gone. The Lottie
 * mounts only after that: the launch screen covers the first seconds of a
 * cold start, and an animation (and its timers) started underneath it played
 * unseen, then exited the moment it showed.
 */
function useNativeSplashGone() {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    hydrateAuth();
    let alive = true;
    const reveal = () => {
      if (alive) setShown(true);
    };
    // A hide asked for before the native root view has attached its launch
    // screen is lost, so ask again shortly after; extra calls are no-ops.
    const hide = () => SplashScreen.hideAsync().catch(() => {});
    hide().then(reveal);
    const retries = [120, 400, 900].map((ms) => setTimeout(hide, ms));
    // Never wait on the native splash for longer than this.
    const safety = setTimeout(reveal, 1500);
    return () => {
      alive = false;
      clearTimeout(safety);
      retries.forEach(clearTimeout);
    };
  }, []);

  return shown;
}

/** Light content over the launch orange; dark once the sweep has passed the
 *  status bar's right side (the clock side is still orange then, where dark
 *  content reads fine). */
function useSplashBarStyle(shown: boolean) {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    if (!shown) return undefined;
    const t = setTimeout(() => setDark(true), SPLASH_T.statusDark);
    return () => clearTimeout(t);
  }, [shown]);
  return dark ? 'dark-content' : 'light-content';
}

/**
 * The in-app splash, the same in both themes: it picks up the native launch
 * screen's exact picture (solid orange), the warm canvas sweeps in clockwise
 * while the orange gathers into the logo's dot, the logo's pencil draws the
 * logo from it, then it irises into the theme's canvas, where /welcome
 * (signed out) or /home begins. Tap anywhere to skip.
 */
export default function BrandSplashScreen() {
  const { colorScheme } = useColorScheme();
  const canvas = appTheme[colorScheme === 'dark' ? 'dark' : 'light'].bg;
  const doExit = useSplashExit();
  const shown = useNativeSplashGone();
  const barStyle = useSplashBarStyle(shown);

  React.useEffect(() => {
    if (!shown) return undefined;
    // Started synchronously, so it can never read a zero start time.
    const t = setTimeout(doExit, SPLASH_T.exit);
    return () => clearTimeout(t);
  }, [shown, doExit]);

  return (
    <Pressable
      style={[styles.screen, { backgroundColor: canvas }]}
      onPress={doExit}
      accessibilityLabel="Skip intro"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyle}
        animated
      />
      <LogoSplash shown={shown} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
});
