/**
 * App Store (StoreKit 2) subscriptions — the backend half of the iOS Pricing
 * tab. See docs/pricing-and-apple.md for the full contract.
 */
import type { SubscriptionBillingInterval } from '@/api/subscription-plans/types';

export type AppleProductMapping = {
  product_id: string;
  tier: string;
  interval: SubscriptionBillingInterval;
  pricing_option_id: number;
};

/** GET account/payment/apple/config/ */
export type AppleIapConfig = {
  /** UUID bound to this AppSketch account; sent to StoreKit as
   *  `appAccountToken` so every transaction names the account it belongs to. */
  app_account_token: string;
  products: AppleProductMapping[];
};

export type AppleVerifiedPlan = {
  tier: string;
  display_name: string;
  interval: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  days_remaining: number | null;
};

/** POST account/payment/apple/verify/ — 200 success, 200 expired (restore of
 *  a lapsed subscription), 409 (belongs to another account), 400 invalid. */
export type AppleVerifyResponse = {
  success: boolean;
  expired?: boolean;
  message?: string;
  plan?: AppleVerifiedPlan;
  quota?: Record<string, unknown>;
};
