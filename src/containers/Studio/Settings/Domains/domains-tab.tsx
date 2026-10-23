/**
 * Studio → Settings → Domains: the same list as /domains (buy, connect,
 * live setup stage per domain). docs/domains.md.
 */
import * as React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useServicesTheme } from '@/components/services';
import { DomainsList } from '@/containers/Domains';
import { F } from '@/lib/fonts';

export function DomainsTab() {
  const { s } = useServicesTheme();
  return (
    <ScrollView
      style={st.flex}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[st.heading, { color: s.text }]}>Domains</Text>
      <Text style={[st.sub, { color: s.sub }]}>
        Buy or connect a domain. Your app goes live on it with HTTPS.
      </Text>
      <DomainsList s={s} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 4, paddingTop: 16, paddingBottom: 40 },
  heading: { fontFamily: F.display900, fontSize: 20, letterSpacing: -0.4 },
  sub: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 12,
  },
});
