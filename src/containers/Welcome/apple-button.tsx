import * as AppleAuthentication from 'expo-apple-authentication';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppleSignIn } from '@/hooks/useAuth';

/** Same metrics as the other welcome pills (welcome-actions `st.pill`). */
const PILL_H = 54;

/**
 * Sign in with Apple, drawn by the system (AppleAuthenticationButton) as the
 * Human Interface Guidelines require — black on the white canvas, white on
 * dark — at the same size and radius as Continue with Google. Only rendered
 * when `useAppleSignInAvailable()` says the device supports it.
 */
export function AppleButton({
  dark,
  onSuccess,
}: {
  dark: boolean;
  onSuccess: () => void;
}) {
  const { signInWithApple, loading } = useAppleSignIn(onSuccess);
  return (
    <View style={st.wrap}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          dark
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={PILL_H / 2}
        style={st.button}
        onPress={() => {
          if (!loading) void signInWithApple();
        }}
      />
      {loading ? (
        <View
          pointerEvents="none"
          style={[st.busy, { backgroundColor: dark ? '#FFFFFF' : '#000000' }]}
        >
          <ActivityIndicator color={dark ? '#000000' : '#FFFFFF'} />
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginTop: 12, height: PILL_H },
  button: { width: '100%', height: PILL_H },
  busy: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL_H / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
