import * as React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import type { TenantSummary } from '@/api/studio';
import { useAttachTenant, useUserTenants } from '@/api/';
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

  const [attachingId, setAttachingId] = React.useState<TenantSummary['id'] | null>(null);

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

  if (tenantsQuery.isLoading) {
    return (
      <View style={st.center}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  const tenants = tenantsQuery.data ?? [];

  return (
    <FlatList
      data={tenants}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <StoreCard tenant={item} loading={attachingId === item.id} onViewCms={() => handleViewCms(item)} />
      )}
      contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
      ListEmptyComponent={
        <View style={st.center}>
          <Ionicons name="storefront-outline" size={36} color={t.textMuted} />
          <Text style={[st.emptyText, { color: t.textMuted }]}>
            {tenantsQuery.isError ? 'Could not load your stores' : 'No stores on this account yet'}
          </Text>
        </View>
      }
    />
  );
}

const st = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
