import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { homeTheme } from '../theme/HomeTheme';

const LOGO = require('../../../../assets/logo.png');

type Props = {
  onMenuPress: () => void;
};

// ─── Hamburger icon ────────────────────────────────────────────────────────────
function HamburgerIcon({ color }: { color: string }) {
  return (
    <View style={hb.wrap}>
      <View style={[hb.line, { backgroundColor: color }]} />
      <View style={[hb.line, hb.mid, { backgroundColor: color }]} />
      <View style={[hb.line, { backgroundColor: color }]} />
    </View>
  );
}

const hb = StyleSheet.create({
  wrap: { gap: 5, paddingVertical: 4 },
  line: { width: 22, height: 2, borderRadius: 2 },
  mid: { width: 16 },
});

// ─── HomeHeader ───────────────────────────────────────────────────────────────
export function HomeHeader({ onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = homeTheme[isDark ? 'dark' : 'light'];
  const user = useAuth.use.user();
  const userName = typeof user?.name === 'string' ? user.name : undefined;
  const userEmail = typeof user?.email === 'string' ? user.email : undefined;
  const displayName = userName
    ? userName.split(' ')[0]
    : userEmail
      ? userEmail.split('@')[0]
      : null;

  const topPad = Math.max(insets.top + 10, Platform.OS === 'android' ? 15 : 30);

  return (
    <View
      style={[
        s.header,
        {
          paddingTop: topPad,
        },
      ]}
    >

      {/* ── Left: logo + brand + greeting ── */}
      <View style={s.left}>
        <View style={s.logoWrap}>
          <ExpoImage
            source={LOGO}
            style={s.logo}
            contentFit="contain"
          />
        </View>
        <View style={s.brandBlock}>
          <Text style={[s.brandName, { color: t.text }]} numberOfLines={1}>
            Appsketch
          </Text>
          {displayName ? (
            <Text style={[s.greeting, { color: t.textMuted }]} numberOfLines={1}>
              Welcome, {displayName}
            </Text>
          ) : (
            <Text style={[s.greeting, { color: t.textMuted }]} numberOfLines={1}>
              Authentic Chinese Cuisine
            </Text>
          )}
        </View>
      </View>

      {/* ── Right: menu button ── */}
      <TouchableOpacity
        onPress={onMenuPress}
        style={[s.menuBtn, { backgroundColor: t.accentSoft, borderColor: t.border }]}
        activeOpacity={0.7}
      >
        <HamburgerIcon color={t.accent} />
      </TouchableOpacity>
    </View>
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
    transform: [{ scale: 2.2 }],
  },
  logo: {
    width: 40,
    height: 40,
    marginTop: 1
  },
  brandBlock: {
    flex: 1,
  },
  brandName: {
    fontFamily: F.sans700,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  greeting: {
    fontFamily: F.sans400,
    fontSize: 11,
    marginTop: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
