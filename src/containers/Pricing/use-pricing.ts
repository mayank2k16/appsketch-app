import * as React from 'react';

import {
  type SubscriptionPlan,
  useSubscriptionPlans,
} from '@/api/subscription-plans';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import {
  appleProductId,
  ensureProducts,
  isIos,
  type PlanInterval,
  type StoreStatus,
  useIapStore,
} from '@/lib/iap';

import {
  creditsLabel,
  featureLabels,
  modelName,
  option,
  orderPlans,
  perMonth,
  shortName,
} from './plan-format';

export type PlanView = {
  tier: string;
  name: string;
  description: string;
  features: string[];
  /** Zero-priced tier: shown without a purchase button. */
  free: boolean;
  credits: string | null;
  models: string[];
  /** App Store localized price on iOS, backend price elsewhere; null = not
   *  purchasable right now. */
  price: string | null;
  period: string;
  /** Yearly only: "≈ ₹1,250/month". */
  monthlyEquivalent: string | null;
  sku: string | null;
  current: boolean;
  popular: boolean;
};

type Products = ReturnType<typeof useIapStore.getState>['products'];

function priceNumber(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  if (isIos()) {
    const v = Number(products[appleProductId(plan.tier, cycle)]?.price);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return Number(option(plan, cycle)?.price) || null;
}

/** Best yearly saving vs 12 × monthly, from the prices this platform shows. */
function bestSaving(plans: SubscriptionPlan[], products: Products) {
  let best = 0;
  for (const plan of plans) {
    const m = priceNumber(plan, 'monthly', products);
    const y = priceNumber(plan, 'yearly', products);
    if (m && y) best = Math.max(best, 1 - y / (12 * m));
  }
  return best > 0.01 ? Math.round(best * 100) : 0;
}

function priceFor(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  const yearly = cycle === 'yearly';
  if (isIos()) {
    const sku = appleProductId(plan.tier, cycle);
    const product = products[sku];
    if (!product) return { price: null, sku: null, monthlyEquivalent: null };
    return {
      price: product.displayPrice,
      sku,
      monthlyEquivalent: yearly
        ? perMonth(Number(product.price), product.currency)
        : null,
    };
  }
  const opt = option(plan, cycle);
  if (!opt) return { price: null, sku: null, monthlyEquivalent: null };
  const code = opt.currency?.code ?? 'INR';
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  return {
    price: fmt(Number(opt.price)),
    sku: null,
    monthlyEquivalent: yearly ? perMonth(Number(opt.price), code) : null,
  };
}

function toView(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  return {
    tier: plan.tier,
    name: shortName(plan),
    description: plan.description ?? '',
    features: featureLabels(plan),
    free: ['monthly', 'yearly'].every((i) => !Number(option(plan, i)?.price)),
    credits: creditsLabel(plan),
    models: (plan.coder_models ?? []).map(modelName),
    ...priceFor(plan, cycle, products),
    period: cycle === 'monthly' ? '/month' : '/year',
  };
}

/** Every live plan that has a monthly or yearly price, in the website's tier
 *  order, priced from StoreKit on iOS. */
export function usePricing(cycle: PlanInterval) {
  const query = useSubscriptionPlans();
  const products = useIapStore((s) => s.products);
  const storeStatus: StoreStatus = useIapStore((s) => s.status);
  const sub = getUserSubscription(useAuth.use.user());
  const currentTier = sub?.active ? sub.plan?.tier?.toLowerCase() : undefined;

  const plans = React.useMemo(
    () =>
      orderPlans(
        (query.data ?? []).filter(
          (p) => option(p, 'monthly') || option(p, 'yearly')
        )
      ),
    [query.data]
  );

  React.useEffect(() => {
    if (!isIos() || !plans.length) return;
    void ensureProducts(
      plans.flatMap((p) => [
        appleProductId(p.tier, 'monthly'),
        appleProductId(p.tier, 'yearly'),
      ])
    );
  }, [plans]);

  const views: PlanView[] = React.useMemo(() => {
    const hasGrowth = plans.some((p) => p.tier.toLowerCase() === 'growth');
    return plans.map((plan, i) => ({
      ...toView(plan, cycle, products),
      current: !!currentTier && plan.tier.toLowerCase() === currentTier,
      popular: hasGrowth
        ? plan.tier.toLowerCase() === 'growth'
        : i === Math.floor(plans.length / 2),
    }));
  }, [plans, cycle, products, currentTier]);

  return {
    views,
    saving: bestSaving(plans, products),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    storeStatus,
    activePlanName: sub?.active
      ? sub.plan?.display_name || sub.plan?.tier
      : null,
  };
}
