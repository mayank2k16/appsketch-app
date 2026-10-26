/* eslint-disable unicorn/filename-case --
   Pre-existing name; StudioScreen imports it by this path. */
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAppGroups, useUserTenants } from '@/api/';
import type { AppGroup, TenantSummary } from '@/api/studio';

import { EcosystemCard } from './components/EcosystemCard';
import { StoreCard } from './components/StoreCard';
import { StoreCardSkeleton } from './components/StoreCardSkeleton';
import { useAppsPalette } from './palette';
import { useAppActions } from './use-app-actions';

const skeletonData = [0, 1, 2, 3];

function matches(query: string, ...texts: (string | undefined)[]) {
  return !query || texts.join(' ').toLowerCase().includes(query);
}

/** Ecosystems first (each with its apps), then every app that isn't in one.
 *  Search narrows both: an ecosystem stays when its name or any of its apps
 *  match. */
function useLists(search: string) {
  const tenantsQuery = useUserTenants();
  const groupsQuery = useAppGroups();
  const query = search.trim().toLowerCase();
  return React.useMemo(() => {
    const groups: AppGroup[] = (groupsQuery.data ?? []).filter((g) =>
      matches(query, g.name, ...g.apps.map((a) => a.title))
    );
    const grouped = new Set(
      (groupsQuery.data ?? []).flatMap((g) =>
        g.apps.map((a) => String(a.app_id))
      )
    );
    // Newest first — `id` is auto-increment, so this is creation order.
    const apps: TenantSummary[] = [...(tenantsQuery.data ?? [])]
      .filter((t) => !grouped.has(String(t.id)))
      .filter((t) => matches(query, t.title, t.description))
      .sort((a, b) => Number(b.id) - Number(a.id));
    return {
      groups,
      apps,
      loading: tenantsQuery.isLoading,
      error: tenantsQuery.isError,
      query,
    };
  }, [
    tenantsQuery.data,
    tenantsQuery.isLoading,
    tenantsQuery.isError,
    groupsQuery.data,
    query,
  ]);
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  const p = useAppsPalette();
  return (
    <View style={st.sectionRow}>
      <View style={[st.sectionDot, { backgroundColor: p.orange }]} />
      <Text style={[st.section, { color: p.ink }]}>{label}</Text>
      <Text style={[st.sectionCount, { color: p.sub }]}>{count}</Text>
    </View>
  );
}

export function AppsScreen({ search }: { search: string }) {
  const p = useAppsPalette();
  const { groups, apps, loading, error, query } = useLists(search);
  const { view, edit, busyId } = useAppActions();

  if (loading) {
    return (
      <FlatList
        data={skeletonData}
        keyExtractor={(i) => `skeleton-${i}`}
        renderItem={() => <StoreCardSkeleton t={p.t} />}
        contentContainerStyle={st.list}
      />
    );
  }

  const header = groups.length ? (
    <View>
      <SectionTitle label="Ecosystems" count={groups.length} />
      {groups.map((g) => (
        <EcosystemCard
          key={g.id}
          group={g}
          busyId={busyId}
          onView={view}
          onEdit={edit}
        />
      ))}
      {apps.length ? <SectionTitle label="Apps" count={apps.length} /> : null}
    </View>
  ) : null;

  return (
    <FlatList
      data={apps}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <StoreCard
          tenant={item}
          busy={busyId === item.id}
          onView={() => view(item)}
          onEdit={() => edit(item)}
        />
      )}
      contentContainerStyle={st.list}
      ListEmptyComponent={
        groups.length ? null : (
          <View style={st.center}>
            <Ionicons name="apps-outline" size={36} color={p.sub} />
            <Text style={[st.emptyText, { color: p.sub }]}>
              {error
                ? 'Could not load your apps'
                : query
                  ? `No apps match "${search.trim()}"`
                  : 'No apps on this account yet'}
            </Text>
          </View>
        )
      }
    />
  );
}

const st = StyleSheet.create({
  list: { paddingTop: 2, paddingBottom: 24, paddingHorizontal: 1 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
    marginBottom: 10,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  section: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
