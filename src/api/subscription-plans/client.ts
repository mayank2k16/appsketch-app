import { accountClient } from '@/api/common/client';
import type { AppCurrency } from '@/lib/geo-currency';

import type { SubscriptionPlan, SubscriptionPlansResponse } from './types';

/** `display_price` comes back in `currency`; `price` is always INR. */
export async function fetchSubscriptionPlans(
  currency: AppCurrency
): Promise<SubscriptionPlan[]> {
  const { data } = await accountClient.get<SubscriptionPlansResponse>(
    'account/subscription-plans/',
    { params: { currency } }
  );
  return data.results ?? [];
}
