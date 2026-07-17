import * as React from 'react';
import { FlatList, Text, TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { VendorSettlementListItem } from '@/api/payments';
import { useDeleteVendorSettlement, useVendorSettlements } from '@/api/payments';
import { ConfirmModal, useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../../theme';
import { SettlementDetailModal } from './components/SettlementDetailModal';
import { SettlementListCard } from './components/SettlementListCard';

export function VendorSettlementsScreen() {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const settlementsQuery = useVendorSettlements();
  const deleteSettlement = useDeleteVendorSettlement();
  const settlements = settlementsQuery.data ?? [];

  const filteredSettlements = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return settlements;
    return settlements.filter(
      (item) =>
        item.vendor_order?.toString().toLowerCase().includes(q) ||
        item.parent_order?.toString().toLowerCase().includes(q) ||
        item.vendor_tenant?.title?.toString().toLowerCase().includes(q) ||
        item.parent_tenant?.title?.toString().toLowerCase().includes(q) ||
        item.status?.toString().toLowerCase().includes(q)
    );
  }, [settlements, debouncedQuery]);

  const [selectedSettlement, setSelectedSettlement] = React.useState<VendorSettlementListItem | null>(null);
  const [deletingSettlement, setDeletingSettlement] = React.useState<VendorSettlementListItem | null>(null);
  const detailModal = useModal();
  const confirmModal = useModal();

  function openView(settlement: VendorSettlementListItem) {
    setSelectedSettlement(settlement);
    detailModal.present();
  }
  function openDelete(settlement: VendorSettlementListItem) {
    setDeletingSettlement(settlement);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingSettlement) return;
    deleteSettlement.mutate(deletingSettlement.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingSettlement(null);
      },
    });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: VendorSettlementListItem }) => (
      <SettlementListCard settlement={item} colors={colors} onView={() => openView(item)} onDelete={() => openDelete(item)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search vendor settlements…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
          returnKeyType="search"
        />
      </View>

      {settlementsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading settlements…</Text>
        </View>
      ) : filteredSettlements.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No settlement records available.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSettlements}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <SettlementDetailModal ref={detailModal.ref} colors={colors} settlement={selectedSettlement} />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete settlement?"
        description={deletingSettlement ? `Settlement #${deletingSettlement.vendor_order ?? deletingSettlement.parent_order ?? ''} will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        destructive
        loading={deleteSettlement.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const st = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
