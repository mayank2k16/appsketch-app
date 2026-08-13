import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAttachTenant, useUserTenants } from '@/api/';
import type { TenantSummary } from '@/api/studio';
import { useStudio } from '@/lib/store/studio-store';
import { useAppTheme } from '@/lib/theme';

import { StoreCard } from './components/StoreCard';

export function AppsScreen() {
  const router = useRouter();
  const tenantsQuery = useUserTenants();
  const attachTenant = useAttachTenant();
  const setAttachedTenant = useStudio.use.setAttachedTenant();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const [attachingId, setAttachingId] = React.useState<
    TenantSummary['id'] | null
  >(null);
  const [search, setSearch] = React.useState('');

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

  function handleViewCrm(tenant: TenantSummary) {}

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
      <View style={st.center}>
        <ActivityIndicator color={t.accent} />
      </View>
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
          onViewCrm={() => handleViewCrm(item)}
          onViewCustomStore={() => handleViewCustomStore(item)}
        />
      )}
      ListHeaderComponent={
        tenants.length > 0 ? (
          <View
            style={[
              st.searchWrap,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Ionicons name="search" size={16} color={t.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your stores by name or description…"
              placeholderTextColor={t.textMuted}
              style={[st.searchInput, { color: t.text }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={t.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null
      }
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 42,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13.5, height: '100%' },
});
