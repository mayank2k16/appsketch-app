/**
 * api/payments/payment-api.ts
 *
 * All payment HTTP calls in one file.
 * Import these in CartScreen — never call authenticatedClient directly from UI.
 */

import { authenticatedClient } from '@/api/common/client';
import type { CheckoutV2Response } from '@/lib/payments/payment-gateway';

// ── Payload types ──────────────────────────────────────────────────────────────

export type OrderItem = {
  product:  number;
  quantity: number;
};

export type CheckoutV2Payload = {
  address:           string;
  mode_of_payment:   'online' | 'cash_on_delivery';
  order_list:        OrderItem[];
  shipping_country:  string;
  shipping_state:    string;
  shipping_zipcode:  string;
};

export type PaymentSuccessPayload = {
  order_id:             number;
  // Razorpay — include all three or none
  razorpay_order_id?:   string;
  razorpay_payment_id?: string;
  razorpay_signature?:  string;
  // PayU equivalent (extend when needed)
  payu_mihpayid?:       string;
  payu_txnid?:          string;
};

// ── API calls ──────────────────────────────────────────────────────────────────

/**
 * Step 1: Initiate checkout — returns gateway credentials.
 * cartId comes from useCart().cartId
 */
export async function initiateCheckoutV2(
  cartId:       number | string,
  deliveryType: string,
  payload:      CheckoutV2Payload,
): Promise<CheckoutV2Response> {
  const res = await authenticatedClient.post(
    `api/payments/checkoutV2/${cartId}/${deliveryType}/`,
    payload,
  );
  return res.data;
}

/**
 * Step 2: Confirm payment success on backend.
 * Call this after the gateway SDK confirms payment on the client side.
 */
export async function confirmPaymentSuccess(
  payload: PaymentSuccessPayload,
): Promise<void> {
  await authenticatedClient.post('api/payments/success/', payload);
}