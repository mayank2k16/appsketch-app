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
  reloadProducts,
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
  /** Yearly only: the monthly plan's price, struck through ("₹1,499"). */
  compareAt: string | null;
  /** Yearly only: whole-percent saving vs 12 × monthly. */
  savePct: number | null;
  /** Yearly only: rupees (or the store currency) saved a year, formatted. */
  saveAmount: string | null;
  current: boolean;
  popular: boolean;
};

type Products = ReturnType<typeof useIapStore.getState>['products'];

/** The plans API's amount in its `currency` (`display_price`; `price` is
 *  always INR — "$1,499" was the bug). */
function amountOf(
  opt: { price: number | string; display_price?: string } | null
): number {
  if (!opt) return 0;
  return Number(opt.display_price ?? opt.price) || 0;
}

function priceNumber(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  if (isIos()) {
    const v = Number(products[appleProductId(plan.tier, cycle)]?.price);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return amountOf(option(plan, cycle)) || null;
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
    // Not in the App Store right now: still show the plan's price to
    // compare; Subscribe stays off (no sku).
    if (!product) return { ...backendPrice(plan, cycle), sku: null };
    return {
      price: product.displayPrice,
      sku,
      monthlyEquivalent: yearly
        ? perMonth(Number(product.price), product.currency)
        : null,
    };
  }
  return { ...backendPrice(plan, cycle), sku: null };
}

function backendPrice(plan: SubscriptionPlan, cycle: PlanInterval) {
  const yearly = cycle === 'yearly';
  const opt = option(plan, cycle);
  if (!opt) return { price: null, monthlyEquivalent: null };
  const code = opt.currency?.code ?? 'INR';
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(n);
  return {
    price: fmt(amountOf(opt)),
    monthlyEquivalent: yearly ? perMonth(amountOf(opt), code) : null,
  };
}

function currencyOf(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
): string {
  if (isIos()) {
    const c = products[appleProductId(plan.tier, cycle)]?.currency;
    if (c) return c;
  }
  return option(plan, cycle)?.currency?.code ?? 'INR';
}

/** Yearly: the monthly price to strike through, and the saving. */
function compare(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  const none = { compareAt: null, savePct: null, saveAmount: null };
  if (cycle !== 'yearly') return none;
  // Both prices from the same source (StoreKit or the plans API).
  const fromStore =
    isIos() &&
    !!products[appleProductId(plan.tier, 'yearly')] &&
    !!products[appleProductId(plan.tier, 'monthly')];
  const num = (c: PlanInterval) =>
    fromStore
      ? Number(products[appleProductId(plan.tier, c)]?.price)
      : amountOf(option(plan, c));
  const m = num('monthly');
  const y = num('yearly');
  if (!(m > 0) || !(y > 0) || y / 12 >= m) return none;
  const code = currencyOf(plan, 'monthly', fromStore ? products : {});
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: n >= 100 ? 0 : 2,
      }).format(n);
    } catch {
      return null;
    }
  };
  return {
    compareAt: fmt(m),
    savePct: Math.round((1 - y / (12 * m)) * 100),
    saveAmount: fmt(12 * m - y),
  };
}

function toView(
  plan: SubscriptionPlan,
  cycle: PlanInterval,
  products: Products
) {
  return {
    ...compare(plan, cycle, products),
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
  const storeDetail = useIapStore((s) => s.detail);
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

  // The tab opening is a natural moment to ask StoreKit again.
  React.useEffect(() => {
    if (isIos() && useIapStore.getState().status === 'unavailable')
      void reloadProducts();
  }, []);

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
    storeDetail,
    activePlanName: sub?.active
      ? sub.plan?.display_name || sub.plan?.tier
      : null,
  };
}
