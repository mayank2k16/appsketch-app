import * as React from 'react';
import { FlatList, Text, View } from 'react-native';

import type { AbandonedCartItem } from '@/api/cart';
import { useAbandonedCarts, useDiscardCart } from '@/api/cart';

import { useCmsTheme } from '../../theme';
import { AbandonedCartCard } from './components/AbandonedCartCard';

/** Read-only list of ACTIVE carts that never became an Order at all — the
 * one allowed mutation is "Discard" (Cart.status -> DISCARDED), for ops
 * cleanup. No confirmation dialog, matching Vite (`AbandonedCarts.jsx`
 * discards immediately on click). */
export function AbandonedCartsScreen() {
  const { colors } = useCmsTheme();
  const cartsQuery = useAbandonedCarts();
  const discardCart = useDiscardCart();
  const carts = cartsQuery.data ?? [];
  const [discardingId, setDiscardingId] = React.useState<number | null>(null);

  function handleDiscard(cart: AbandonedCartItem) {
    setDiscardingId(cart.id);
    discardCart.mutate(cart.id, { onSettled: () => setDiscardingId(null) });
  }

  const renderItem = React.useCallback(
    ({ item }: { item: AbandonedCartItem }) => (
      <AbandonedCartCard cart={item} colors={colors} onDiscard={() => handleDiscard(item)} discarding={discardingId === item.id} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, discardingId]
  );

  if (cartsQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Loading abandoned carts…</Text>
      </View>
    );
  }

  if (carts.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No abandoned carts.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={carts}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
    />
  );
}
