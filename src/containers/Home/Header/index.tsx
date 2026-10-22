import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { PressableScale } from '@/components/ui';
import { PlanBadge } from '@/components/ui/PlanBadge';
import { F } from '@/lib/fonts';
import { homeTheme } from '../theme/HomeTheme';

const LOGO = require('../../../../assets/logo.png');

type Props = {
  onMenuPress: () => void;
};

// ─── HomeHeader ───────────────────────────────────────────────────────────────
export function HomeHeader({ onMenuPress }: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = homeTheme[isDark ? 'dark' : 'light'];

  const user = useAuth.use.user();
  const subscription = getUserSubscription(user);

  const topPad = Math.max(insets.top + 10, Platform.OS === 'android' ? 15 : 20);

  return (
    <View
      style={[
        s.header,
        {
          paddingTop: topPad,
        },
      ]}
    >

      {/* ── Left: logo + wordmark — single tight row, no subtitle ── */}
      <View style={s.left}>
        <View style={s.logoWrap}>
          <ExpoImage
            source={LOGO}
            style={s.logo}
            contentFit="contain"
          />
        </View>
        <Text style={[s.brandName, { color: t.text }]}>
          AppSketch
        </Text>
        {subscription?.active && <PlanBadge tier={subscription.plan.tier} />}
      </View>

      {/* ── Right: menu button — avatar-with-settings badge, still opens the drawer ── */}
      <PressableScale
        onPress={onMenuPress}
        accessibilityLabel="Open menu"
        style={[s.menuBtn, { backgroundColor: t.agentBtnBg, borderColor: t.agentBtnBorder }]}
      >
        <Ionicons name="person" size={16} color={t.text} />
        {/* White: an ink badge — orange is kept for the screen's one key action. */}
        <View style={[s.menuBadge, { backgroundColor: isDark ? t.accent : t.text, borderColor: t.bg }]}>
          <Ionicons name="settings-sharp" size={9} color="#FFFFFF" />
        </View>
      </PressableScale>
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
    transform: [{ scale: 2 }],
  },
  logo: {
    width: 40,
    height: 40,
    marginTop: 1
  },
  brandName: {
    fontFamily: F.sans800,
    fontSize: 19,
    letterSpacing: 1.1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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
