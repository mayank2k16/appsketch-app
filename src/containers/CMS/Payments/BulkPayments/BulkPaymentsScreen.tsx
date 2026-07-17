import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { BulkPaymentDetail } from '@/api/payments';
import { useBulkPayments } from '@/api/payments';
import { useModal } from '@/components/ui';

import { useCmsTheme } from '../../theme';
import { AddBulkPaymentModal } from './components/AddBulkPaymentModal';
import { BulkPaymentDetailModal } from './components/BulkPaymentDetailModal';
import { BulkPaymentListCard } from './components/BulkPaymentListCard';

export function BulkPaymentsScreen() {
  const { colors } = useCmsTheme();

  const bulkPaymentsQuery = useBulkPayments();
  const payments = React.useMemo(
    () => bulkPaymentsQuery.data?.pages.flat() ?? [],
    [bulkPaymentsQuery.data]
  );

  const [selectedPayment, setSelectedPayment] = React.useState<BulkPaymentDetail | null>(null);
  const addModal = useModal();
  const detailModal = useModal();

  function openView(payment: BulkPaymentDetail) {
    setSelectedPayment(payment);
    detailModal.present();
  }

  const renderItem = React.useCallback(
    ({ item }: { item: BulkPaymentDetail }) => (
      <BulkPaymentListCard payment={item} colors={colors} onView={() => openView(item)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.actionsRow}>
        <Pressable onPress={addModal.present} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add Bulk Payment</Text>
        </Pressable>
      </View>

      {bulkPaymentsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading bulk payments…</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>
            There are no bulk payment records available at the moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (bulkPaymentsQuery.hasNextPage && !bulkPaymentsQuery.isFetchingNextPage) {
              bulkPaymentsQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            bulkPaymentsQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      <AddBulkPaymentModal ref={addModal.ref} colors={colors} onDone={() => addModal.dismiss()} />
      <BulkPaymentDetailModal ref={detailModal.ref} colors={colors} payment={selectedPayment} />
    </View>
  );
}

const st = StyleSheet.create({
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
