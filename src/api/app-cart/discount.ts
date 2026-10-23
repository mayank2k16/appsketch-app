/**
 * Platform discount codes — `account/discounts/*` (docs/domains.md). Codes
 * are made by the team in the Sales CRM (Discounts) and apply to a build
 * (team builds + extras), the domain or the whole order. Some are public
 * offers, some are assigned to one user ("Your offer"), the rest only work
 * when typed. Plan codes never apply in the app (plans are Apple IAP).
 * Not the CMS store discounts in `src/api/discounts`.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { accountClient } from '@/api/common/client';
import { useAuth } from '@/hooks/useAuth';

/** What a code discounts. `plan` is web-only and ignored in the app. */
export type DiscountTarget = 'build' | 'domain' | 'order' | 'plan';

export type ValidateDiscountBody = {
  code: string;
  channel: 'app';
  addon_ids: number[];
  /** Omitted without a domain in the cart. */
  domain?: { name: string; years: number };
  /** Display fallback only; the server prices the domain itself. */
  domain_price_inr?: number;
  /** True in the app: a domain is only paid once the plan step is done. */
  has_plan_in_order: boolean;
};

export type DiscountValidation = {
  valid: boolean;
  code: string;
  discount_inr: number;
  message: string;
  percent?: number;
  max_discount_inr?: number | null;
  applies_to?: DiscountTarget;
  /** Invalid only: unknown | inactive | not_started | expired | used_up |
   *  already_used | not_assigned | plan_required | no_domain |
   *  nothing_to_discount | below_minimum | wrong_channel | wrong_cycle. */
  reason?: string;
};

/** A code listed in checkout: public, or assigned to the signed-in user. */
export type DiscountOffer = {
  code: string;
  title: string;
  description: string;
  applies_to: DiscountTarget;
  type: 'percent' | 'amount';
  value: number;
  max_discount_inr: number | null;
  min_amount_inr: number | null;
  ends_at: string | null;
  /** Assigned to this user ("Your offer"). */
  assigned: boolean;
};

/** AllowAny; the platform JWT is sent when signed in so per-user limits
 *  and assigned codes are checked too. An invalid code is a 200 with
 *  `valid: false` and the server's reason in `message`. */
export async function validateDiscount(
  body: ValidateDiscountBody
): Promise<DiscountValidation> {
  const { data } = await accountClient.post<DiscountValidation>(
    'account/discounts/validate/',
    body
  );
  // appsketch.ai answers unknown /api paths with its HTML shell (200).
  if (typeof data?.valid !== 'boolean')
    throw new Error('Unexpected response from the server');
  const plan = data.applies_to === 'plan';
  return {
    ...data,
    code: data.code || body.code,
    // The server never accepts plan codes with channel=app; belt and braces.
    valid: data.valid && !plan,
    message: plan
      ? 'This code is for plans on appsketch.ai.'
      : data.message || '',
    discount_inr: data.valid && !plan ? data.discount_inr || 0 : 0,
  };
}

/** Listed offers for the app channel; plan codes are dropped here too. */
export async function fetchOffers(): Promise<DiscountOffer[]> {
  const { data } = await accountClient.get<{ offers: DiscountOffer[] }>(
    'account/discounts/offers/',
    { params: { channel: 'app' } }
  );
  if (!Array.isArray(data?.offers))
    throw new Error('Unexpected response from the server');
  return data.offers.filter(
    (o) => !!o?.code && o.applies_to !== 'plan' && !!o.applies_to
  );
}

export const DISCOUNT_KEY = ['app-cart', 'discount'] as const;
export const OFFERS_KEY = ['app-cart', 'offers'] as const;

/** Re-validates whenever the code or anything in the cart changes
 *  (builds, extras, domain, years) and on sign-in. Disabled without a code
 *  or an empty cart. */
export function useDiscountValidation(body: ValidateDiscountBody | null) {
  const user = useAuth.use.user()?.id ?? null;
  return useQuery({
    queryKey: [
      ...DISCOUNT_KEY,
      body?.code.toUpperCase(),
      [...(body?.addon_ids ?? [])].sort((a, b) => a - b).join(','),
      body?.domain?.name ?? null,
      body?.domain?.years ?? null,
      body?.domain_price_inr ?? null,
      user,
    ],
    queryFn: () => validateDiscount(body as ValidateDiscountBody),
    enabled: !!body?.code && (!!body.addon_ids.length || !!body.domain),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Offers for this user (refetched on sign-in / sign-out). Errors are
 *  silent: the row simply hides. */
export function useDiscountOffers() {
  const user = useAuth.use.user()?.id ?? null;
  return useQuery({
    queryKey: [...OFFERS_KEY, user],
    queryFn: fetchOffers,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

const TARGET: Record<DiscountTarget, string> = {
  build: 'team builds',
  domain: 'your domain',
  order: 'your order',
  plan: 'plans',
};

/** "20% off team builds" / "₹500 off your domain" — the server's title
 *  wins when it sent one. */
export function offerLabel(o: DiscountOffer): string {
  if (o.title?.trim()) return o.title.trim();
  const amt =
    o.type === 'percent'
      ? `${o.value}%`
      : `₹${Math.round(o.value).toLocaleString('en-IN')}`;
  return `${amt} off ${TARGET[o.applies_to] ?? 'your order'}`;
}
