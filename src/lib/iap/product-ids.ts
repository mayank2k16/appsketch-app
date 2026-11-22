/**
 * App Store product ids for the AppSketch plans. Fixed convention, shared
 * with the backend (`account/payment/apple/config/`) and App Store Connect:
 *
 *   ai.appsketch.plan.<tier lowercased>.<monthly|yearly>
 *
 * All six live in ONE subscription group, so moving between them is an
 * upgrade/downgrade/crossgrade that StoreKit handles (never two at once).
 */
export type PlanInterval = 'monthly' | 'yearly';

const PREFIX = 'ai.appsketch.plan.';

/** Tiers prefetched at launch. The Pricing tab also asks StoreKit for the
 *  ids of whatever tiers the live plans API returns (`ensureProducts`). */
export const APPLE_PLAN_TIERS = ['basic', 'growth', '100x'] as const;

export function appleProductId(tier: string, interval: PlanInterval): string {
  return `${PREFIX}${tier.toLowerCase()}.${interval}`;
}

/**
 * Tiers sold MONTHLY ONLY in the app. 100X yearly (₹1,99,999) is above the
 * App Store's and Google Play's highest price point (₹1,00,000), so it is not
 * a store product: with Yearly picked, the app shows and sells 100X monthly.
 */
export const MONTHLY_ONLY_TIERS = new Set(['100x']);

export const isMonthlyOnly = (tier: string) =>
  MONTHLY_ONLY_TIERS.has(tier.toLowerCase());

/** The interval the app actually sells for this tier and picked cycle. */
export const storeInterval = (
  tier: string,
  cycle: PlanInterval
): PlanInterval =>
  cycle === 'yearly' && isMonthlyOnly(tier) ? 'monthly' : cycle;

export const APPLE_PRODUCT_IDS: string[] = APPLE_PLAN_TIERS.flatMap((tier) =>
  isMonthlyOnly(tier)
    ? [appleProductId(tier, 'monthly')]
    : [appleProductId(tier, 'monthly'), appleProductId(tier, 'yearly')]
);

export function isAppleProductId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(PREFIX);
}
