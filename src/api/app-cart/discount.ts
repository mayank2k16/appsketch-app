/**
 * Platform discount codes — `POST account/discounts/validate/`
 * (docs/domains.md). Codes are created by the owner in Django admin; for
 * now they apply to the domain in the cart (e.g. DOMAIN50 = 50% off, up to
 * ₹500). Not the CMS store discounts in `src/api/discounts`.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { accountClient } from '@/api/common/client';

export type ValidateDiscountBody = {
  code: string;
  domain_price_inr: number;
  has_plan_in_order: boolean;
};

export type DiscountValidation = {
  valid: boolean;
  code: string;
  discount_inr: number;
  message: string;
  percent?: number;
  max_discount_inr?: number | null;
  applies_to?: 'domain' | 'plan' | 'order';
  /** Invalid only: unknown | inactive | not_started | expired | used_up |
   *  already_used | plan_required | no_domain | not_supported. */
  reason?: string;
};

/** AllowAny; the platform JWT is sent when signed in so per-user limits
 *  ("already used by you") are checked too. An invalid code is a 200 with
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
  return {
    ...data,
    code: data.code || body.code,
    discount_inr: data.valid ? data.discount_inr || 0 : 0,
  };
}

export const DISCOUNT_KEY = ['app-cart', 'discount'] as const;

/** Re-validates whenever the code, the domain price (years) or the plan
 *  situation changes. Disabled without a code or a priced domain. */
export function useDiscountValidation(body: ValidateDiscountBody | null) {
  return useQuery({
    queryKey: [
      ...DISCOUNT_KEY,
      body?.code.toUpperCase(),
      body?.domain_price_inr,
      body?.has_plan_in_order,
    ],
    queryFn: () => validateDiscount(body as ValidateDiscountBody),
    enabled: !!body?.code && (body?.domain_price_inr ?? 0) > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: 1,
  });
}
