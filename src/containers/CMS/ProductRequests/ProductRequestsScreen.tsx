import * as React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { ProductRequestItem } from '@/api/product-requests';
import { useProductRequests, useUpdateProductRequestStatus } from '@/api/product-requests';
import type { VendorListItem } from '@/api/vendors';
import { useVendors } from '@/api/vendors';
import { useModal } from '@/components/ui';
import { useVendorFilter } from '@/lib/store/vendor-filter-store';

import { CmsButton, CmsSelect } from '../components';
import { ManageProductModal } from '../Products/components/ManageProductModal';
import { useCmsTheme } from '../theme';
import { ApproveRequestModal } from './components/ApproveRequestModal';
import { ProductRequestCard } from './components/ProductRequestCard';
import { ProductRequestsSkeleton } from './components/ProductRequestsSkeleton';
import { RejectRequestModal } from './components/RejectRequestModal';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Products' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function ProductRequestsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  // Bumped every time an approve/reject sheet opens, so it can be used as a
  // `key` to force a fresh mount (and therefore reset internal state — the
  // picked inventory / typed rejection notes) each time, same idea as
  // `CategoriesScreen`'s `manageTarget.key`.
  const [actionKey, setActionKey] = React.useState(0);
  const [actionType, setActionType] = React.useState<'APPROVED' | 'REJECTED' | null>(null);
  const [viewProduct, setViewProduct] = React.useState<ProductRequestItem | null>(null);

  const productRequestsQuery = useProductRequests();
  const updateStatus = useUpdateProductRequestStatus();
  const vendorsQuery = useVendors();
  const approveModal = useModal();
  const rejectModal = useModal();
  const viewModal = useModal();

  const vendorsById = React.useMemo(() => {
    const map = new Map<number, VendorListItem>();
    for (const v of vendorsQuery.data ?? []) map.set(v.id, v);
    return map;
  }, [vendorsQuery.data]);

  const products = productRequestsQuery.data ?? [];

  const selectedVendor = useVendorFilter.use.selectedVendor();
  const vendorFilteredProducts = React.useMemo(() => {
    if (!selectedVendor) return products;
    return products.filter((p) => (p.sold_by_id ?? p.tenant_id) === selectedVendor.id);
  }, [products, selectedVendor]);

  const filteredProducts = React.useMemo(() => {
    if (statusFilter === 'ALL') return vendorFilteredProducts;
    return vendorFilteredProducts.filter((item) => item.status === statusFilter);
  }, [vendorFilteredProducts, statusFilter]);

  function toggleSelection(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]));
  }

  function openApprove() {
    if (selectedIds.length === 0) return;
    setActionType('APPROVED');
    setActionKey((k) => k + 1);
    approveModal.present();
  }

  function openReject() {
    if (selectedIds.length === 0) return;
    setActionType('REJECTED');
    setActionKey((k) => k + 1);
    rejectModal.present();
  }

  function openView(product: ProductRequestItem) {
    setViewProduct(product);
    viewModal.present();
  }

  function confirmApprove(inventoryId: number) {
    updateStatus.mutate(
      { product_ids: selectedIds, action: 'APPROVED', inventory_id: inventoryId },
      {
        onSuccess: () => {
          setSelectedIds([]);
          approveModal.dismiss();
          setActionType(null);
        },
      }
    );
  }

  function confirmReject(notes: string) {
    updateStatus.mutate(
      { product_ids: selectedIds, action: 'REJECTED', notes },
      {
        onSuccess: () => {
          setSelectedIds([]);
          rejectModal.dismiss();
          setActionType(null);
        },
      }
    );
  }

  const renderItem = React.useCallback(
    ({ item }: { item: ProductRequestItem }) => (
      <ProductRequestCard
        product={item}
        vendor={vendorsById.get(item.sold_by_id ?? item.tenant_id ?? -1)}
        colors={colors}
        isSelected={selectedIds.includes(item.id)}
        onToggle={() => toggleSelection(item.id)}
        onView={() => openView(item)}
      />
    ),
    [colors, selectedIds, vendorsById]
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
        <ProductRequestsSkeleton colors={colors} />
      ) : filteredProducts.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No pending product requests.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        />
      )}

      <View style={[st.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <CmsButton
          colors={colors}
          label="Approve Selected"
          onPress={openApprove}
          disabled={selectedIds.length === 0}
          style={{ flex: 1 }}
        />
        <CmsButton
          colors={colors}
          label="Reject Selected"
          variant="danger"
          onPress={openReject}
          disabled={selectedIds.length === 0}
          style={{ flex: 1 }}
        />
      </View>

      <ApproveRequestModal
        ref={approveModal.ref}
        resetKey={actionKey}
        colors={colors}
        productCount={selectedIds.length}
        loading={updateStatus.isPending && actionType === 'APPROVED'}
        onConfirm={confirmApprove}
      />
      <RejectRequestModal
        ref={rejectModal.ref}
        resetKey={actionKey}
        colors={colors}
        productCount={selectedIds.length}
        loading={updateStatus.isPending && actionType === 'REJECTED'}
        onConfirm={confirmReject}
      />

      <ManageProductModal
        ref={viewModal.ref}
        colors={colors}
        product={viewProduct}
        readOnly
        onSuccess={() => {
          viewModal.dismiss();
          setViewProduct(null);
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  filterWrap: { paddingHorizontal: 14, paddingTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: 30,
  },
});
