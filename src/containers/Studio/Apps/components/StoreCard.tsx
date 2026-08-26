import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { TenantSummary } from '@/api/studio';
import { useCoderTheme } from '@/lib/theme';

const ACTIONS: {
  key: 'store' | 'cms' | 'remix';
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconAfter?: boolean;
}[] = [
  { key: 'store', label: 'View Store', icon: 'open-outline', iconAfter: true },
  { key: 'cms', label: 'View CMS', icon: 'arrow-forward', iconAfter: true },
  { key: 'remix', label: 'Remix', icon: 'code-slash-outline' },
];

/** `en-GB`-style day/month/year — locale-neutral and unambiguous, unlike
 *  `MM/DD` which reads differently depending on the reader's region. */
function formatCreated(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function StoreCard({
  tenant,
  loading,
  onViewCms,
  onViewStore,
  onViewCustomStore,
}: {
  tenant: TenantSummary;
  loading: boolean;
  onViewCms: () => void;
  onViewStore: () => void;
  onViewCustomStore: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);

  const handlers = {
    store: onViewStore,
    cms: onViewCms,
    remix: onViewCustomStore,
  } as const;
  // Only CMS depends on the attach-tenant call the parent tracks with
  // `loading` — Store and Remix just navigate.
  const busyKeys = new Set<(typeof ACTIONS)[number]['key']>(['cms']);
  const created = formatCreated(tenant.created_at ?? tenant.created_on);

  return (
    <View
      style={[
        st.card,
        { backgroundColor: t.card, borderColor: t.studioCardBorder },
      ]}
    >
      <View style={st.topRow}>
        <View
          style={[
            st.logoWrap,
            {
              backgroundColor: t.studioCardLogoBg,
              borderColor: t.studioCardBorder,
            },
          ]}
        >
          {tenant.logo ? (
            <Image
              source={{ uri: tenant.logo }}
              style={st.logo}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="storefront-outline" size={22} color={t.textMuted} />
          )}
        </View>

        <View style={st.titleWrap}>
          <Text style={[st.title, { color: t.text }]} numberOfLines={1}>
            {(tenant.title || 'Untitled store').slice(0, 40)}
          </Text>
          {!!tenant.website_url && (
            <Text
              style={[st.subtitle, { color: t.textMuted }]}
              numberOfLines={1}
            >
              {tenant.website_url}
            </Text>
          )}
          <Text style={[st.meta, { color: t.textMuted }]} numberOfLines={1}>
            ID {tenant.id}
            {created ? `  ·  Created ${created}` : ''}
          </Text>
        </View>
      </View>

      {/* Same shape, fill and border on all four — the old pair of solid
          `accent`-filled pills next to a pair of outlined ones made CMS/CRM
          read as the "real" actions and Store/Remix as secondary, which
          isn't true; all four are equally valid next steps. */}
      <View style={st.actionsRow}>
        {ACTIONS.map((action) => {
          const busy = loading && busyKeys.has(action.key);
          return (
            <Pressable
              key={action.key}
              style={st.actionSlot}
              onPress={handlers[action.key]}
              disabled={busyKeys.has(action.key) && loading}
            >
              <View style={[st.actionBtn, { borderColor: t.studioCardBorder }]}>
                {busy ? (
                  <ActivityIndicator size="small" color={t.text} />
                ) : (
                  <>
                    {!action.iconAfter && (
                      <Ionicons name={action.icon} size={14} color={t.text} />
                    )}
                    <Text style={[st.actionText, { color: t.text }]}>
                      {action.label}
                    </Text>
                    {action.iconAfter && (
                      <Ionicons name={action.icon} size={14} color={t.text} />
                    )}
                  </>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 5,
    padding: 14,
    marginHorizontal: 0,
    marginBottom: 10,
    borderWidth: 1,
    gap: 18,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  titleWrap: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  meta: { fontSize: 11, marginTop: 3 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // The Pressable owns the grid slot; the View inside owns the skin. NativeWind's
  // JSX transform drops `style` callbacks on Pressable, so visual styling never
  // goes on the Pressable itself in this codebase.
  actionSlot: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 5,
    borderWidth: 1,
  },
  actionText: { fontSize: 12.5, fontWeight: '700' },
});
