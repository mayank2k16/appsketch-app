import { accountClient } from '@/api/common/client';

import type { SubscriptionPlan, SubscriptionPlansResponse } from './types';

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await accountClient.get<SubscriptionPlansResponse>('account/subscription-plans/');
  return data.results ?? [];
}
