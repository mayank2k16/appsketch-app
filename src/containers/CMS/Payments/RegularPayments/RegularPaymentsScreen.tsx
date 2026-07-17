import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentListItem } from '@/api/payments';
import { usePayments } from '@/api/payments';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../../theme';
import { AddPaymentModal } from './components/AddPaymentModal';
import { ManagePaymentModal } from './components/ManagePaymentModal';
import { PaymentListCard } from './components/PaymentListCard';

export function RegularPaymentsScreen() {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const paymentsQuery = usePayments();
  const payments = paymentsQuery.data ?? [];

  const filteredPayments = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (item) =>
        item.invoice_details?.title?.toString().toLowerCase().includes(q) ||
        item.order_details?.title?.toString().toLowerCase().includes(q) ||
        item.transaction_type?.toString().toLowerCase().includes(q) ||
        item.status?.toString().toLowerCase().includes(q)
    );
  }, [payments, debouncedQuery]);

  const [selectedPayment, setSelectedPayment] = React.useState<PaymentListItem | null>(null);
  const addModal = useModal();
  const manageModal = useModal();

  function openAdd() {
    addModal.present();
  }
  function openManage(payment: PaymentListItem) {
    setSelectedPayment(payment);
    manageModal.present();
  }

  const renderItem = React.useCallback(
    ({ item }: { item: PaymentListItem }) => (
      <PaymentListCard payment={item} colors={colors} onEdit={() => openManage(item)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.headerRow}>
        <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search payments…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={openAdd} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add</Text>
        </Pressable>
      </View>

      {paymentsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading payments…</Text>
        </View>
      ) : filteredPayments.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No payment records available at the moment.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}

      <AddPaymentModal ref={addModal.ref} colors={colors} onDone={() => addModal.dismiss()} />
      <ManagePaymentModal ref={manageModal.ref} colors={colors} payment={selectedPayment} />
    </View>
  );
}

const st = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 42, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
