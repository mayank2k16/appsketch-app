import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar } from '@/components/ui';
import { signInAsGuest, useContinueAuthFlow } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { CtaButton, GhostButton, OtpInput, StepInput } from './FormControls';
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { authColors } from './AuthTheme';



const { RED, DARK } = authColors.dark;
type ContactMethod = 'email' | 'phone';

export function AuthForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    step, setStep, reset,
    loading, resendLoading, resendCooldown,
    contact, setContact, name, setName, otp, setOtp,
    authState,
    handleContinueContact, handleSubmitName, handleVerifyOtp, handleResendOtp,
  } = useContinueAuthFlow('contact', () => router.replace('/storefront'));

  const [method, setMethod] = React.useState<ContactMethod>('email');

  function switchMethod(next: ContactMethod) {
    if (next === method) return;
    setMethod(next);
    setContact('');
  }

  function goBack() {
    setStep('contact');
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FocusAwareStatusBar />

      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        >
          {/* ── Brand ── */}
          <View style={s.brandWrap}>
            <Image
              source={require('../../../assets/chinese_corner.png')}
              style={s.logo}
              contentFit="contain"
            />
            <Text style={s.heading}>Welcome to Appsketch</Text>
            <Text style={s.subheading}>Sign in to order your favourites.</Text>
          </View>

          {/* ── Google ── */}
          <GoogleAuthButton onSuccess={() => router.replace('/storefront')} />

          {/* ── Divider ── */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.dividerLine} />
          </View>

          {/* ── Method tabs ── */}
          {step === 'contact' && (
            <View style={s.tabRow}>
              <Pressable onPress={() => switchMethod('email')} style={s.tab}>
                <Text style={[s.tabText, method === 'email' && s.tabTextActive]}>Continue with Email</Text>
                {method === 'email' && <View style={s.tabUnderline} />}
              </Pressable>
              <Pressable onPress={() => switchMethod('phone')} style={s.tab}>
                <Text style={[s.tabText, method === 'phone' && s.tabTextActive]}>Continue with Phone</Text>
                {method === 'phone' && <View style={s.tabUnderline} />}
              </Pressable>
            </View>
          )}

          {step !== 'contact' && (
            <Pressable onPress={goBack} style={s.backRow}>
              <Text style={s.backText}>← Back</Text>
            </Pressable>
          )}

          {/* ── STEP: contact ── */}
          {step === 'contact' && (
            <View style={s.stepWrap}>
              <StepInput
                label={method === 'email' ? 'Email address' : 'Phone number'}
                placeholder={method === 'email' ? 'you@example.com' : '+91 98765 43210'}
                value={contact}
                onChangeText={setContact}
                onSubmit={handleContinueContact}
                keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                autoFocus
              />
              <View style={{ height: 20 }} />
              <CtaButton label="Continue" onPress={handleContinueContact} loading={loading} />
            </View>
          )}

          {/* ── STEP: name ── */}
          {step === 'name' && (
            <View style={s.stepWrap}>
              <Text style={s.stepTitle}>What's your name?</Text>
              <Text style={s.stepSub}>We'll personalise your Chinese Corner experience.</Text>
              <View style={{ height: 16 }} />
              <StepInput
                label="Full name"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                onSubmit={handleSubmitName}
                autoCapitalize="words"
                autoFocus
              />
              <View style={{ height: 20 }} />
              <CtaButton label="Continue" onPress={handleSubmitName} loading={loading} />
            </View>
          )}

          {/* ── STEP: otp ── */}
          {step === 'otp' && (
            <View style={s.stepWrap}>
              <Text style={s.stepTitle}>Verify it's you</Text>
              <Text style={s.stepSub}>
                {authState?.otpSentVia === 'email'
                  ? `A code has been sent to ${authState?.email ?? 'your email'}.`
                  : `You'll receive a voice call with your OTP on ${authState?.phone ?? 'your number'}.`}
              </Text>
              <View style={{ height: 24 }} />
              <OtpInput value={otp} onChangeText={setOtp} onSubmit={() => handleVerifyOtp()} />
              <View style={{ height: 20 }} />
              <CtaButton label="Verify" onPress={() => handleVerifyOtp()} loading={loading} />
              <View style={{ height: 12 }} />
              <GhostButton
                label={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                onPress={handleResendOtp}
                loading={resendLoading}
                disabled={resendCooldown > 0}
              />
            </View>
          )}

          <Text style={s.footer}>
            By continuing you agree to our Terms of Service &amp; Privacy Policy
          </Text>

          <Pressable
            onPress={() => { reset(); signInAsGuest(); router.replace('/storefront'); }}
            style={{ marginTop: 18 }}
          >
            <Text style={s.guestLink}>Browse Menu as Guest</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 28, flexGrow: 1 },

  brandWrap: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 140, height: 70, marginBottom: 16 },
  heading: {
    fontSize: 22, fontFamily: F.display900, color: DARK,
    letterSpacing: -0.4, textAlign: 'center',
  },
  subheading: {
    fontSize: 13.5, fontFamily: F.sans400, color: 'rgba(17,17,17,0.50)',
    marginTop: 6, textAlign: 'center',
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(17,17,17,0.10)' },
  dividerText: { fontSize: 11, fontFamily: F.sans700, color: 'rgba(17,17,17,0.35)', letterSpacing: 1 },

  tabRow: { flexDirection: 'row', gap: 24, marginBottom: 22, justifyContent: 'center' },
  tab: { alignItems: 'center', paddingBottom: 8 },
  tabText: { fontSize: 13.5, fontFamily: F.sans600, color: 'rgba(17,17,17,0.40)' },
  tabTextActive: { color: DARK },
  tabUnderline: { height: 2, width: '100%', backgroundColor: RED, borderRadius: 1, marginTop: 6 },

  backRow: { marginBottom: 16 },
  backText: { fontSize: 14, fontFamily: F.sans600, color: 'rgba(17,17,17,0.50)' },

  stepWrap: {},
  stepTitle: { fontSize: 20, fontFamily: F.display900, color: DARK, letterSpacing: -0.4, marginBottom: 6 },
  stepSub: { fontSize: 13.5, fontFamily: F.sans400, color: 'rgba(17,17,17,0.50)', lineHeight: 20 },

  footer: {
    marginTop: 28, textAlign: 'center', fontSize: 10.5,
    fontFamily: F.sans400, color: 'rgba(17,17,17,0.32)', lineHeight: 15,
  },
  guestLink: { textAlign: 'center', fontSize: 13, fontFamily: F.sans600, color: RED },
});
