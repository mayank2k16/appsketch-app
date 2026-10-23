import {
  type DiscountValidation,
  useCatalogue,
  useDiscountValidation,
} from '@/api/app-cart';
import type { UserSubscription } from '@/api/auth/types';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { useAppCart } from '@/lib/store/app-cart-store';

/** Tiers the server counts as a paid plan (the free trial does not). */
const PAID_TIERS = [
  'spark',
  'basic',
  'growth',
  '100x',
  'assistive',
  'enterprise',
];

/** An active paid plan from any source (App Store, Razorpay, Stripe — the
 *  server's `user.subscription`). The server re-checks at checkout and
 *  answers `plan_required`, which forces the plan step. */
export function hasPaidPlan(sub: UserSubscription | null): boolean {
  const tier = sub?.plan?.tier?.toLowerCase();
  return !!sub?.active && !!tier && PAID_TIERS.includes(tier);
}

/** A domain comes with a plan: true while the cart has a domain and the
 *  user has no active paid plan (or checkout said `plan_required`). */
export function useNeedsPlan(): boolean {
  const hasDomain = useAppCart((c) => !!c.domain);
  const forced = useAppCart((c) => c.planRequired);
  const paid = hasPaidPlan(getUserSubscription(useAuth.use.user()));
  return hasDomain && (!paid || forced);
}

/** Builds + extras (live catalogue prices) + the domain, before any code. */
function useSubtotal() {
  const cat = useCatalogue();
  const ids = useAppCart((c) => c.addonIds);
  const domainPrice = useAppCart((c) => c.domain?.price_inr ?? 0);
  const items = [...(cat.data?.builds ?? []), ...(cat.data?.extras ?? [])];
  return {
    cat,
    ids,
    subtotal:
      items
        .filter((x) => ids.includes(x.id))
        .reduce((n, x) => n + x.price_inr, 0) + domainPrice,
  };
}

/**
 * The applied code, validated against the whole cart (builds, extras, the
 * domain and its years) — it re-validates whenever any of them change. In
 * the app a domain is always bought with a plan (the plan step gates Pay),
 * so `has_plan_in_order` is true; checkout re-checks everything
 * server-side. `result` is null until the server answered for THIS code.
 */
export function useCartDiscount() {
  const code = useAppCart((c) => c.discountCode);
  const addonIds = useAppCart((c) => c.addonIds);
  const domain = useAppCart((c) => c.domain);
  const { subtotal } = useSubtotal();
  const active = !!code && (addonIds.length > 0 || !!domain);
  const q = useDiscountValidation(
    active
      ? {
          code,
          channel: 'app',
          addon_ids: addonIds,
          ...(domain
            ? {
                domain: { name: domain.name, years: domain.years },
                domain_price_inr: domain.price_inr,
              }
            : {}),
          has_plan_in_order: true,
        }
      : null
  );
  const result: DiscountValidation | null =
    code && q.data && q.data.code.toUpperCase() === code ? q.data : null;
  return {
    code,
    result,
    checking: active && q.isFetching,
    failed: active && q.isError && !result,
    retry: () => void q.refetch(),
    amount: result?.valid ? Math.min(result.discount_inr, subtotal) : 0,
  };
}

/** Subtotal of builds + extras + domain, minus the validated discount. */
export function useCartTotals() {
  const { cat, ids, subtotal } = useSubtotal();
  const { amount } = useCartDiscount();
  return {
    subtotal,
    discount: amount,
    total: Math.max(0, subtotal - amount),
    ready: !ids.length || !!cat.data,
    hasBuild: (cat.data?.builds ?? []).some((b) => ids.includes(b.id)),
  };
}
