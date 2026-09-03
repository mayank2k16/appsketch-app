import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import { BRAND_MID, brandGradient } from '@/lib/theme';

import { AuthSheet } from './AuthSheet';
import { loginTheme } from './AuthTheme';

// Always the dark palette — this gate is a distinct, elevated overlay (not
// another screen), so it stays consistent regardless of the app's colour
// scheme, matching the reference design.
const t = loginTheme.dark;

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
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      >
        <Pressable style={s.backdrop} onPress={onClose}>
          <Pressable
            style={[
              s.panel,
              { paddingBottom: Math.max(insets.bottom, 20) + 22 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[s.handle, { backgroundColor: 'rgba(255,255,255,0.16)' }]}
            />

            <TouchableOpacity
              onPress={onClose}
              style={s.closeBtn}
              hitSlop={10}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={t.footer} />
            </TouchableOpacity>

            {/* Tinted, not filled: the badge is decoration above the
                heading, so it carries the brand at a wash rather than
                competing with the button below it. */}
            <View style={[s.iconWrap, { borderColor: `${BRAND_MID}59` }]}>
              <Ionicons name="lock-closed" size={20} color={BRAND_MID} />
            </View>

            <Text style={s.heading}>Build Stunning Websites and Apps</Text>
            <Text style={s.sub}>Your journey starts from here</Text>

            {/* The brand ramp, not the flat white slab this was. It is the
                primary action of the whole gate, and the full-screen
                AuthForm's equivalent button is already gradient-filled —
                two routes to the same sign-in should not look like two
                different products. */}
            <TouchableOpacity
              onPress={() => openSheet('phone')}
              activeOpacity={0.85}
              style={[s.btn, s.btnPrimary]}
            >
              <LinearGradient
                colors={brandGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[s.btnLabel, { color: '#FFFFFF' }]}>
                Continue with Phone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openSheet('email')}
              activeOpacity={0.85}
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
            </TouchableOpacity>

            <Text style={s.footer}>
              By pressing on "Continue with…" you agree to our{' '}
              <Text onPress={() => openLegal('/tnc')} style={s.footerLink}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                onPress={() => openLegal('/privacy-policy')}
                style={s.footerLink}
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    backgroundColor: t.panel,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 0,
    paddingHorizontal: 26,
    paddingTop: 10,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(236,72,153,0.12)',
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
    color: t.heading,
  },
  sub: {
    fontSize: 14,
    fontFamily: F.sans400,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
    color: t.sub,
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
    color: t.footer,
  },
  footerLink: {
    color: t.footerLink,
    textDecorationLine: 'underline',
  },
});
