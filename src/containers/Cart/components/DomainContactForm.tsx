/**
 * Domain registrant details — ported from the web reference
 * (`HomeV3/CartPage/ContactForm.jsx`), minus its `MapLocation` address
 * autofill (a separate `react-native-maps` feature, deliberately cut here
 * rather than silently dropped — plain manual entry for every field).
 */
import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { DomainContact } from '@/api/domains';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

const REQUIRED_FIELDS: (keyof DomainContact)[] = [
  'FirstName',
  'LastName',
  'EmailAddress',
  'Phone',
  'Address1',
  'City',
  'StateProvince',
  'PostalCode',
  'Country',
];

const FIELDS: { key: keyof DomainContact; label: string; keyboardType?: 'email-address' | 'phone-pad' }[] = [
  { key: 'FirstName', label: 'First name' },
  { key: 'LastName', label: 'Last name' },
  { key: 'EmailAddress', label: 'Email', keyboardType: 'email-address' },
  { key: 'Phone', label: 'Phone (e.g. +91 9876543210)', keyboardType: 'phone-pad' },
  { key: 'Address1', label: 'Address' },
  { key: 'City', label: 'City' },
  { key: 'StateProvince', label: 'State / Province' },
  { key: 'PostalCode', label: 'Postal code' },
  { key: 'Country', label: 'Country (2-letter code)' },
];

export function DomainContactForm({
  domain,
  years,
  contact,
  onChangeContact,
  onBack,
  onSubmit,
  submitting,
  t,
}: {
  domain: string;
  years: number;
  contact: DomainContact;
  onChangeContact: (contact: DomainContact) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  t: AppColors;
}) {
  function setField(key: keyof DomainContact, value: string) {
    onChangeContact({ ...contact, [key]: value });
  }

  function handleSubmit() {
    const missing = REQUIRED_FIELDS.find((k) => !contact[k]?.trim());
    if (missing) return;
    onSubmit();
  }

  const isValid = REQUIRED_FIELDS.every((k) => contact[k]?.trim());

  return (
    <View style={[st.wrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[st.title, { color: t.text }]}>Domain contact details</Text>
      <Text style={[st.subtitle, { color: t.textSub }]}>
        Required to register {domain} for {years} year{years > 1 ? 's' : ''}
      </Text>

      {FIELDS.map((field) => (
        <View key={field.key} style={st.fieldRow}>
          <Text style={[st.label, { color: t.textMuted }]}>{field.label}</Text>
          <TextInput
            value={contact[field.key]}
            onChangeText={(v) => setField(field.key, v)}
            keyboardType={field.keyboardType}
            placeholderTextColor={t.textMuted}
            style={[st.input, { color: t.text, borderColor: t.border }]}
          />
        </View>
      ))}

      <View style={st.actions}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={[st.secondaryBtn, { borderColor: t.border }]}>
          <Text style={[st.secondaryBtnText, { color: t.textSub }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting || !isValid}
          style={[
            st.primaryBtn,
            { backgroundColor: t.accent },
            (submitting || !isValid) && { opacity: 0.5 },
          ]}
        >
          <Text style={st.primaryBtnText}>{submitting ? 'Processing…' : 'Proceed to payment'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 4 },
  title: { fontFamily: F.sans700, fontSize: 15 },
  subtitle: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 18, marginBottom: 12 },

  fieldRow: { marginBottom: 14 },
  label: { fontFamily: F.sans600, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  input: { fontFamily: F.sans500, fontSize: 14, borderBottomWidth: 1, paddingVertical: 8 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: F.sans700, fontSize: 14 },
  primaryBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { fontFamily: F.sans700, fontSize: 14, color: '#FFFFFF' },
});
