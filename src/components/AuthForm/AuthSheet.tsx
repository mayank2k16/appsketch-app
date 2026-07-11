import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useContinueAuthFlow } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { sheetTheme } from './AuthTheme';
import { CtaButton, GhostButton, OtpInput, StepInput } from './FormControls';

const BRAND_NAME = 'APPSKETCH';

/** Embeddable auth modal — triggered from the login screen and from
 * cart/checkout for guest sign-in mid-flow. Themed to match the app. */
export function AuthSheet({
  visible, onClose, onSuccess, method,
}: {
  visible: boolean; onClose: () => void; onSuccess?: () => void;
  /** Pre-focus the contact step on a single method. Omit for the combined field. */
  method?: 'email' | 'phone';
}) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const c = sheetTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  const {
    step, setStep, stepAnim, reset,
    loading, resendLoading, resendCooldown,
    contact, setContact, name, setName, otp, setOtp,
    authState,
    handleContinueContact, handleSubmitName, handleVerifyOtp, handleResendOtp,
  } = useContinueAuthFlow('contact', () => { onClose(); onSuccess?.(); });

  const sheetAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      reset();
      Animated.spring(sheetAnim, { toValue: 1, tension: 60, friction: 13, useNativeDriver: true }).start();
    } else {
      Animated.timing(sheetAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function close() {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true })
      .start(() => { reset(); onClose(); });
  }

  const sheetBottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 24);
  const sheetTY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  const stepOpacity = stepAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const stepTY = stepAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={close}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: c.overlay }]}
        />

        <Animated.View
          style={[
            as.sheet,
            { backgroundColor: c.bg, borderTopColor: c.topBorder, transform: [{ translateY: sheetTY }], paddingBottom: sheetBottomPad },
          ]}
        >
          <View style={[as.handle, { backgroundColor: c.handle }]} />

          <View style={as.topRow}>
            {step !== 'contact' ? (
              <TouchableOpacity onPress={() => setStep('contact')} style={as.backBtn}>
                <Text style={[as.backText, { color: c.closeIcon }]}>← Back</Text>
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity onPress={close} style={as.closeBtn}>
              <Text style={[as.closeText, { color: c.closeIcon }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[as.brand, { color: c.brand }]}>{BRAND_NAME}</Text>
          <View style={[as.divider, { backgroundColor: c.divider }]} />

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Animated.View style={{ opacity: stepOpacity, transform: [{ translateY: stepTY }] }}>

              {step === 'contact' && (
                <View style={as.wrap}>
                  <Text style={[as.title, { color: c.title }]}>Sign in to continue</Text>
                  <Text style={[as.sub, { color: c.sub }]}>
                    {method === 'phone'
                      ? 'Enter your phone number to continue.'
                      : method === 'email'
                        ? 'Enter your email to continue.'
                        : 'Enter your email or phone to continue.'}
                  </Text>
                  <View style={{ height: 20 }} />
                  <StepInput
                    label={
                      method === 'phone' ? 'Phone number'
                        : method === 'email' ? 'Email address'
                          : 'Email or phone number'
                    }
                    placeholder={
                      method === 'phone' ? '+91 98765 43210'
                        : method === 'email' ? 'you@example.com'
                          : 'you@example.com or +91…'
                    }
                    value={contact}
                    onChangeText={setContact}
                    onSubmit={handleContinueContact}
                    keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
                    autoFocus
                  />
                  <View style={{ height: 20 }} />
                  <CtaButton label="Continue →" onPress={handleContinueContact} loading={loading} />
                </View>
              )}

              {step === 'name' && (
                <View style={as.wrap}>
                  <Text style={[as.title, { color: c.title }]}>What's your name?</Text>
                  <Text style={[as.sub, { color: c.sub }]}>We'll personalise your experience.</Text>
                  <View style={{ height: 20 }} />
                  <StepInput
                    label="Full name" placeholder="Enter your name"
                    value={name} onChangeText={setName}
                    onSubmit={handleSubmitName} autoCapitalize="words" autoFocus
                  />
                  <View style={{ height: 20 }} />
                  <CtaButton label="Continue →" onPress={handleSubmitName} loading={loading} />
                </View>
              )}

              {step === 'otp' && (
                <View style={as.wrap}>
                  <Text style={[as.title, { color: c.title }]}>Verify it's you</Text>
                  <Text style={[as.sub, { color: c.sub }]}>
                    {authState?.otpSentVia === 'email'
                      ? `A code has been sent to ${authState?.email ?? 'your email'}. Check your inbox.`
                      : `You'll receive a voice call with your OTP on ${authState?.phone ?? 'your number'}.`}
                  </Text>
                  <View style={{ height: 28 }} />
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

            </Animated.View>
          </ScrollView>

          <Text style={[as.footer, { color: c.footer }]}>By continuing you agree to our Terms of Service &amp; Privacy Policy</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const as = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 2,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 4,
  },
  backBtn: { paddingVertical: 6 },
  backText: { fontSize: 14, fontFamily: F.sans600 },
  closeBtn: { padding: 2 },
  closeText: { fontSize: 18, fontFamily: F.sans400 },
  brand: {
    fontSize: 15, fontFamily: F.sans900,
    letterSpacing: 4, textAlign: 'center', marginBottom: 10,
  },
  divider: {
    height: 1,
    marginHorizontal: 24, marginBottom: 18,
  },
  wrap: { paddingHorizontal: 24, paddingVertical: 14 },
  title: { fontSize: 26, fontFamily: F.display900, letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: F.sans400, lineHeight: 21 },
  footer: {
    marginTop: 18, textAlign: 'center', fontSize: 10,
    fontFamily: F.sans400,
    paddingHorizontal: 32, lineHeight: 15,
  },
});
