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

export const APPLE_PRODUCT_IDS: string[] = APPLE_PLAN_TIERS.flatMap((tier) => [
  appleProductId(tier, 'monthly'),
  appleProductId(tier, 'yearly'),
]);

export function isAppleProductId(id: string | null | undefined): boolean {
  return !!id && id.startsWith(PREFIX);
}
