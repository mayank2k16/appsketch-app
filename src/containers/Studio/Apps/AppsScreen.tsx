/* eslint-disable unicorn/filename-case, max-lines-per-function, import/no-cycle --
   Pre-existing: predates the kebab-case rule; the list/loading/empty states
   for one screen don't split cleanly; and StoreCard importing STUDIO_ACCENT
   back from StudioScreen is a type-only-adjacent constant re-export, not a
   real circular dependency. */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAttachTenant, useUserTenants } from '@/api/';
import type { TenantSummary } from '@/api/studio';
import { useStudio } from '@/lib/store/studio-store';
import { useCoderTheme } from '@/lib/theme';

import { StoreCard } from './components/StoreCard';
import { StoreCardSkeleton } from './components/StoreCardSkeleton';

const SKELETON_COUNT = 4;
const skeletonData = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

// Search now lives in StudioScreen's header, above the rail — it stays put
// across a section switch instead of scrolling away with the Apps list, so
// it's passed down as a controlled value rather than owned here.
export function AppsScreen({ search }: { search: string }) {
  const router = useRouter();
  const tenantsQuery = useUserTenants();
  const attachTenant = useAttachTenant();
  const setAttachedTenant = useStudio.use.setAttachedTenant();
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);

  const [attachingId, setAttachingId] = React.useState<
    TenantSummary['id'] | null
  >(null);

  function handleViewCms(tenant: TenantSummary) {
    setAttachingId(tenant.id);
    attachTenant.mutate(tenant.id, {
      onSuccess: () => {
        setAttachedTenant(tenant);
        router.push('/cms' as never);
      },
      onSettled: () => setAttachingId(null),
    });
  }

  // Same `/app-preview` route the Marketplace's "Use template" flow opens —
  // same header/WebView/copy-link behavior, just with an existing tenant's
  // uuid instead of creating a new one from a template. Falls back to the
  // tenant's numeric id when the API hasn't returned a `uuid` for it.
  function handleViewStore(tenant: TenantSummary) {
    router.push({
      pathname: '/app-preview',
      params: { uuid: tenant.uuid || String(tenant.id), name: tenant.title },
    } as never);
  }

  // Same `/code-editor/chat` route the hero-prompt flow (AgentScreen) pushes
  // to when starting a NEW build — the only difference is no `userPrompt` is
  // passed. `useCoderSocket`'s bootstrap effect resumes the tenant's latest
  // thread whenever `userPrompt` is absent, so the chat history, file tree,
  // and preview all restore automatically instead of starting a fresh build.
  function handleViewCustomStore(tenant: TenantSummary) {
    router.push({
      pathname: '/code-editor/chat',
      params: {
        tenantId: String(tenant.id),
        tenantUid: tenant.uuid || String(tenant.id),
        appType: 'web',
      },
    } as never);
  }

  if (tenantsQuery.isLoading) {
    return (
      <FlatList
        data={skeletonData}
        keyExtractor={(i) => `skeleton-${i}`}
        renderItem={() => <StoreCardSkeleton t={t} />}
        contentContainerStyle={{ paddingTop: 0, paddingHorizontal: 1 }}
      />
    );
  }

  // Newest first — `id` is auto-increment, so a plain numeric-descending sort
  // is creation order without needing `created_at` added to the serializer.
  const tenants = [...(tenantsQuery.data ?? [])].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  // Client-side: the list is already fetched whole (`useUserTenants`, 60s
  // staleTime) and an account's own store count doesn't warrant a round trip
  // per keystroke. Matches title OR description, whichever the tenant has.
  const query = search.trim().toLowerCase();
  const filtered = query
    ? tenants.filter((tenant) => {
        const haystack =
          `${tenant.title || ''} ${tenant.description || ''}`.toLowerCase();
        return haystack.includes(query);
      })
    : tenants;

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <StoreCard
          tenant={item}
          loading={attachingId === item.id}
          onViewCms={() => handleViewCms(item)}
          onViewStore={() => handleViewStore(item)}
          onViewCustomStore={() => handleViewCustomStore(item)}
        />
      )}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: 24,
        paddingHorizontal: 1,
      }}
      ListEmptyComponent={
        <View style={st.center}>
          <Ionicons name="storefront-outline" size={36} color={t.textMuted} />
          <Text style={[st.emptyText, { color: t.textMuted }]}>
            {tenantsQuery.isError
              ? 'Could not load your stores'
              : query
                ? `No stores match "${search.trim()}"`
                : 'No stores on this account yet'}
          </Text>
        </View>
      }
    />
  );
}

const st = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
