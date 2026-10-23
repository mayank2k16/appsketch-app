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
  /** One code per order; it applies to the builds, the domain or the whole
   *  order (its `applies_to`). The response `lines` then carry a negative
   *  line, e.g. `{"label": "BUILD20 · 20% off team builds", "amount_inr":
   *  -3000}`, and `total_inr` is after the discount. */
  discount_code?: string | null;
};

/** 400 `code` whenever the cart has a domain (code or not) and the user has
 *  no active paid plan: a domain comes with a plan (App Store in-app). Any
 *  other 400 `code` on checkout with a `discount_code` is the code's reason
 *  (expired, used_up, already_used…). A total under ₹1 is also a 400. */
export const PLAN_REQUIRED = 'plan_required';

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

/** The code applied to an order; its negative line is also in `lines`. */
export type OrderDiscount = {
  code: string;
  amount_inr: number;
  applies_to?: 'build' | 'domain' | 'order';
};

export type CheckoutResponse = {
  order_id: number;
  total_inr: number;
  lines: OrderLine[];
  discount?: OrderDiscount | null;
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
  discount?: OrderDiscount | null;
  domain_id: number | null;
  error: string | null;
  created_at: string;
};
