import * as React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { RegistrantContact } from '@/api/app-domains';
import type { ServicesPalette } from '@/components/services';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useAppCart } from '@/lib/store/app-cart-store';

type Key = keyof RegistrantContact;

const FIELDS: {
  key: Key;
  label: string;
  half?: boolean;
  kb?: 'email-address' | 'phone-pad';
  caps?: 'characters' | 'none';
  max?: number;
}[] = [
  { key: 'FirstName', label: 'First name', half: true },
  { key: 'LastName', label: 'Last name', half: true },
  { key: 'EmailAddress', label: 'Email', kb: 'email-address', caps: 'none' },
  { key: 'Phone', label: 'Phone (+91 98765 43210)', kb: 'phone-pad' },
  { key: 'Address1', label: 'Address' },
  { key: 'City', label: 'City', half: true },
  { key: 'StateProvince', label: 'State', half: true },
  { key: 'PostalCode', label: 'PIN / postal code', half: true },
  {
    key: 'Country',
    label: 'Country (IN)',
    half: true,
    caps: 'characters',
    max: 2,
  },
];

export const CONTACT_KEYS = FIELDS.map((f) => f.key);

export function contactMissing(c: Partial<RegistrantContact>): string | null {
  const f = FIELDS.find((x) => !c[x.key]?.trim());
  if (f) return f.label.replace(/ \(.*\)$/, '');
  if (!/^[A-Za-z]{2}$/.test(c.Country ?? '')) return 'Country (2-letter code)';
  return null;
}

/** First fill from the signed-in account (name, email, phone). */
function usePrefill() {
  const user = useAuth.use.user();
  React.useEffect(() => {
    if (!user) return;
    const c = useAppCart.getState().contact;
    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    const [first, ...rest] = str(user.name).split(' ');
    const seed: Partial<RegistrantContact> = {
      FirstName: c.FirstName || str(user.first_name) || first || '',
      LastName: c.LastName || str(user.last_name) || rest.join(' '),
      EmailAddress: c.EmailAddress || str(user.email),
      Phone: c.Phone || str(user.phone_number ?? user.phone),
      Country: c.Country || 'IN',
    };
    useAppCart.getState().setContact(seed);
  }, [user]);
}

/** Registrant details for the domain (all 9 required by the registry). */
export function ContactForm({ s }: { s: ServicesPalette }) {
  usePrefill();
  const contact = useAppCart((c) => c.contact);
  const setContact = useAppCart((c) => c.setContact);
  return (
    <View style={st.grid}>
      {FIELDS.map((f) => (
        <View key={f.key} style={[st.cell, f.half ? st.half : st.full]}>
          <Text style={[st.label, { color: s.muted }]}>{f.label}</Text>
          <TextInput
            value={contact[f.key] ?? ''}
            onChangeText={(v) =>
              setContact({
                [f.key]: f.caps === 'characters' ? v.toUpperCase() : v,
              })
            }
            keyboardType={f.kb}
            autoCapitalize={f.caps ?? 'words'}
            autoCorrect={false}
            maxLength={f.max}
            style={[st.input, { color: s.text, backgroundColor: s.inset }]}
          />
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { padding: 4 },
  half: { width: '50%' },
  full: { width: '100%' },
  label: {
    fontFamily: F.sans600,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    fontFamily: F.sans500,
    fontSize: 14,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
});
