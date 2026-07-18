import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VendorListItem } from '@/api/vendors';

import { CmsButton, CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { getVendorStatusMeta } from '../utils';

type Props = {
  vendor: VendorListItem;
  colors: CmsThemeColors;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionsDisabled?: boolean;
};

export const VendorListCard = React.memo(function VendorListCard({
  vendor,
  colors,
  onView,
  onApprove,
  onReject,
  actionsDisabled,
}: Props) {
  const isApproved = vendor.status === 'approved';

  return (
    <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.headerRow}>
        <Text style={[st.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {vendor.title || 'N/A'}
        </Text>
        <CmsStatusBadge meta={getVendorStatusMeta(vendor.status)} />
      </View>

      <Text style={[st.meta, { color: colors.textSecondary }]}>{vendor.tenant_type || 'N/A'}</Text>

      <View style={st.actions}>
        <CmsButton colors={colors} label="View" variant="ghost" onPress={onView} style={{ flex: 1 }} />
        {!isApproved ? (
          <>
            <CmsButton colors={colors} label="Approve" onPress={onApprove} disabled={actionsDisabled} style={{ flex: 1 }} />
            <CmsButton colors={colors} label="Reject" variant="danger" onPress={onReject} disabled={actionsDisabled} style={{ flex: 1 }} />
          </>
        ) : null}
      </View>
    </View>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { ...cmsType.listTitle, flex: 1 },
  meta: cmsType.listMeta,
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
