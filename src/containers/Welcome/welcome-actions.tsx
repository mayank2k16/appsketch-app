import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import ReAnimated from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { useAppleSignInAvailable, useGoogleSignIn } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { AppleButton } from './apple-button';
import { GoogleG } from './google-g';
import { useRiseIn, WELCOME_T, type WelcomeTheme } from './use-welcome-intro';

/** Below the screen edge, so the buttons rise in without a fade. */
const FROM = 260;

function GoogleButton({
  t,
  onSuccess,
}: {
  t: WelcomeTheme;
  onSuccess: () => void;
}) {
  const { signInWithGoogle, loading } = useGoogleSignIn(onSuccess);
  return (
    <PressableScale
      onPress={signInWithGoogle}
      disabled={loading}
      disabledOpacity={1}
      accessibilityLabel="Continue with Google"
      style={[
        st.pill,
        st.outline,
        { backgroundColor: t.googleBg, borderColor: t.googleBorder },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.googleText} size="small" />
      ) : (
        <>
          <GoogleG size={18} />
          <Text style={[st.label, { color: t.googleText }]}>
            Continue with Google
          </Text>
        </>
      )}
    </PressableScale>
  );
}

function Terms({ t }: { t: WelcomeTheme }) {
  const router = useRouter();
  const link = { color: t.termsLink, textDecorationLine: 'underline' as const };
  return (
    <Text style={[st.terms, { color: t.terms }]}>
      By continuing you agree to our{' '}
      <Text onPress={() => router.push('/tnc')} style={link}>
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text onPress={() => router.push('/privacy-policy')} style={link}>
        Privacy Policy
      </Text>
    </Text>
  );
}

/**
 * The sign-in stack: Sign in with Apple (iOS, when available — guideline 4.8
 * asks for it next to any third-party login, at equal prominence), Google
 * (the real expo-auth-session flow behind `useGoogleSignIn`), then phone or
 * email (the AuthSheet OTP flow), then the terms line. Each rises in from
 * below once the collage has settled.
 */
export function WelcomeActions({
  t,
  dark,
  onPhoneEmail,
  onSuccess,
}: {
  t: WelcomeTheme;
  dark: boolean;
  onPhoneEmail: () => void;
  onSuccess: () => void;
}) {
  const apple = useAppleSignInAvailable();
  const ra = useRiseIn(WELCOME_T.actions, FROM);
  const r0 = useRiseIn(WELCOME_T.actions + WELCOME_T.step * 0.5, FROM);
  const r1 = useRiseIn(WELCOME_T.actions + WELCOME_T.step * 1.5, FROM);
  const r2 = useRiseIn(WELCOME_T.actions + WELCOME_T.step * 2.5, FROM);
  return (
    <>
      {apple ? (
        <ReAnimated.View style={ra}>
          <AppleButton dark={dark} onSuccess={onSuccess} />
        </ReAnimated.View>
      ) : null}
      <ReAnimated.View style={r0}>
        <GoogleButton t={t} onSuccess={onSuccess} />
      </ReAnimated.View>
      <ReAnimated.View style={r1}>
        <PressableScale
          onPress={onPhoneEmail}
          accessibilityLabel="Continue with phone or email"
          style={[st.pill, { backgroundColor: t.primaryBg }]}
        >
          <Ionicons name="mail-outline" size={18} color={t.primaryText} />
          <Text style={[st.label, { color: t.primaryText }]}>
            Continue with phone or email
          </Text>
        </PressableScale>
      </ReAnimated.View>
      <ReAnimated.View style={r2}>
        <Terms t={t} />
      </ReAnimated.View>
    </>
  );
}

const st = StyleSheet.create({
  pill: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  outline: { borderWidth: 1 },
  label: { fontFamily: F.sans700, fontSize: 15, letterSpacing: 0.1 },
  terms: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: F.sans400,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
