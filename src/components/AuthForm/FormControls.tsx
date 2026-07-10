/**
 * Shared form primitives for the auth flow — used by both the full-page
 * LoginScreen and the AuthSheet modal so the two can't visually drift apart.
 * Extracted out of what used to be duplicated between them.
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';

import { authColors } from './AuthTheme';

const { RED, DARK } = authColors.dark;

// ─── Step input ───────────────────────────────────────────────────────────────
export function StepInput({
  label, placeholder, value, onChangeText, onSubmit,
  keyboardType, maxLength, autoCapitalize, autoFocus, secureTextEntry,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; onSubmit?: () => void;
  keyboardType?: any; maxLength?: number;
  autoCapitalize?: any; autoFocus?: boolean; secureTextEntry?: boolean;
}) {
  return (
    <View style={inp.group}>
      <Text style={inp.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(17,17,17,0.28)"
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        style={inp.field}
        selectionColor={RED}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        blurOnSubmit={false}
      />
    </View>
  );
}

const inp = StyleSheet.create({
  group: { gap: 6 },
  label: {
    fontSize: 10, fontFamily: F.sans800,
    color: 'rgba(17,17,17,0.45)', letterSpacing: 1.4, textTransform: 'uppercase',
  },
  field: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1.5,
    borderColor: 'rgba(196,18,48,0.20)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    fontSize: 16,
    fontFamily: F.sans500,
    color: DARK,
  },
});

// ─── OTP input ────────────────────────────────────────────────────────────────
// A plain free-length field rather than a fixed set of digit boxes — the
// backend doesn't guarantee a fixed OTP length, so the UI shouldn't either.
export function OtpInput({
  value, onChangeText, onSubmit,
}: {
  value: string; onChangeText: (v: string) => void; onSubmit?: () => void;
}) {
  return (
    <View style={otpSt.group}>
      <Text style={inp.label}>Verification code</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
        placeholder="Enter code"
        placeholderTextColor="rgba(17,17,17,0.28)"
        keyboardType="number-pad"
        autoFocus
        style={otpSt.field}
        selectionColor={RED}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const otpSt = StyleSheet.create({
  group: { gap: 6 },
  field: {
    backgroundColor: '#FFF5F7',
    borderWidth: 1.5,
    borderColor: 'rgba(196,18,48,0.20)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    fontSize: 20,
    fontFamily: F.sans800,
    color: DARK,
    letterSpacing: 3,
    textAlign: 'center',
  },
});

// ─── CTA button ───────────────────────────────────────────────────────────────
export function CtaButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={cta.btn}>
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={cta.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Ghost button ─────────────────────────────────────────────────────────────
export function GhostButton({
  label, onPress, loading, disabled,
}: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[cta.ghost, disabled && { opacity: 0.5 }]}
      disabled={disabled}
    >
      {loading
        ? <ActivityIndicator color={RED} size="small" />
        : <Text style={cta.ghostLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

const cta = StyleSheet.create({
  btn: {
    backgroundColor: RED,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 14 },
      android: { elevation: 6 },
    }),
  },
  label:      { color: '#FFFFFF', fontSize: 15, fontFamily: F.sans800, letterSpacing: 0.4 },
  ghost: {
    borderWidth: 1.5,
    borderColor: 'rgba(196,18,48,0.45)',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostLabel: { color: 'rgba(17,17,17,0.55)', fontSize: 14, fontFamily: F.sans600 },
});
