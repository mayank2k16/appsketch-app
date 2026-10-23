import { accountClient } from '@/api/common/client';

import type {
  CartOrder,
  Catalogue,
  CheckoutBody,
  CheckoutResponse,
  ConfirmBody,
} from './types';

const BASE = 'account/app-cart/';

/** appsketch.ai answers unknown /api paths with its HTML shell (200). */
function expect<T>(ok: boolean, data: T): T {
  if (!ok) throw new Error('Unexpected response from the server');
  return data;
}

export async function fetchCatalogue(): Promise<Catalogue> {
  const { data } = await accountClient.get<Catalogue>(`${BASE}catalogue/`);
  return expect(Array.isArray(data?.builds) && Array.isArray(data?.extras), {
    ...data,
    included: data.included ?? [],
  });
}

export async function checkout(body: CheckoutBody): Promise<CheckoutResponse> {
  const { data } = await accountClient.post<CheckoutResponse>(
    `${BASE}checkout/`,
    body,
    { timeout: 30000 }
  );
  return expect(!!data?.razorpay?.order_id, data);
}

export async function confirmPayment(body: ConfirmBody): Promise<CartOrder> {
  const { data } = await accountClient.post<{ order: CartOrder }>(
    `${BASE}confirm/`,
    body,
    { timeout: 30000 }
  );
  return expect(!!data?.order, data).order;
}

export async function fetchOrder(id: number | string): Promise<CartOrder> {
  const { data } = await accountClient.get<{ order: CartOrder }>(
    `${BASE}orders/${id}/`
  );
  return expect(!!data?.order, data).order;
}
