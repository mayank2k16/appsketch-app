import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { BRAND_MID, brandGradient } from '@/lib/theme';

import { AuthSheet } from './AuthSheet';
import { loginTheme } from './AuthTheme';

// The gate follows the app's scheme. Dark keeps the exact elevated-overlay
// look it always had; white is a flat paper sheet with one hairline, an ink
// primary and no blur tint / shadow (docs/white-theme.md).
const gateChrome = {
  dark: {
    blurTint: 'dark' as const,
    backdrop: 'rgba(0,0,0,0.35)',
    panelBorder: 'rgba(255,255,255,0.07)',
    handle: 'rgba(255,255,255,0.16)',
    closeBg: 'rgba(255,255,255,0.08)',
    iconWrapBg: 'rgba(236,72,153,0.12)',
    iconWrapBorder: `${BRAND_MID}59`,
    icon: BRAND_MID as string,
  },
  light: {
    blurTint: 'light' as const,
    backdrop: 'rgba(11,11,12,0.32)',
    panelBorder: '#E7E7E4',
    handle: '#D9D9D5',
    closeBg: '#F4F4F2',
    iconWrapBg: '#F4F4F2',
    iconWrapBorder: '#E7E7E4',
    icon: '#0B0B0C',
  },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Fires once the user completes phone/email verification. */
  onSuccess?: () => void;
};

/** Login gate shown in place of navigating away when a guest/signed-out user
 * triggers an action that needs a real account (e.g. sending the agent a
 * prompt). A stripped copy of `AuthForm`'s panel — same heading, buttons and
 * footer — presented as a blurred modal instead of a full screen, and with
 * "Continue as Guest" deliberately omitted since the whole point is to close
 * the guest bypass, not offer another one. */
export function AuthGateModal({ visible, onClose, onSuccess }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = loginTheme[isDark ? 'dark' : 'light'];
  const g = gateChrome[isDark ? 'dark' : 'light'];

  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [method, setMethod] = React.useState<'email' | 'phone'>('phone');

  function openSheet(m: 'email' | 'phone') {
    setMethod(m);
    setSheetVisible(true);
  }

  function handleVerified() {
    setSheetVisible(false);
    onSuccess?.();
  }

  function openLegal(path: string) {
    onClose();
    router.push(path as never);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView
        intensity={45}
        tint={g.blurTint}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          style={[s.backdrop, { backgroundColor: g.backdrop }]}
          onPress={onClose}
        >
          <Pressable
            style={[
              s.panel,
              isDark && s.panelShadow,
              {
                backgroundColor: t.panel,
                borderColor: g.panelBorder,
                paddingBottom: Math.max(insets.bottom, 20) + 22,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[s.handle, { backgroundColor: g.handle }]}
            />

            <PressableScale
              onPress={onClose}
              style={[s.closeBtn, { backgroundColor: g.closeBg }]}
              hitSlop={10}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={t.footer} />
            </PressableScale>

            {/* Tinted, not filled: the badge is decoration above the
                heading, so it carries the brand at a wash rather than
                competing with the button below it. */}
            <View
              style={[
                s.iconWrap,
                { backgroundColor: g.iconWrapBg, borderColor: g.iconWrapBorder },
              ]}
            >
              <Ionicons name="lock-closed" size={20} color={g.icon} />
            </View>

            <Text style={[s.heading, { color: t.heading }]}>
              Build Stunning Websites and Apps
            </Text>
            <Text style={[s.sub, { color: t.sub }]}>
              Your journey starts from here
            </Text>

            {/* The brand ramp, not the flat white slab this was. It is the
                primary action of the whole gate, and the full-screen
                AuthForm's equivalent button is already gradient-filled —
                two routes to the same sign-in should not look like two
                different products. */}
            <PressableScale
              onPress={() => openSheet('phone')}
              style={[
                s.btn,
                s.btnPrimary,
                !isDark && { backgroundColor: t.primaryBg },
              ]}
            >
              {isDark ? (
                <LinearGradient
                  colors={brandGradient()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Text style={[s.btnLabel, { color: '#FFFFFF' }]}>
                Continue with Phone
              </Text>
            </PressableScale>

            <PressableScale
              onPress={() => openSheet('email')}
              style={[
                s.btn,
                s.btnSecondary,
                {
                  backgroundColor: t.secondaryBg,
                  borderColor: t.secondaryBorder,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={t.secondaryIcon}
                style={s.btnIcon}
              />
              <Text style={[s.btnLabel, { color: t.secondaryText }]}>
                Continue with Email
              </Text>
            </PressableScale>

            <Text style={[s.footer, { color: t.footer }]}>
              By pressing on "Continue with…" you agree to our{' '}
              <Text
                onPress={() => openLegal('/tnc')}
                style={[s.footerLink, { color: t.footerLink }]}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                onPress={() => openLegal('/privacy-policy')}
                style={[s.footerLink, { color: t.footerLink }]}
              >
                Privacy Policy
              </Text>
            </Text>
          </Pressable>
        </Pressable>
      </BlurView>

      <AuthSheet
        visible={sheetVisible}
        method={method}
        onClose={() => setSheetVisible(false)}
        onSuccess={handleVerified}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 26,
    paddingTop: 10,
  },
  panelShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: { elevation: 24 },
    }),
  },
  // Clips the gradient fill to the button's pill shape.
  btnPrimary: {
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Brand wash rather than a white one, with a 1px ring the JSX tints to
    // match. Faint on purpose — see the note at the call site.
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 14,
  },
  heading: {
    fontSize: 26,
    fontFamily: F.display900,
    letterSpacing: -0.6,
    lineHeight: 31,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontFamily: F.sans400,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
  },
  btn: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnSecondary: { borderWidth: 1 },
  btnIcon: { marginRight: 8 },
  btnLabel: {
    fontSize: 15,
    fontFamily: F.sans700,
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: F.sans400,
    lineHeight: 16,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
