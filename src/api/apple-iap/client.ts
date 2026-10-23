import { accountClient } from '@/api/common/client';

import type { AppleIapConfig, AppleVerifyResponse } from './types';

export async function fetchAppleIapConfig(): Promise<AppleIapConfig> {
  const { data } = await accountClient.get<AppleIapConfig>(
    'account/payment/apple/config/'
  );
  return data;
}

/** `signed_transaction` is StoreKit 2's JWS (`purchase.purchaseToken` in
 *  expo-iap on iOS). Non-2xx responses still carry a `{success, message}`
 *  body, so they resolve with `status` instead of throwing — the caller
 *  decides whether the outcome is definitive (finish the transaction) or
 *  transient (leave it for StoreKit to redeliver). */
export async function verifyAppleTransaction(
  signedTransaction: string
): Promise<{ status: number; data: AppleVerifyResponse }> {
  const res = await accountClient.post<AppleVerifyResponse>(
    'account/payment/apple/verify/',
    { signed_transaction: signedTransaction },
    { validateStatus: (s) => s < 500 }
  );
  return { status: res.status, data: res.data ?? { success: false } };
}
