import * as React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGoogleSignIn } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

export function GoogleAuthButton({ onSuccess }: { onSuccess: () => void }) {
  const { signInWithGoogle, loading, isConfigured } = useGoogleSignIn(onSuccess);

  return (
    <TouchableOpacity
      onPress={signInWithGoogle}
      activeOpacity={0.85}
      style={[st.btn, !isConfigured && st.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color="#111" size="small" />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color="#111" />
          <Text style={st.label}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(17,17,17,0.14)',
    borderRadius: 50,
    paddingVertical: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  btnDisabled: { opacity: 0.5 },
  label: { fontSize: 15, fontFamily: F.sans700, color: '#111' },
});
