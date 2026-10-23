import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DomainView } from '@/api/app-domains';
import { type ServicesPalette, tint } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

type Tab = 'ns' | 'a';

function Copy({
  s,
  label,
  value,
}: {
  s: ServicesPalette;
  label?: string;
  value: string;
}) {
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    haptic.select();
    toast.success('Copied', value);
  };
  return (
    <PressableScale
      onPress={() => void copy()}
      scaleTo={0.98}
      accessibilityLabel={`Copy ${value}`}
      style={[st.copy, { backgroundColor: s.inset }]}
    >
      {label ? (
        <Text style={[st.copyLabel, { color: s.muted }]}>{label}</Text>
      ) : null}
      <Text
        style={[st.copyValue, { color: s.text }]}
        numberOfLines={1}
        selectable
      >
        {value}
      </Text>
      <Ionicons name="copy-outline" size={14} color={s.sub} />
    </PressableScale>
  );
}

function Tabs({
  s,
  tab,
  onTab,
}: {
  s: ServicesPalette;
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  const opt = (k: Tab, label: string) => (
    <PressableScale
      onPress={() => onTab(k)}
      haptic={tab === k ? false : 'select'}
      style={[
        st.tab,
        tab === k && {
          backgroundColor: s.raised,
          borderColor: s.hairline,
          borderWidth: 1,
        },
      ]}
    >
      <Text style={[st.tabText, { color: tab === k ? s.text : s.sub }]}>
        {label}
      </Text>
    </PressableScale>
  );
  return (
    <View style={[st.tabs, { backgroundColor: s.inset }]}>
      {opt('ns', 'Use our nameservers')}
      {opt('a', 'Keep your DNS (A records)')}
    </View>
  );
}

function Status({ s, d }: { s: ServicesPalette; d: DomainView }) {
  if (d.dns.verified)
    return (
      <View style={[st.status, { backgroundColor: tint(s.success, 0.08) }]}>
        <Ionicons name="checkmark-circle" size={15} color={s.success} />
        <Text style={[st.statusText, { color: s.text }]}>
          Connected
          {d.dns.via === 'nameservers'
            ? ' via nameservers'
            : d.dns.via === 'a_record'
              ? ' via A records'
              : ''}
        </Text>
      </View>
    );
  return (
    <View style={st.checking}>
      <View style={[st.liveDot, { backgroundColor: s.orange }]} />
      <Text style={[st.hint, { color: s.sub }]}>
        Checking every few seconds
      </Text>
    </View>
  );
}

/** Two ways to point the domain at us, with tap-to-copy values. */
export function DnsCard({ s, d }: { s: ServicesPalette; d: DomainView }) {
  const [tab, setTab] = React.useState<Tab>(
    d.dns.via === 'a_record' ? 'a' : 'ns'
  );
  const purchased = d.source === 'purchased';
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Text style={[st.title, { color: s.text }]}>DNS</Text>
      <Status s={s} d={d} />
      {purchased ? (
        <Text style={[st.note, { color: s.sub }]}>
          Bought here, so DNS is set up for you. Nothing to do.
        </Text>
      ) : (
        <>
          <Tabs s={s} tab={tab} onTab={setTab} />
          <Text style={[st.note, { color: s.sub }]}>
            {tab === 'ns'
              ? 'At your registrar, replace the nameservers with these:'
              : 'At your DNS provider, add these records (remove other A records for the same hosts):'}
          </Text>
          <View style={st.values}>
            {tab === 'ns'
              ? d.dns.nameservers.map((n) => <Copy key={n} s={s} value={n} />)
              : d.dns.records.map((r) => (
                  <Copy
                    key={`${r.type}${r.host}`}
                    s={s}
                    label={`${r.type}  ${r.host}`}
                    value={r.value}
                  />
                ))}
          </View>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  title: { fontFamily: F.sans700, fontSize: 15 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  tab: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: { fontFamily: F.sans600, fontSize: 11.5, textAlign: 'center' },
  note: { fontFamily: F.sans400, fontSize: 12, lineHeight: 17 },
  values: { gap: 6 },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  copyLabel: { fontFamily: F.sans700, fontSize: 11, minWidth: 54 },
  copyValue: { flex: 1, fontFamily: F.sans600, fontSize: 13 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    padding: 8,
  },
  statusText: { fontFamily: F.sans600, fontSize: 12.5 },
  checking: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  hint: { fontFamily: F.sans500, fontSize: 12 },
});
