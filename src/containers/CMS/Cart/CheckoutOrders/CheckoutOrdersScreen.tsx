import * as React from 'react';
import { FlatList, Text, View } from 'react-native';

import type { CheckoutOrderItem } from '@/api/cart';
import { useCheckoutOrders } from '@/api/cart';

import { useCmsTheme } from '../../theme';
import { CheckoutOrderCard } from './components/CheckoutOrderCard';

/** Read-only list of checkouts still in progress (payment_status=CHECKOUT) —
 * not real placed orders yet, so no edit/accept/reject/assign actions here.
 * Polls every 8s while focused (`useCheckoutOrders`), matching Vite's
 * `setInterval(load, 8000)`. */
export function CheckoutOrdersScreen() {
  const { colors } = useCmsTheme();
  const ordersQuery = useCheckoutOrders();
  const orders = ordersQuery.data ?? [];

  const renderItem = React.useCallback(
    ({ item }: { item: CheckoutOrderItem }) => <CheckoutOrderCard order={item} colors={colors} />,
    [colors]
  );

  if (ordersQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Loading checkout orders…</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No checkouts in progress.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
    />
  );
}
