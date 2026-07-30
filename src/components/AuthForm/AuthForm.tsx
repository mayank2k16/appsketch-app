import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInAsGuest } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { AuthSheet } from './AuthSheet';
import { loginTheme } from './AuthTheme';

const TOP_FADE_H = 200;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AuthForm() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = loginTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  // Prefer returning to whatever screen sent the user to login (e.g. Pricing,
  // Studio's gated screen) over always landing on Home. Only screens that
  // pushed `/login` onto the stack leave a back entry — flows that reach
  // login via a `replace` (splash, sign-out, the (app) route guard) have none,
  // so falling back to Home is the correct behaviour there.
  //
  // `splash` is never a valid back target: it's a one-shot screen that latches
  // `navigated` after its first exit, so going back to it leaves the user on a
  // screen that will never navigate away. Guard against it explicitly rather
  // than trusting `canGoBack()` alone.
  const goBack = React.useCallback(() => {
    const state = navigation.getState();
    const prevRoute = state?.routes?.[state.index - 1]?.name;
    if (router.canGoBack() && prevRoute && prevRoute !== 'splash') {
      router.back();
    } else {
      router.replace('/home');
    }
  }, [router, navigation]);

  // After a successful sign-in go straight to Home — a verified user should
  // land on the app, not be bounced back through the stack.
  const goHome = React.useCallback(() => {
    router.replace('/home');
  }, [router]);

  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [method, setMethod] = React.useState<'email' | 'phone'>('phone');

  function openSheet(m: 'email' | 'phone') {
    setMethod(m);
    setSheetVisible(true);
  }

  const fadeColors = React.useMemo(
    () =>
      [
        hexToRgba(t.panel, 0),
        hexToRgba(t.panel, 0),
        hexToRgba(t.panel, 0.5),
        hexToRgba(t.panel, 0.85),
        hexToRgba(t.panel, 0.97),
        t.panel,
      ] as [string, string, ...string[]],
    [t.panel]
  );

  const redirectToScreen = (path: string) => {
    router.push(path as any);
  };

  return (
    <View
      style={[s.panel, { backgroundColor: t.panel, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
    >
      {/* Seamless montage → panel dissolve. Sits just above the panel and ends
          in the exact panel colour, so no line shows at the boundary. */}
      <LinearGradient
        colors={fadeColors}
        locations={[0, 0.12, 0.5, 0.72, 0.9, 1]}
        style={s.topFade}
        pointerEvents="none"
      />

      <Text style={[s.heading, { color: t.heading }]}>Build Stunning Websites and Apps</Text>
      <Text style={[s.sub, { color: t.sub }]}>Your journey starts from here</Text>

      {/* Primary — Phone */}
      <TouchableOpacity
        onPress={() => openSheet('phone')}
        activeOpacity={0.85}
        style={[s.btn, { backgroundColor: t.primaryBg }]}
      >
        <Text style={[s.btnLabel, { color: t.primaryText }]}>Continue with Phone</Text>
      </TouchableOpacity>

      {/* Secondary — Email */}
      <TouchableOpacity
        onPress={() => openSheet('email')}
        activeOpacity={0.85}
        style={[s.btn, s.btnSecondary, { backgroundColor: t.secondaryBg, borderColor: t.secondaryBorder }]}
      >
        <Ionicons name="mail-outline" size={18} color={t.secondaryIcon} style={s.btnIcon} />
        <Text style={[s.btnLabel, { color: t.secondaryText }]}>Continue with Email</Text>
      </TouchableOpacity>


      {/* Tertiary — Guest */}
      <TouchableOpacity
        onPress={() => { signInAsGuest(); goBack(); }}
        activeOpacity={0.7}
        style={s.guestBtn}
      >
        <Text style={[s.guest, { color: t.guest }]}>Continue as Guest</Text>
      </TouchableOpacity>

      <Text style={[s.footer, { color: t.footer }]}>
        By pressing on “Continue with…” you agree to our{' '}
        <Text
          onPress={() => redirectToScreen("/tnc")}
          style={{ color: t.footerLink, textDecorationLine: 'underline' }}
        >
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text
          onPress={() => redirectToScreen("/privacy-policy")}
          style={{ color: t.footerLink, textDecorationLine: 'underline' }}
        >
          Privacy Policy
        </Text>
      </Text>

      <AuthSheet
        visible={sheetVisible}
        method={method}
        onClose={() => setSheetVisible(false)}
        onSuccess={goHome}
      />
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // paddingVertical: 26,
    paddingHorizontal: 26,
    paddingBottom: 26
  },
  topFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -TOP_FADE_H,
    height: TOP_FADE_H,
  },
  heading: {
    fontSize: 28,
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
    marginBottom: 14,
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

  guestBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  guest: { fontSize: 14, fontFamily: F.sans700 },
});
