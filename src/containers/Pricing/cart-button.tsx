import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { cartCount, useAppCart } from '@/lib/store/app-cart-store';

/** Header cart entry with a count; hidden while the cart is empty. */
export function CartButton({ s }: { s: ServicesPalette }) {
  const router = useRouter();
  const n = useAppCart(cartCount);
  if (!n) return null;
  return (
    <PressableScale
      onPress={() => router.push('/cart')}
      hitSlop={8}
      accessibilityLabel={`Cart, ${n} item${n === 1 ? '' : 's'}`}
      style={[st.btn, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Ionicons name="bag-handle-outline" size={18} color={s.text} />
      <View style={[st.badge, { backgroundColor: s.orange }]}>
        <Text style={[st.count, { color: s.onOrange }]}>{n}</Text>
      </View>
    </PressableScale>
  );
}

const st = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontFamily: F.sans700, fontSize: 10 },
});
