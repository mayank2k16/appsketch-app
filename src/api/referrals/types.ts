/**
 * CMS "Refer & Earn" domain types — ported from Vite's
 * `Containers/Cms/ReferralRules` + `Containers/Cms/Referrals` +
 * `Api/cmsAPI.js` (the `/referrals/admin/...` endpoints). Merged into one
 * mobile tab with 3 sub-tabs (Rules / Referrals / Link Settings) — see the
 * implementation plan for why.
 */

export type ReferralTrigger =
  | 'SIGNUP_VERIFIED'
  | 'FIRST_ORDER_PAID'
  | 'FIRST_ORDER_DELIVERED'
  | 'NTH_ORDER_PAID'
  | 'NTH_ORDER_DELIVERED'
  | 'CUMULATIVE_SPEND_REACHED'
  | 'REFERRER_SIGNUPS_MILESTONE'
  | 'REFERRER_PAID_MILESTONE'
  | 'REFERRER_DELIVERED_MILESTONE'
  | 'REFERRER_SPEND_MILESTONE';

export type ReferralRewardType = 'FLAT' | 'PERCENT' | 'TIERED';

export type ReferralTier = { min: number; max: number; amount: number };

export type ReferralRule = {
  id: number;
  name: string;
  description?: string | null;
  trigger: ReferralTrigger | string;
  referrer_reward_type: ReferralRewardType | string;
  referrer_reward_value: string | number;
  referee_reward_type: ReferralRewardType | string;
  referee_reward_value: string | number;
  min_order_amount: string | number;
  max_bonus_per_referrer: string | number;
  max_referrals_per_user: number;
  pending_expiry_days: number;
  is_active: boolean;
  priority: number;
  valid_from?: string | null;
  valid_to?: string | null;
  clawback_on_refund: boolean;
  tiers?: ReferralTier[] | Record<string, unknown>;
  is_milestone_rule?: boolean;
  referee_order_count_threshold?: number;
  referee_spend_threshold?: string | number;
  referrer_milestone_count?: number;
  referrer_milestone_spend?: string | number;
};

export type ReferralRulePayload = {
  name: string;
  description: string | null;
  trigger: ReferralTrigger | string;
  referrer_reward_type: ReferralRewardType | string;
  referrer_reward_value: string;
  referee_reward_type: ReferralRewardType | string;
  referee_reward_value: string;
  min_order_amount: string;
  max_bonus_per_referrer: string;
  max_referrals_per_user: number;
  pending_expiry_days: number;
  is_active: boolean;
  priority: number;
  valid_from: string | null;
  valid_to: string | null;
  clawback_on_refund: boolean;
  tiers: ReferralTier[] | Record<string, unknown>;
  referee_order_count_threshold: number;
  referee_spend_threshold: string;
  referrer_milestone_count: number;
  referrer_milestone_spend: string;
};

export type ReferralStatus = 'PENDING' | 'QUALIFIED' | 'EXPIRED' | 'REJECTED';

export type ReferralListItem = {
  id: number;
  referrer_id: number;
  referrer_name?: string;
  referrer_phone?: string;
  referee_id: number;
  referee_name?: string;
  referee_phone?: string;
  status: ReferralStatus | string;
  trigger_event?: string;
  referrer_bonus_amount: string | number;
  referee_bonus_amount: string | number;
  qualified_at?: string | null;
  created_on: string;
};

export type ReferralsListParams = {
  limit?: number;
  cursor?: string | number | null;
  status?: ReferralStatus | 'ALL';
};

export type ReferralsListResponse = {
  data: ReferralListItem[];
  next_cursor: string | number | null;
};

export type ReferralAnalyticsTotals = {
  total: number;
  qualified: number;
  pending: number;
  expired: number;
  rejected: number;
  conversion_pct?: number;
  referrer_payout: string | number;
  referee_payout: string | number;
};

export type TopReferrer = {
  referrer_id: number;
  qualified_count: number;
  earned: string | number;
};

export type ReferralLinkPlatformClicks = { platform: string; count: number };
export type TopReferrerByClicks = { referrer_id: number; clicks: number };

export type ReferralLinkAnalytics = {
  total_clicks?: number;
  by_platform?: ReferralLinkPlatformClicks[];
  top_referrers_by_clicks?: TopReferrerByClicks[];
};

export type ReferralAnalytics = {
  totals: ReferralAnalyticsTotals;
  top_referrers?: TopReferrer[];
  links?: ReferralLinkAnalytics;
};

export type ReferralLinkConfig = {
  universal_domain: string;
  web_signup_path: string;
  app_scheme: string;
  ios_store_url: string;
  android_store_url: string;
  ios_app_id: string;
  android_package: string;
  android_sha256_fingerprints: string[];
  share_message_template: string;
  landing_bg_color: string;
  is_active: boolean;
};

export type UpdateReferralLinkConfigPayload = Omit<ReferralLinkConfig, 'android_sha256_fingerprints'> & {
  android_sha256_fingerprints: string[];
};
