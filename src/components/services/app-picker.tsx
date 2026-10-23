import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TenantSummary } from '@/api/studio';
import { useUserTenants } from '@/api/studio';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { ServicesPalette } from './palette';
import { StateNote } from './state-note';

export const appKind = (a: { app_type?: string }) =>
  a.app_type === 'mobile' ? 'Mobile app' : 'Website';

function AppRow({
  s,
  app,
  selected,
  onPress,
}: {
  s: ServicesPalette;
  app: TenantSummary;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      haptic="select"
      accessibilityState={{ selected }}
      style={[
        st.row,
        {
          backgroundColor: s.raised,
          borderColor: selected ? s.ink : s.hairline,
        },
      ]}
    >
      <View style={[st.logo, { backgroundColor: s.inset }]}>
        {app.logo ? (
          <Image
            source={{ uri: app.logo }}
            style={st.logoImg}
            contentFit="cover"
          />
        ) : (
          <Text style={[st.initial, { color: s.sub }]}>
            {(app.title || '?').charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={st.body}>
        <Text style={[st.name, { color: s.text }]} numberOfLines={1}>
          {app.title || 'Untitled app'}
        </Text>
        <Text style={[st.kind, { color: s.muted }]}>{appKind(app)}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={selected ? s.ink : s.muted}
      />
    </PressableScale>
  );
}

/** "My apps" as selectable rows (logo, title, Website / Mobile app). */
export function AppPicker({
  s,
  value,
  onChange,
}: {
  s: ServicesPalette;
  value: number | string | null;
  onChange: (app: TenantSummary) => void;
}) {
  const q = useUserTenants();
  // Only real rows (the endpoint can answer a guest with a non-list body).
  const apps = Array.isArray(q.data) ? q.data.filter((a) => a?.id != null) : [];
  if (q.isLoading) return <StateNote s={s} loading />;
  if (q.isError)
    return (
      <StateNote
        s={s}
        title="Couldn't load your apps"
        action="Retry"
        onAction={() => void q.refetch()}
      />
    );
  if (!apps.length)
    return (
      <StateNote
        s={s}
        title="No apps yet"
        note="Create an app first, then give it a domain."
      />
    );
  return (
    <View style={st.list}>
      {apps.map((app) => (
        <AppRow
          key={String(app.id)}
          s={s}
          app={app}
          selected={value != null && String(value) === String(app.id)}
          onPress={() => onChange(app)}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: 36, height: 36 },
  initial: { fontFamily: F.sans700, fontSize: 15 },
  body: { flex: 1 },
  name: { fontFamily: F.sans600, fontSize: 14 },
  kind: { fontFamily: F.sans500, fontSize: 11.5, marginTop: 1 },
});
