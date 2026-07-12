import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Easing,
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

const LOGO = require('../../../../assets/chinese_corner.png');

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
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const user = useAuth.use.user();
  const userName = typeof user?.name === 'string' ? user.name : undefined;
  const userEmail = typeof user?.email === 'string' ? user.email : undefined;
  const displayName = userName
    ? userName.split(' ')[0]
    : userEmail
      ? userEmail.split('@')[0]
      : null;

  // Entrance slide-down
  const enterAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1, duration: 420, delay: 100,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, []);

  const headerStyle = {
    opacity: enterAnim,
    transform: [{
      translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }),
    }],
  };

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 15 : 30);

  return (
    <Animated.View
      style={[
        s.header,
        {
          paddingTop: topPad,
        },
        headerStyle,
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
    </Animated.View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    // position: "absolute",
    // top: 0,
    // width: "100%",
    // zIndex: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logo: {
    width: 40,
    height: 40,
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
