/**
 * Shared plan transform/sort logic — originally local to `PricingScreen.tsx`,
 * extracted so `CartScreen` (which needs to re-derive a plan from a `tier`
 * route param, same cache) can use the exact same shaping without
 * duplicating it.
 */
import type { SubscriptionPlan, SubscriptionPlanFeature, SubscriptionPricingOption } from './types';

export type TransformedPlan = {
  tier: string;
  name: string;
  description: string;
  monthly: SubscriptionPricingOption | null;
  yearly: SubscriptionPricingOption | null;
  features: string[];
  buttonText: string;
  isPrimary: boolean;
};

export function extractPricing(options: SubscriptionPricingOption[]) {
  let monthly: SubscriptionPricingOption | null = null;
  let yearly: SubscriptionPricingOption | null = null;
  for (const opt of options) {
    if (opt.interval === 'monthly') monthly = opt;
    else if (opt.interval === 'yearly') yearly = opt;
  }
  return { monthly, yearly };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatFeatures(planFeatures: SubscriptionPlanFeature[]): string[] {
  return (planFeatures || [])
    .filter((pf) => pf.enabled)
    .map((pf) => {
      const displayName = pf.feature.display_name;
      const limit = pf.integer_limit;
      if (limit !== null) {
        return displayName.toLowerCase().includes('data storage')
          ? `${displayName} (${limit} GB)`
          : `${displayName} (${limit})`;
      }
      return displayName;
    });
}

export function planPrice(plan: Pick<TransformedPlan, 'monthly' | 'yearly'>): number {
  const option = plan.monthly ?? plan.yearly;
  return option ? Number(option.price) || 0 : 0;
}

export function isPlanFree(plan: Pick<TransformedPlan, 'monthly' | 'yearly'>): boolean {
  return planPrice(plan) === 0;
}

export function transformPlan(plan: SubscriptionPlan): TransformedPlan {
  const { monthly, yearly } = extractPricing(plan.pricing_options || []);
  const free = isPlanFree({ monthly, yearly });
  return {
    tier: plan.tier,
    name: plan.display_name || '',
    description: plan.description || '',
    monthly,
    yearly,
    features: formatFeatures(plan.plan_features || []),
    buttonText: free ? 'Start Free' : 'Get The Plan Now',
    isPrimary: !free,
  };
}

export function sortPlans(plans: TransformedPlan[]): TransformedPlan[] {
  return [...plans].sort((a, b) => planPrice(a) - planPrice(b));
}

/** Index of the one plan to badge "Most Popular" — the upper-middle tier,
 * since the backend doesn't send a "recommended" flag. None for 0-1 plans. */
export function popularPlanIndex(count: number): number {
  return count <= 1 ? -1 : Math.min(count - 1, Math.floor(count / 2));
}
