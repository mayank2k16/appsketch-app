/**
 * Team-built apps, extras and domains — the `account/app-cart/*` contract
 * (docs/domains.md). Real-world services paid with Razorpay; platform plans
 * are never sold here (they are App Store subscriptions).
 */
import type { RegistrantContact } from '@/api/app-domains';

export type CatalogueItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  price_inr: number;
  features: string[];
};

export type Catalogue = {
  builds: CatalogueItem[];
  extras: CatalogueItem[];
  included: string[];
  whatsapp: string;
};

export type CheckoutDomain = {
  name: string;
  years: number;
  tenant_id: number | string | null;
  contacts: { registrant: RegistrantContact };
};

export type CheckoutBody = {
  addon_ids: number[];
  domain: CheckoutDomain | null;
};

export type OrderLine = { label: string; amount_inr: number };

export type RazorpayBlock = {
  key_id: string;
  order_id: string;
  amount_paise: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
};

export type CheckoutResponse = {
  order_id: number;
  total_inr: number;
  lines: OrderLine[];
  razorpay: RazorpayBlock;
};

export type ConfirmBody = {
  order_id: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilling'
  | 'fulfilled'
  | 'failed';

export type CartOrder = {
  id: number;
  status: OrderStatus;
  total_inr: number;
  lines: OrderLine[];
  domain_id: number | null;
  error: string | null;
  created_at: string;
};
