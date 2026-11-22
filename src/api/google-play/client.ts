import { accountClient } from '@/api/common/client';

import type { GooglePlayConfig, GooglePlayVerifyResponse } from './types';

export async function fetchGooglePlayConfig(): Promise<GooglePlayConfig> {
  const { data } = await accountClient.get<GooglePlayConfig>(
    'account/payment/google/config/'
  );
  return data;
}

/** The server reads the token's state from Google itself and acknowledges
 *  the purchase once the plan is on the account. Non-2xx answers still carry
 *  `{success, message}`; 5xx/offline throw (the caller retries later). */
export async function verifyGooglePlayPurchase(
  purchaseToken: string,
  packageName?: string | null
): Promise<{ status: number; data: GooglePlayVerifyResponse }> {
  const res = await accountClient.post<GooglePlayVerifyResponse>(
    'account/payment/google/verify/',
    { purchase_token: purchaseToken, package_name: packageName || undefined },
    { validateStatus: (s) => s < 500 }
  );
  return { status: res.status, data: res.data ?? { success: false } };
}
