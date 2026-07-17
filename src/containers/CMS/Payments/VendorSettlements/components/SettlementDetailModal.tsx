import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Text, View } from 'react-native';

import type { VendorSettlementListItem } from '@/api/payments';

import { CmsCard, CmsField, CmsModal, CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { formatSettlementDate, money } from '../utils';

type Props = { colors: CmsThemeColors; settlement: VendorSettlementListItem | null };

/**
 * Read-only settlement inspector. Vite's `ViewSettlementModal` never actually
 * read the clicked settlement (it opened a blank, unwired "Add Settlement"
 * form whose submit was a no-op) — this renders the real record instead,
 * same recipe as `OrderDetailModal`.
 */
export const SettlementDetailModal = React.forwardRef<BottomSheetModal, Props>(({ colors, settlement }, ref) => {
  if (!settlement) {
    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Settlement">
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No settlement selected.</Text>
        </View>
      </CmsModal>
    );
  }

  const orderId = settlement.vendor_order ?? settlement.parent_order ?? 'NA';
  const vendorLabel = settlement.parent_tenant?.title ?? settlement.vendor_tenant?.title;

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['65%']} title={`Settlement #${orderId}`}>
      <BottomSheetScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <CmsCard colors={colors}>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <CmsStatusBadge meta={getPaymentStatusMeta(settlement.status)} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <CmsField label="Order ID" value={String(orderId)} colors={colors} />
            <CmsField label="Vendor" value={vendorLabel} colors={colors} />
            <CmsField label="Date" value={formatSettlementDate(settlement.created_on)} colors={colors} />
            <CmsField label="Total Commission" value={`Rs. ${money(settlement.total_commission)}`} colors={colors} />
            <CmsField label="Vendor Payout" value={`Rs. ${money(settlement.vendor_payout)}`} colors={colors} />
            <CmsField label="Gross Amount" value={`Rs. ${money(settlement.gross_amount)}`} colors={colors} />
          </View>
        </CmsCard>
      </BottomSheetScrollView>
    </CmsModal>
  );
});
