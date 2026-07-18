import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Commission, VendorListItem } from '@/api/vendors';
import { useCommissions, useDeleteCommission } from '@/api/vendors';
import { ConfirmModal, useModal } from '@/components/ui';

import { CmsButton, CmsCard, CmsField, CmsModal, CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getVendorStatusMeta, money } from '../utils';
import { ManageCommissionModal } from './ManageCommissionModal';

type Props = {
  colors: CmsThemeColors;
  vendor: VendorListItem | null;
};

function formatDate(d?: string | null) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const VendorDetailSheet = React.forwardRef<BottomSheetModal, Props>(({ colors, vendor }, ref) => {
  const commissionsQuery = useCommissions();
  const deleteCommission = useDeleteCommission();

  const [manageTarget, setManageTarget] = React.useState<{ commission: Commission | null; key: number }>({
    commission: null,
    key: 0,
  });
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  const vendorCommissions = (commissionsQuery.data ?? []).filter((c) => c.vendor === vendor?.id);
  const documents = vendor?.documents ?? {};
  const documentKeys = Object.keys(documents);

  function openAddCommission() {
    setManageTarget((prev) => ({ commission: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEditCommission(commission: Commission) {
    setManageTarget((prev) => ({ commission, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDeleteCommission(id: number) {
    setDeletingId(id);
    confirmModal.present();
  }
  function confirmDelete() {
    if (deletingId === null) return;
    deleteCommission.mutate(deletingId, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingId(null);
      },
    });
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={vendor ? vendor.title : 'Vendor'}>
      {!vendor ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No vendor selected.</Text>
        </View>
      ) : (
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        >
          <CmsCard colors={colors} title="General Information">
            <View style={st.fieldGrid}>
              <CmsField label="Vendor Name" value={vendor.title} colors={colors} />
              <View style={{ gap: 2, minWidth: 140 }}>
                <Text style={[cmsType.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
                <CmsStatusBadge meta={getVendorStatusMeta(vendor.status)} />
              </View>
              <CmsField label="Tenant Type" value={vendor.tenant_type} colors={colors} />
              <CmsField label="Vendor ID" value={`#${vendor.id}`} colors={colors} />
            </View>
          </CmsCard>

          <CmsCard colors={colors}>
            <View style={st.sectionHeader}>
              <Text style={[cmsType.sectionTitle, { color: colors.textPrimary }]}>Commission Details</Text>
              <Pressable onPress={openAddCommission} hitSlop={6}>
                <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
              </Pressable>
            </View>

            {commissionsQuery.isLoading ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading commissions…</Text>
            ) : vendorCommissions.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No commissions configured for this vendor.</Text>
            ) : (
              vendorCommissions.map((c) => (
                <View key={c.id} style={[st.commissionRow, { borderColor: colors.border }]}>
                  <View style={st.commissionFieldsGrid}>
                    <CmsField label="Type" value={c.commission_type} colors={colors} />
                    <CmsField
                      label="Value"
                      value={c.commission_type === 'percentage' ? `${c.value}%` : `Rs. ${money(c.value)}`}
                      colors={colors}
                    />
                    <CmsField label="Min Order" value={`Rs. ${money(c.min_order_value ?? 0)}`} colors={colors} />
                    <CmsField label="Valid" value={`${formatDate(c.valid_from)} – ${formatDate(c.valid_to)}`} colors={colors} />
                  </View>
                  <CmsStatusBadge
                    meta={
                      c.is_active
                        ? { label: 'Active', color: colors.success, kind: 'success' }
                        : { label: 'Inactive', color: colors.textSecondary, kind: 'info' }
                    }
                  />
                  <View style={st.commissionActions}>
                    <CmsButton colors={colors} label="Edit" variant="ghost" onPress={() => openEditCommission(c)} style={{ flex: 1 }} />
                    <CmsButton colors={colors} label="Delete" variant="danger" onPress={() => openDeleteCommission(c.id)} style={{ flex: 1 }} />
                  </View>
                </View>
              ))
            )}
          </CmsCard>

          <CmsCard colors={colors} title="Additional Details">
            {documentKeys.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No documents configured for this vendor.</Text>
            ) : (
              documentKeys.map((key) => (
                <Pressable key={key} onPress={() => Linking.openURL(documents[key])} style={[st.docRow, { borderColor: colors.border }]}>
                  <Text style={[st.docLabel, { color: colors.textSecondary }]}>{key}</Text>
                  <Text style={{ color: colors.accent, fontSize: 12.5 }} numberOfLines={1}>
                    {documents[key]}
                  </Text>
                </Pressable>
              ))
            )}
          </CmsCard>
        </BottomSheetScrollView>
      )}

      <ManageCommissionModal
        ref={manageModal.ref}
        colors={colors}
        vendor={vendor}
        commission={manageTarget.commission}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title="Delete this commission?"
        description="This commission rule will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={deleteCommission.isPending}
        onConfirm={confirmDelete}
      />
    </CmsModal>
  );
});

const st = StyleSheet.create({
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commissionRow: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6, marginTop: 8 },
  commissionFieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  commissionActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  docRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  docLabel: cmsType.fieldLabel,
});
