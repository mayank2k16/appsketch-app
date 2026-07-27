/**
 * Domains — read-only list, ported from the web reference
 * (`Studio/Settings/Domains/index.jsx`). Purchasing lives in `CartScreen`
 * now (billed together with a plan) — "Add domain" just routes to `/cart`
 * with no `tier` param, same as the web version's empty-state link to
 * `/pricing` used to hand off domain buying.
 */
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useUserDomains } from '@/api/domains';
import { toast } from '@/lib/toast';
import { useAppTheme, type AppColors } from '@/lib/theme';

export function DomainsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { data: domains, isLoading } = useUserDomains();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  async function copyNameserver(value: string) {
    await Clipboard.setStringAsync(value);
    toast.success('Name server copied');
  }

  function goAddDomain() {
    router.push('/cart' as never);
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
      <View style={st.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[st.heading, { color: t.text }]}>Domains</Text>
          <Text style={[st.subheading, { color: t.textSub }]}>View and manage all your domains in one place.</Text>
        </View>
        <Pressable onPress={goAddDomain} style={[st.addBtn, { backgroundColor: t.accent }]}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={st.addBtnText}>Add domain</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.accent} style={{ marginTop: 40 }} />
      ) : !domains || domains.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="globe-outline" size={32} color={t.textMuted} />
          <Text style={[st.emptyText, { color: t.textMuted }]}>You haven't added any domain yet.</Text>
          <Pressable onPress={goAddDomain}>
            <Text style={[st.emptyLink, { color: t.accent }]}>Add one now</Text>
          </Pressable>
        </View>
      ) : (
        domains.map((domain, i) => {
          const open = openIndex === i;
          const name = domain.a_record?.Name || (domain.sld && domain.tld ? `${domain.sld}.${domain.tld}` : 'Domain');
          return (
            <View key={i} style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
              <Pressable onPress={() => setOpenIndex(open ? null : i)} style={st.cardHeader}>
                <View style={st.cardHeaderLeft}>
                  <Ionicons name="globe-outline" size={16} color={t.accent} />
                  <Text style={[st.domainName, { color: t.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={t.textMuted} />
              </Pressable>

              {open && (
                <View style={[st.detail, { borderTopColor: t.border }]}>
                  {!!domain.purchased_at && (
                    <DetailRow t={t} label="Purchased at" value={new Date(domain.purchased_at).toLocaleDateString()} />
                  )}
                  {!!domain.expires_at && (
                    <DetailRow t={t} label="Expires at" value={new Date(domain.expires_at).toLocaleDateString()} />
                  )}
                  {!!domain.provider && <DetailRow t={t} label="Provider" value={domain.provider} />}
                  {!!domain.sld && <DetailRow t={t} label="SLD" value={domain.sld} />}
                  {!!domain.tld && <DetailRow t={t} label="TLD" value={domain.tld} />}
                  {!!domain.status && <DetailRow t={t} label="Status" value={domain.status} />}
                  {!!domain.tenant_name && <DetailRow t={t} label="Tenant" value={domain.tenant_name} />}
                  {!!domain.nameservers?.length && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[st.detailLabel, { color: t.textMuted }]}>Name servers</Text>
                      {domain.nameservers.map((ns) => (
                        <Pressable key={ns} onPress={() => copyNameserver(ns)} style={st.nsRow}>
                          <Text style={[st.detailValue, { color: t.text }]}>{ns}</Text>
                          <Ionicons name="copy-outline" size={13} color={t.textMuted} />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function DetailRow({ t, label, value }: { t: AppColors; label: string; value: string }) {
  return (
    <View style={st.detailRow}>
      <Text style={[st.detailLabel, { color: t.textMuted }]}>{label}</Text>
      <Text style={[st.detailValue, { color: t.text }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subheading: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 10, paddingTop: 50 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  emptyLink: { fontSize: 13, fontWeight: '700' },

  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  domainName: { fontSize: 13.5, fontWeight: '700', flexShrink: 1 },

  detail: { borderTopWidth: 1, padding: 14, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontSize: 11.5, fontWeight: '600' },
  detailValue: { fontSize: 12.5, fontWeight: '500' },
  nsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
});
