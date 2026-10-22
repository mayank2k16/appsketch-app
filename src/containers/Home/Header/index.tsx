import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { PlanBadge } from '@/components/ui/PlanBadge';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { CHROME_BLACK, chromeTone, INK_AT } from '@/lib/chrome-tone';
import { F } from '@/lib/fonts';

import { type HomeColors, homeTheme } from '../theme/HomeTheme';

const LOGO = require('../../../../assets/logo.png');

type Props = {
  onMenuPress: () => void;
};

type Tones = ReturnType<typeof useHeaderTone>;

/** The header follows `chromeTone` (0 = page theme, 1 = black) on the UI
 *  thread: background, wordmark, the menu button and its badge. */
function useHeaderTone(t: HomeColors, isDark: boolean) {
  // `tone` is read inside each updater (not only in this helper) so every
  // style subscribes to chromeTone — dependencies come from the updater's
  // own closure.
  const mix = (tone: number, a: string, b: string) => {
    'worklet';
    return interpolateColor(tone, [0, 1], [a, b]);
  };
  // Clear over the sliding container's solid page colour (and, in white,
  // its dot band) — Home/index.tsx `CollapsingHeader`.
  const clear = isDark ? 'rgba(0,0,0,0)' : 'rgba(250,250,248,0)';
  const badge = isDark ? t.accent : t.text;
  const root = useAnimatedStyle(() => ({
    backgroundColor: mix(chromeTone.value, clear, CHROME_BLACK.bg),
  }));
  const ink = useAnimatedStyle(() => ({
    color: interpolateColor(chromeTone.value, INK_AT, [
      t.text,
      t.text,
      CHROME_BLACK.ink,
      CHROME_BLACK.ink,
    ]),
  }));
  const btn = useAnimatedStyle(() => {
    const k = chromeTone.value;
    return {
      backgroundColor: mix(k, t.agentBtnBg, CHROME_BLACK.raised),
      borderColor: mix(k, t.agentBtnBorder, CHROME_BLACK.raisedEdge),
    };
  });
  const dot = useAnimatedStyle(() => {
    const k = chromeTone.value;
    return {
      backgroundColor: mix(k, badge, '#3A3A3D'),
      borderColor: mix(k, t.bg, CHROME_BLACK.bg),
    };
  });
  const night = useAnimatedStyle(() => ({
    opacity: interpolate(chromeTone.value, INK_AT, [0, 0, 1, 1]),
  }));
  const day = useAnimatedStyle(() => ({
    opacity: interpolate(chromeTone.value, INK_AT, [1, 1, 0, 0]),
  }));
  return { root, ink, btn, dot, day, night };
}

/** The person glyph, cross-faded between the page ink and white. */
function MenuGlyph({ tone, color }: { tone: Tones; color: string }) {
  return (
    <>
      <Animated.View style={[s.glyph, tone.day]}>
        <Ionicons name="person" size={16} color={color} />
      </Animated.View>
      <Animated.View style={[s.glyph, tone.night]}>
        <Ionicons name="person" size={16} color="#FFFFFF" />
      </Animated.View>
    </>
  );
}

// ─── HomeHeader ───────────────────────────────────────────────────────────────
export function HomeHeader({ onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = homeTheme[isDark ? 'dark' : 'light'];

  const user = useAuth.use.user();
  const subscription = getUserSubscription(user);

  const topPad = Math.max(insets.top + 10, Platform.OS === 'android' ? 15 : 20);
  const tone = useHeaderTone(t, isDark);

  return (
    <Animated.View style={[s.header, { paddingTop: topPad }, tone.root]}>
      {/* ── Left: logo + wordmark — single tight row, no subtitle ── */}
      <View style={s.left}>
        <View style={s.logoWrap}>
          <ExpoImage source={LOGO} style={s.logo} contentFit="contain" />
        </View>
        <Animated.Text style={[s.brandName, tone.ink]}>AppSketch</Animated.Text>
        {subscription?.active && <PlanBadge tier={subscription.plan.tier} />}
      </View>

      {/* ── Right: menu button — avatar-with-settings badge, still opens the drawer ── */}
      <PressableScale
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
        style={s.menuHit}
      >
        <Animated.View style={[s.menuBtn, tone.btn]}>
          <MenuGlyph tone={tone} color={t.text} />
          {/* White: an ink badge — orange is kept for the screen's one key action. */}
          <Animated.View style={[s.menuBadge, tone.dot]}>
            <Ionicons name="settings-sharp" size={9} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    transform: [{ scale: 2 }],
  },
  logo: {
    width: 40,
    height: 40,
    marginTop: 1,
  },
  brandName: {
    fontFamily: F.sans800,
    fontSize: 19,
    letterSpacing: 1.1,
  },
  menuHit: { marginLeft: 12 },
  glyph: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
