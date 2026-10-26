/* eslint-disable unicorn/filename-case --
   Matches the PascalCase convention of its sibling components. */
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import type { TenantSummary } from '@/api/studio';
import { PressableScale } from '@/components/ui';

import { useAppsPalette } from '../palette';
import { isMobileApp } from '../use-app-actions';

type Props = {
  tenant: TenantSummary;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
};

/** `https://foo.com/` → `foo.com` — the link line is a label, not a URL. */
const hostOf = (url?: string) =>
  (url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

/** One of your apps: logo, name, where it lives, and the two things you do
 *  with it — View app (orange) and Edit. */
export function StoreCard({ tenant, busy, onView, onEdit }: Props) {
  const p = useAppsPalette();
  const mobile = isMobileApp(tenant);
  const host = hostOf(tenant.website_url);
  return (
    <View style={[st.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={st.top}>
        <View style={[st.logoWrap, { backgroundColor: p.soft }]}>
          {tenant.logo ? (
            <Image source={{ uri: tenant.logo }} style={st.logo} />
          ) : (
            <Ionicons
              name={mobile ? 'phone-portrait-outline' : 'globe-outline'}
              size={22}
              color={p.orange}
            />
          )}
        </View>
        <View style={st.titleWrap}>
          <Text style={[st.title, { color: p.ink }]} numberOfLines={1}>
            {tenant.title || 'Untitled app'}
          </Text>
          <View style={st.metaRow}>
            <View style={[st.kind, { backgroundColor: p.soft }]}>
              <Text style={[st.kindText, { color: p.orange }]}>
                {mobile ? 'Mobile app' : 'Website'}
              </Text>
            </View>
            {host ? (
              <Text style={[st.host, { color: p.sub }]} numberOfLines={1}>
                {host}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      <CardActions busy={busy} onView={onView} onEdit={onEdit} />
    </View>
  );
}

export function CardActions({
  busy,
  onView,
  onEdit,
  compact,
}: {
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  compact?: boolean;
}) {
  const p = useAppsPalette();
  const h = compact ? 34 : 40;
  return (
    <View style={st.actions}>
      <PressableScale style={st.slot} onPress={onView} disabled={busy}>
        <View style={[st.btn, { height: h, backgroundColor: p.orange }]}>
          {busy ? (
            <ActivityIndicator size="small" color={p.onOrange} />
          ) : (
            <>
              <Ionicons name="play" size={13} color={p.onOrange} />
              <Text style={[st.btnText, { color: p.onOrange }]}>View app</Text>
            </>
          )}
        </View>
      </PressableScale>
      <PressableScale style={st.slot} onPress={onEdit}>
        <View
          style={[
            st.btn,
            { height: h, borderWidth: 1, borderColor: p.border },
            { backgroundColor: p.card },
          ]}
        >
          <Ionicons name="create-outline" size={14} color={p.ink} />
          <Text style={[st.btnText, { color: p.ink }]}>Edit</Text>
        </View>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#F2600C',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  titleWrap: { flex: 1, gap: 5 },
  title: { fontSize: 15.5, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kind: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  kindText: { fontSize: 10.5, fontWeight: '700' },
  host: { flex: 1, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  btnText: { fontSize: 13, fontWeight: '700' },
});
