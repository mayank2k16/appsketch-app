import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInAsGuest, useGoogleSignIn } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { openLinkInBrowser } from '@/lib/utils';

import { AuthSheet } from './AuthSheet';
import { loginTheme } from './AuthTheme';

// Public legal pages on the marketing site. If those routes ever move, this is
// the only place to update.
const TERMS_URL = 'https://appsketch.ai/terms-of-service';
const PRIVACY_URL = 'https://appsketch.ai/privacy-policy';

// Height of the montage → panel fade that sits just above the panel. It's a
// child of the panel (rendered outside its top edge) painted in the panel's own
// colour, so the montage dissolves into the panel with no seam/line.
const TOP_FADE_H = 200;

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

      {/* Secondary — Gmail / Google */}
      {/* <TouchableOpacity
        onPress={signInWithGoogle}
        disabled={googleLoading}
        activeOpacity={0.85}
        style={[
          s.btn, s.btnSecondary,
          { backgroundColor: t.secondaryBg, borderColor: t.secondaryBorder },
          googleLoading && { opacity: 0.6 },
        ]}
      >
        <Ionicons name="logo-google" size={18} color={t.secondaryIcon} style={s.btnIcon} />
        <Text style={[s.btnLabel, { color: t.secondaryText }]}>Continue with Google</Text>
      </TouchableOpacity> */}

      {/* Tertiary — Guest */}
      <TouchableOpacity
        onPress={() => { signInAsGuest(); goHome(); }}
        activeOpacity={0.7}
        style={s.guestBtn}
      >
        <Text style={[s.guest, { color: t.guest }]}>Continue as Guest</Text>
      </TouchableOpacity>

      <Text style={[s.footer, { color: t.footer }]}>
        By pressing on “Continue with…” you agree to our{' '}
        <Text
          onPress={() => openLinkInBrowser(TERMS_URL)}
          style={{ color: t.footerLink, textDecorationLine: 'underline' }}
        >
          Terms of Service
        </Text>
        {' '}and{' '}
        <Text
          onPress={() => openLinkInBrowser(PRIVACY_URL)}
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
