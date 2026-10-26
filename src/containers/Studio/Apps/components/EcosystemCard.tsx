/* eslint-disable unicorn/filename-case --
   Matches the PascalCase convention of its sibling components. */
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { AppGroup, AppGroupMember } from '@/api/studio';
import { PressableScale } from '@/components/ui';

import { type AppsPalette, useAppsPalette } from '../palette';
import type { OwnedApp } from '../use-app-actions';

type Actions = {
  busyId: OwnedApp['id'] | null;
  onView: (app: OwnedApp) => void;
  onEdit: (app: OwnedApp) => void;
};

const asApp = (m: AppGroupMember): OwnedApp => ({
  id: m.app_id,
  uuid: m.uuid,
  title: m.title,
  app_type: m.app_type,
});

/** An ecosystem — apps that share one backend, one chat and one set of
 *  users — as a banner with its apps listed underneath. */
export function EcosystemCard({
  group,
  ...actions
}: { group: AppGroup } & Actions) {
  const p = useAppsPalette();
  const roles = Object.keys(group.roles || {});
  const n = group.apps.length;
  return (
    <View style={[st.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={[st.banner, { backgroundColor: p.soft }]}>
        <View style={[st.badge, { backgroundColor: p.orange }]}>
          <Ionicons name="layers" size={18} color={p.onOrange} />
        </View>
        <View style={st.bannerText}>
          <Text style={[st.name, { color: p.ink }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[st.sub, { color: p.sub }]}>
            {n} {n === 1 ? 'app' : 'apps'} · one backend · one chat
          </Text>
          {roles.length ? (
            <View style={st.chips}>
              {roles.map((r) => (
                <View key={r} style={[st.chip, { borderColor: p.orange }]}>
                  <Text style={[st.chipText, { color: p.orange }]}>{r}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {group.apps.map((m, i) => (
        <MemberRow
          key={m.app_id}
          member={m}
          first={i === 0}
          p={p}
          {...actions}
        />
      ))}
    </View>
  );
}

function MemberRow({
  member,
  first,
  p,
  busyId,
  onView,
  onEdit,
}: { member: AppGroupMember; first: boolean; p: AppsPalette } & Actions) {
  const app = asApp(member);
  const mobile = member.app_type === 'mobile';
  const busy = busyId === member.app_id;
  return (
    <View
      style={[
        st.row,
        !first && { borderTopWidth: 1, borderTopColor: p.border },
      ]}
    >
      <Ionicons
        name={mobile ? 'phone-portrait-outline' : 'globe-outline'}
        size={17}
        color={p.sub}
      />
      <View style={st.rowText}>
        <Text style={[st.rowTitle, { color: p.ink }]} numberOfLines={1}>
          {member.title || 'Untitled app'}
        </Text>
        <Text style={[st.rowSub, { color: p.sub }]} numberOfLines={1}>
          {member.is_home
            ? 'Home app'
            : member.label || (mobile ? 'Mobile app' : 'Website')}
        </Text>
      </View>
      <PressableScale onPress={() => onView(app)} disabled={busy}>
        <View style={[st.view, { backgroundColor: p.orange }]}>
          {busy ? (
            <ActivityIndicator size="small" color={p.onOrange} />
          ) : (
            <Text style={[st.viewText, { color: p.onOrange }]}>View</Text>
          )}
        </View>
      </PressableScale>
      <PressableScale onPress={() => onEdit(app)} accessibilityLabel="Edit">
        <View style={[st.edit, { borderColor: p.border }]}>
          <Ionicons name="create-outline" size={16} color={p.ink} />
        </View>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  banner: { flexDirection: 'row', gap: 12, padding: 14 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13.5, fontWeight: '700' },
  rowSub: { fontSize: 11.5, marginTop: 1 },
  view: {
    height: 32,
    minWidth: 58,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: { fontSize: 12.5, fontWeight: '700' },
  edit: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
