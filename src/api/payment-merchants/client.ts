import { accountClient } from '@/api/common/client';

import type { AddPaymentMerchantPayload, MerchantsResponse, PaymentMerchant } from './types';

export async function fetchMerchants(): Promise<PaymentMerchant[]> {
  const { data } = await accountClient.get<MerchantsResponse>('account/sub-merchants/');
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function addPaymentMerchant(payload: AddPaymentMerchantPayload): Promise<unknown> {
  const { data } = await accountClient.post('account/onboard-sub-merchant/create_account/', payload);
  return data;
}
