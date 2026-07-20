import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { ProductRequestActionType, ProductRequestItem } from '@/api/product-requests';
import { useProductRequests, useUpdateProductRequestStatus } from '@/api/product-requests';
import { ConfirmModal, useModal } from '@/components/ui';

import { CmsButton, CmsSelect } from '../components';
import { useCmsTheme } from '../theme';
import { ProductRequestCard } from './components/ProductRequestCard';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Products' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProductRequestsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [actionType, setActionType] = React.useState<ProductRequestActionType | null>(null);

  const productRequestsQuery = useProductRequests();
  const updateStatus = useUpdateProductRequestStatus();
  const confirmModal = useModal();

  const products = productRequestsQuery.data ?? [];
  const filteredProducts = React.useMemo(() => {
    if (statusFilter === 'ALL') return products;
    return products.filter((item) => item.status === statusFilter);
  }, [products, statusFilter]);

  function toggleSelection(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
  }

  function openConfirm(action: ProductRequestActionType) {
    if (selectedIds.length === 0) return;
    setActionType(action);
    confirmModal.present();
  }

  function confirmAction() {
    if (!actionType) return;
    updateStatus.mutate(
      { product_ids: selectedIds, action: actionType },
      {
        onSuccess: () => {
          setSelectedIds([]);
          confirmModal.dismiss();
          setActionType(null);
        },
      }
    );
  }

  const renderItem = React.useCallback(
    ({ item }: { item: ProductRequestItem }) => (
      <ProductRequestCard
        product={item}
        colors={colors}
        isSelected={selectedIds.includes(item.id)}
        onToggle={() => toggleSelection(item.id)}
      />
    ),
    [colors, selectedIds]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.filterWrap}>
        <CmsSelect
          colors={colors}
          label="Status Filter"
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onSelect={(value) => setStatusFilter(value as StatusFilter)}
        />
      </View>

      {productRequestsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading product requests…</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No pending product requests.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <View style={[st.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <CmsButton
          colors={colors}
          label="Approve Selected"
          onPress={() => openConfirm('APPROVED')}
          disabled={selectedIds.length === 0}
          style={{ flex: 1 }}
        />
        <CmsButton
          colors={colors}
          label="Reject Selected"
          variant="danger"
          onPress={() => openConfirm('REJECTED')}
          disabled={selectedIds.length === 0}
          style={{ flex: 1 }}
        />
      </View>

      <ConfirmModal
        ref={confirmModal.ref}
        title={actionType === 'APPROVED' ? 'Approve Products' : 'Reject Products'}
        description={
          actionType === 'APPROVED'
            ? 'Are you sure you want to approve the selected products?'
            : 'Are you sure you want to reject the selected products?'
        }
        confirmLabel={actionType === 'APPROVED' ? 'Approve' : 'Reject'}
        destructive={actionType === 'REJECTED'}
        loading={updateStatus.isPending}
        onConfirm={confirmAction}
      />
    </View>
  );
}

const st = StyleSheet.create({
  filterWrap: { paddingHorizontal: 16, paddingTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
