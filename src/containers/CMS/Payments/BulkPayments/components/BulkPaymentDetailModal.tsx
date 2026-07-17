import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BulkPaymentDetail } from '@/api/payments';

import { CmsCard, CmsModal, CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { money } from '../utils';

type Props = { colors: CmsThemeColors; payment: BulkPaymentDetail | null };

export const BulkPaymentDetailModal = React.forwardRef<BottomSheetModal, Props>(({ colors, payment }, ref) => {
  const rows = payment?.corresponding_payments ?? [];

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['75%']} title="Bulk Payment Details">
      <BottomSheetScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
        {!payment ? (
          <Text style={{ color: colors.textSecondary }}>No bulk payment selected.</Text>
        ) : rows.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No corresponding payments for this bulk payment.</Text>
        ) : (
          rows.map((row, i) => (
            <CmsCard key={i} colors={colors}>
              <View style={st.row}>
                <Text style={[st.invoice, { color: colors.textPrimary }]} numberOfLines={1}>
                  {row.invoice_details?.title ?? 'NA'}
                </Text>
                <CmsStatusBadge meta={getPaymentStatusMeta(row.status)} />
              </View>
              <Text style={[st.meta, { color: colors.textSecondary }]}>{row.created_on}</Text>
              <View style={st.amountsRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                  Rs. {money(row.amount)}
                </Text>
                {Number(row.partial_amount) > 0 ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
                    Partial: Rs. {money(row.partial_amount)}
                  </Text>
                ) : null}
              </View>
            </CmsCard>
          ))
        )}
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  invoice: { ...cmsType.listSubtitle, flex: 1 },
  meta: { ...cmsType.listMeta, marginTop: 2 },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
});
