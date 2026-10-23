/**
 * Pure helpers that turn the live plans API (GET account/subscription-plans/)
 * into what a plan card shows. Wording follows appsketch.ai/pricing: the
 * tier's short name ("Basic", not "Basic Plan"), its description, and the
 * plan's enabled features in API order.
 */
import type {
  SubscriptionPlan,
  SubscriptionPricingOption,
} from '@/api/subscription-plans';

/** The website's tier order; unknown tiers go last, cheapest first. */
const TIER_ORDER = [
  'free',
  'pro',
  'spark',
  'basic',
  'growth',
  '100x',
  'assistive',
  'enterprise',
];

export function orderPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  const rank = (p: SubscriptionPlan) => {
    const i = TIER_ORDER.indexOf(p.tier.toLowerCase());
    return i === -1 ? TIER_ORDER.length : i;
  };
  const price = (p: SubscriptionPlan) =>
    Number(p.pricing_options.find((o) => o.interval === 'monthly')?.price) || 0;
  return [...plans].sort((a, b) => rank(a) - rank(b) || price(a) - price(b));
}

export function option(
  plan: SubscriptionPlan,
  interval: string
): SubscriptionPricingOption | null {
  return plan.pricing_options?.find((o) => o.interval === interval) ?? null;
}

/** "Basic Plan" → "Basic" (the website's card title). */
export function shortName(plan: SubscriptionPlan): string {
  const name = (plan.display_name || plan.tier).trim();
  return name.replace(/\s+plan$/i, '') || plan.tier;
}

/** Enabled features, API order, with "Name: limit" when a limit is set.
 *  Disabled rows in the API are retired feature codes (the website does not
 *  list them either), so they are not shown. */
export function featureLabels(plan: SubscriptionPlan): string[] {
  return (plan.plan_features ?? [])
    .filter((f) => f.enabled)
    .map((f) =>
      f.integer_limit != null
        ? `${f.feature.display_name}: ${f.integer_limit}`
        : f.feature.display_name
    );
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** monthly_token_grant: 0 = unlimited, null/absent = not shown. */
export function creditsLabel(plan: SubscriptionPlan): string | null {
  const g = plan.monthly_token_grant;
  if (g == null) return null;
  return g === 0
    ? 'Unlimited build credits'
    : `${compact(g)} build credits / month`;
}

/** "nvidia/nemotron-3-ultra-550b-a55b" → "Nemotron 3 Ultra"; "gpt-4.1-mini" → "GPT-4.1 mini". */
export function modelName(id: string): string {
  const base = id.split('/').pop() ?? id;
  if (/^gpt-/i.test(base))
    return base
      .replace(/^gpt-([^-]+)/i, 'GPT#$1')
      .replace(/-/g, ' ')
      .replace('GPT#', 'GPT-');
  return base
    .split('-')
    .filter((w) => !/^\d+b$|^a\d+b$/i.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Per-month equivalent of a yearly price, in the product's currency. */
export function perMonth(
  yearly: number,
  currency: string | undefined
): string | null {
  if (!yearly || !currency) return null;
  const m = yearly / 12;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: m >= 100 ? 0 : 2,
    }).format(m);
  } catch {
    return null;
  }
}
