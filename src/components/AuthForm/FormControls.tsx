/**
 * Shared form primitives for the auth flow — used by the AuthSheet modal.
 * Theme-aware: colours come from sheetTheme[scheme] so the controls flip
 * dark/light with the app, while layout stays in the StyleSheets below.
 */
import { useColorScheme } from 'nativewind';
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

import { sheetTheme } from './AuthTheme';

function useSheetColors() {
  const { colorScheme } = useColorScheme();
  return sheetTheme[colorScheme === 'dark' ? 'dark' : 'light'];
}

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
  const c = useSheetColors();
  return (
    <View style={inp.group}>
      <Text style={[inp.label, { color: c.label }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        style={[inp.field, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
        selectionColor={c.selection}
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
    letterSpacing: 1.4, textTransform: 'uppercase',
  },
  field: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    fontSize: 16,
    fontFamily: F.sans500,
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
  const c = useSheetColors();
  return (
    <View style={otpSt.group}>
      <Text style={[inp.label, { color: c.label }]}>Verification code</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
        placeholder="Enter code"
        placeholderTextColor={c.placeholder}
        keyboardType="number-pad"
        autoFocus
        style={[otpSt.field, { backgroundColor: c.inputBg, borderColor: c.inputBorder, color: c.inputText }]}
        selectionColor={c.selection}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const otpSt = StyleSheet.create({
  group: { gap: 6 },
  field: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    fontSize: 20,
    fontFamily: F.sans800,
    letterSpacing: 3,
    textAlign: 'center',
  },
});

// ─── CTA button ───────────────────────────────────────────────────────────────
export function CtaButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  const c = useSheetColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={[cta.btn, { backgroundColor: c.ctaBg }]}>
      {loading
        ? <ActivityIndicator color={c.ctaText} size="small" />
        : <Text style={[cta.label, { color: c.ctaText }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Ghost button ─────────────────────────────────────────────────────────────
export function GhostButton({
  label, onPress, loading, disabled,
}: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const c = useSheetColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[cta.ghost, { borderColor: c.ghostBorder }, disabled && { opacity: 0.5 }]}
      disabled={disabled}
    >
      {loading
        ? <ActivityIndicator color={c.ghostText} size="small" />
        : <Text style={[cta.ghostLabel, { color: c.ghostText }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const cta = StyleSheet.create({
  btn: {
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  label:      { fontSize: 15, fontFamily: F.sans800, letterSpacing: 0.4 },
  ghost: {
    borderWidth: 1.5,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostLabel: { fontSize: 14, fontFamily: F.sans600 },
});
