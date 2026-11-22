import type { AppleVerifyResponse } from '@/api/apple-iap';

/** `GET account/payment/google/config/` (backend account/google_play.py). */
export type GooglePlayConfig = {
  /** Passed to Play as obfuscatedAccountIdAndroid: binds a purchase to this
   *  AppSketch account (the same uuid the App Store gets). */
  obfuscated_account_id: string;
  products: {
    /** `ai.appsketch.plan.<tier>` — one Play subscription per plan. */
    product_id: string;
    tier: string;
    base_plans: { base_plan_id: string; pricing_option_id: number }[];
  }[];
};

/** Same shape as the App Store's verify answer. */
export type GooglePlayVerifyResponse = AppleVerifyResponse;
