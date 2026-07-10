import * as React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { TenantSummary } from '@/api/studio';
import { useAttachTenant, useUserTenants } from '@/api/';
import { useStudio } from '@/lib/store/studio-store';

import { StoreCard } from './components/StoreCard';

const MUTED = '#8A8A8A';
const BLACK = '#0D0D0D';

export function AppsScreen() {
  const router = useRouter();
  const tenantsQuery = useUserTenants();
  const attachTenant = useAttachTenant();
  const setAttachedTenant = useStudio.use.setAttachedTenant();

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
        <ActivityIndicator color={BLACK} />
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
          <Ionicons name="storefront-outline" size={36} color={MUTED} />
          <Text style={st.emptyText}>
            {tenantsQuery.isError ? 'Could not load your stores' : 'No stores on this account yet'}
          </Text>
        </View>
      }
    />
  );
}

const st = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: MUTED, fontSize: 13, fontWeight: '600' },
});
