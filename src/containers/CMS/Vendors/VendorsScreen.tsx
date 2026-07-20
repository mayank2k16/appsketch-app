import * as React from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { VendorListItem } from '@/api/vendors';
import { useVendorAction, useVendors } from '@/api/vendors';
import { useModal } from '@/components/ui';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { VendorDetailSheet } from './components/VendorDetailSheet';
import { VendorListCard } from './components/VendorListCard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VendorsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');

  const vendorsQuery = useVendors();
  const vendorAction = useVendorAction();
  const vendors = vendorsQuery.data ?? [];

  const filteredVendors = React.useMemo(() => {
    const q = query.toLowerCase();
    return vendors.filter((v) => v.title?.toLowerCase().includes(q) || v.tenant_type?.toLowerCase().includes(q));
  }, [vendors, query]);

  const [selectedVendor, setSelectedVendor] = React.useState<VendorListItem | null>(null);
  const [actionTarget, setActionTarget] = React.useState<{ vendor: VendorListItem; action: 'approve' | 'reject' } | null>(
    null
  );
  const detailModal = useModal();
  const confirmModal = useModal();

  function openView(vendor: VendorListItem) {
    setSelectedVendor(vendor);
    detailModal.present();
  }
  function openAction(vendor: VendorListItem, action: 'approve' | 'reject') {
    setActionTarget({ vendor, action });
    confirmModal.present();
  }
  function confirmAction() {
    if (!actionTarget) return;
    vendorAction.mutate(
      { vendorId: actionTarget.vendor.id, action: actionTarget.action, vendorTitle: actionTarget.vendor.title },
      {
        onSuccess: () => {
          confirmModal.dismiss();
          setActionTarget(null);
        },
      }
    );
  }

  const renderItem = React.useCallback(
    ({ item }: { item: VendorListItem }) => (
      <VendorListCard
        vendor={item}
        colors={colors}
        onView={() => openView(item)}
        onApprove={() => openAction(item, 'approve')}
        onReject={() => openAction(item, 'reject')}
        actionsDisabled={vendorAction.isPending}
      />
    ),
    [colors, vendorAction.isPending]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or tenant type…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      {vendorsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading vendors…</Text>
        </View>
      ) : filteredVendors.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No vendors found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <VendorDetailSheet ref={detailModal.ref} colors={colors} vendor={selectedVendor} />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
        title={`Confirm ${actionTarget?.action === 'approve' ? 'Approval' : 'Rejection'}`}
        description={
          actionTarget
            ? `Are you sure you want to ${actionTarget.action} vendor "${actionTarget.vendor.title}"?`
            : undefined
        }
        confirmLabel={actionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
        destructive={actionTarget?.action === 'reject'}
        loading={vendorAction.isPending}
        onConfirm={confirmAction}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
