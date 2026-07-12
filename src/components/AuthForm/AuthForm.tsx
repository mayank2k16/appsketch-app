import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInAsGuest, useGoogleSignIn } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { AuthSheet } from './AuthSheet';
import { loginTheme } from './AuthTheme';

// ─────────────────────────────────────────────────────────────
// AuthForm — the bottom auth panel only (Welcome + the three
// Continue buttons + legal/guest). The montage above lives in the
// login screen; this component owns everything auth-related.
// ─────────────────────────────────────────────────────────────
export function AuthForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = loginTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  const goHome = React.useCallback(() => router.replace('/home'), [router]);

  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [method, setMethod] = React.useState<'email' | 'phone'>('phone');

  const { signInWithGoogle, loading: googleLoading } = useGoogleSignIn(goHome);

  // gentle entrance for the panel
  const enter = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 650, delay: 120,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [enter]);

  const panelStyle = {
    opacity: enter,
    transform: [{
      translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
    }],
  };

  function openSheet(m: 'email' | 'phone') {
    setMethod(m);
    setSheetVisible(true);
  }

  return (
    <Animated.View
      style={[s.panel, panelStyle, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
    >
      <Text style={[s.heading, { color: t.heading }]}>Build Stunning Websites and Apps</Text>
      <Text style={[s.sub, { color: t.sub }]}>Your journey starts from here</Text>

      {/* Primary — Phone */}
      <Pressable
        onPress={() => openSheet('phone')}
        style={({ pressed }) => [
          s.btn,
          { backgroundColor: t.primaryBg },
          pressed && s.btnPressed,
        ]}
      >
        <Text style={[s.btnLabel, { color: t.primaryText }]}>Continue with Phone</Text>
      </Pressable>

      {/* Secondary — Email */}
      <Pressable
        onPress={() => openSheet('email')}
        style={({ pressed }) => [
          s.btn, s.btnSecondary,
          { backgroundColor: t.secondaryBg, borderColor: t.secondaryBorder },
          pressed && s.btnPressed,
        ]}
      >
        <Ionicons name="mail-outline" size={18} color={t.secondaryIcon} style={s.btnIcon} />
        <Text style={[s.btnLabel, { color: t.secondaryText }]}>Continue with Email</Text>
      </Pressable>

      {/* Secondary — Gmail / Google */}
      {/* <Pressable
        onPress={signInWithGoogle}
        disabled={googleLoading}
        style={({ pressed }) => [
          s.btn, s.btnSecondary,
          { backgroundColor: t.secondaryBg, borderColor: t.secondaryBorder },
          pressed && s.btnPressed,
          googleLoading && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="logo-google" size={18} color={t.secondaryIcon} style={s.btnIcon} />
        <Text style={[s.btnLabel, { color: t.secondaryText }]}>Continue with Google</Text>
      </Pressable> */}

      <Text style={[s.footer, { color: t.footer }]}>
        By pressing on “Continue with…” you agree to our{' '}
        <Text style={{ color: t.footerLink, textDecorationLine: 'underline' }}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={{ color: t.footerLink, textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Text>

      <AuthSheet
        visible={sheetVisible}
        method={method}
        onClose={() => setSheetVisible(false)}
        onSuccess={goHome}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  panel: {
    paddingVertical: 26,
    paddingHorizontal: 26,
    marginTop: "auto",
    backgroundColor: "rgb(21, 21, 23)"
  },
  heading: {
    fontSize: 30,
    fontFamily: F.display900,
    letterSpacing: -0.6,
    lineHeight: 33,
    paddingLeft: 5,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    fontFamily: F.sans400,
    marginTop: 10,
    marginBottom: 22,
    paddingLeft: 5,
    textAlign: "center",
  },

  btn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  btnIcon: { marginRight: 8 },
  btnLabel: {
    fontSize: 15,
    fontFamily: F.sans700,
    letterSpacing: 0.2,
  },

  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: F.sans400,
    lineHeight: 16,
  },

  guestBtn: { marginTop: 16, alignSelf: 'center' },
  guest: { fontSize: 13, fontFamily: F.sans600 },
});
