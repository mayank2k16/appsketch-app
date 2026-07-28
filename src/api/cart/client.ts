import { authenticatedClient } from '@/api/common/client';

import type { AbandonedCartItem, CheckoutOrderItem } from './types';

// Vite's own screens only ever guard these two with `Array.isArray(data) ?
// data : []` — no `{results:[...]}` fallback attempted here (unlike most
// other CMS list endpoints) — so ported as-is, not over-defended.

export async function fetchAbandonedCarts(): Promise<AbandonedCartItem[]> {
  const { data } = await authenticatedClient.get<AbandonedCartItem[]>('api/shop/carts/abandoned/');
  return Array.isArray(data) ? data : [];
}

export async function discardCart(cartId: number): Promise<void> {
  await authenticatedClient.post(`api/shop/carts/${cartId}/discard/`);
}

export async function fetchCheckoutOrders(): Promise<CheckoutOrderItem[]> {
  const { data } = await authenticatedClient.get<CheckoutOrderItem[]>('api/shop/orders/checkout/');
  return Array.isArray(data) ? data : [];
}
