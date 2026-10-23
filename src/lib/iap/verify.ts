/**
 * Server-side confirmation of a StoreKit 2 transaction. Every purchase update
 * and every restored purchase goes through `verifyAndFinish`; the
 * transaction is finished ONLY once the backend gave a definitive answer
 * (200, 400 invalid, 409 other account). Anything else — offline, 5xx, the
 * endpoint not deployed yet, an expired session — leaves it unfinished so
 * StoreKit hands it back on the next launch (see `reconcilePending`).
 */
import type { Purchase } from 'expo-iap';
import { finishTransaction } from 'expo-iap';

import {
  type AppleIapConfig,
  type AppleVerifyResponse,
  fetchAppleIapConfig,
  verifyAppleTransaction,
} from '@/api/apple-iap';
import { updateSubscription, useAuth } from '@/hooks/useAuth';

export type VerifyOutcome =
  | { kind: 'activated'; planName: string }
  | { kind: 'expired' }
  | { kind: 'rejected'; message: string }
  | { kind: 'retry' }
  | { kind: 'skipped' };

let configCache: { userKey: string; config: AppleIapConfig } | null = null;

function userKey(): string {
  const u = useAuth.getState().user as { id?: number | string } | null;
  return String(u?.id ?? useAuth.getState().token?.access ?? '');
}

/** The per-account `appAccountToken` (and product↔plan map). Cached per
 *  signed-in user. Throws when the backend cannot provide it. */
export async function getAppleConfig(): Promise<AppleIapConfig> {
  const key = userKey();
  if (configCache?.userKey === key) return configCache.config;
  const config = await fetchAppleIapConfig();
  configCache = { userKey: key, config };
  return config;
}

function applyPlan(data: AppleVerifyResponse): string {
  const plan = data.plan;
  const name = plan?.display_name || plan?.tier || 'your plan';
  if (plan) {
    updateSubscription({
      active: plan.is_active ?? true,
      plan: { tier: plan.tier, display_name: plan.display_name },
    });
  }
  return name;
}

async function finish(purchase: Purchase) {
  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Already finished, or StoreKit lost it — nothing to do; the server
    // already holds the outcome.
  }
}

/** `purchase.purchaseToken` is the StoreKit 2 JWS (signed transaction) on
 *  iOS — expo-iap's "unified purchase token". */
export async function verifyAndFinish(
  purchase: Purchase
): Promise<VerifyOutcome> {
  const jws = purchase.purchaseToken;
  if (!jws || purchase.purchaseState === 'pending') return { kind: 'skipped' };
  if (useAuth.getState().status !== 'signIn') return { kind: 'retry' };
  let res: Awaited<ReturnType<typeof verifyAppleTransaction>>;
  try {
    res = await verifyAppleTransaction(jws);
  } catch {
    return { kind: 'retry' };
  }
  const { status, data } = res;
  if (status === 200 && data.success) {
    await finish(purchase);
    return { kind: 'activated', planName: applyPlan(data) };
  }
  if (status === 200 && data.expired) {
    await finish(purchase);
    return { kind: 'expired' };
  }
  if (status === 400 || status === 409) {
    await finish(purchase);
    return {
      kind: 'rejected',
      message:
        data.message ||
        (status === 409
          ? 'This App Store subscription belongs to another AppSketch account.'
          : 'This purchase could not be verified.'),
    };
  }
  return { kind: 'retry' };
}
