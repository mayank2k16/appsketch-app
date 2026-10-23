import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DomainCertificate } from '@/api/app-domains';
import { type ServicesPalette, shortDate, tint } from '@/components/services';
import { F } from '@/lib/fonts';

const LABEL: Record<DomainCertificate['status'], string> = {
  none: 'Not issued yet',
  pending: 'Issuing…',
  active: 'Active',
  error: 'Problem issuing',
};

function Row({ s, k, v }: { s: ServicesPalette; k: string; v: string }) {
  return (
    <View style={st.row}>
      <Text style={[st.k, { color: s.muted }]}>{k}</Text>
      <Text style={[st.v, { color: s.text }]}>{v}</Text>
    </View>
  );
}

/** HTTPS certificate: status, issuer, expiry and auto-renewal. */
export function CertCard({
  s,
  c,
}: {
  s: ServicesPalette;
  c: DomainCertificate;
}) {
  const tone =
    c.status === 'active'
      ? s.success
      : c.status === 'error'
        ? s.error
        : c.status === 'pending'
          ? s.orange
          : s.muted;
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <View style={st.head}>
        <Text style={[st.title, { color: s.text }]}>HTTPS certificate</Text>
        <View style={[st.pill, { backgroundColor: tint(tone, 0.1) }]}>
          <Text style={[st.pillText, { color: tone }]}>{LABEL[c.status]}</Text>
        </View>
      </View>
      <Row s={s} k="Issuer" v={c.issuer || '—'} />
      <Row s={s} k="Expires" v={shortDate(c.expires_at) || '—'} />
      <Row s={s} k="Renewal" v={c.auto_renew ? 'Auto-renews' : 'Manual'} />
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 8 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: F.sans700, fontSize: 15 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontFamily: F.sans700, fontSize: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  k: { fontFamily: F.sans500, fontSize: 12.5 },
  v: { fontFamily: F.sans600, fontSize: 12.5 },
});
