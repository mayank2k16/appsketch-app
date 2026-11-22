/**
 * Google Play Billing (expo-iap) for the AppSketch plans — Android only; the
 * Play twin of apple-iap.ts with the same exported names, picked by
 * `store.ts`. Google Play's Payments policy requires in-app subscriptions to
 * go through Play Billing, so Android buys plans here instead of on the web.
 *
 * Play models a plan as ONE subscription (`ai.appsketch.plan.<tier>`) with two
 * base plans (`monthly`, `yearly`). Each base plan is stored in `useIapStore`
 * under the App Store-style key `ai.appsketch.plan.<tier>.<interval>`, so the
 * Pricing tab and the cart look prices up the same way on both platforms.
 *
 * A purchase is only acknowledged by the backend (account/google_play.py)
 * after it put the plan on the account; Google refunds unacknowledged
 * subscriptions after 3 days. Until the server gave a definitive answer the
 * purchase stays unfinished and is retried at the next launch.
 */
import {
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  type ProductSubscription,
  type Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';
import { Linking } from 'react-native';

import {
  fetchGooglePlayConfig,
  type GooglePlayConfig,
  type GooglePlayVerifyResponse,
  verifyGooglePlayPurchase,
} from '@/api/google-play';
import { updateSubscription, useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

import { setIap, useIapStore } from './iap-store';
import {
  APPLE_PLAN_TIERS,
  appleProductId,
  isAppleProductId,
  type PlanInterval,
} from './product-ids';

const PREFIX = 'ai.appsketch.plan.';
const RETRY_MSG =
  "Your payment went through. We'll finish activating your plan automatically — check back in a moment.";
const UNAVAILABLE =
  'Google Play purchases are not available right now. Please try again later.';

/** `ai.appsketch.plan.growth.yearly` → product `ai.appsketch.plan.growth` + base plan `yearly`. */
export function splitSku(sku: string): { productId: string; basePlan: string } {
  const i = sku.lastIndexOf('.');
  return { productId: sku.slice(0, i), basePlan: sku.slice(i + 1) };
}

const isPlanProduct = (id?: string | null) => !!id && id.startsWith(PREFIX);

let connected = false;
let subs: { remove: () => void }[] = [];
const inFlight = new Set<string>();
/** Play product ids to load (one per tier). */
const wanted = new Set<string>(APPLE_PLAN_TIERS.map((t) => `${PREFIX}${t}`));
/** The offer token of each base plan, by App Store-style sku. */
const offerTokens: Record<string, string> = {};

type Outcome =
  | { kind: 'activated'; planName: string }
  | { kind: 'expired' }
  | { kind: 'rejected'; message: string }
  | { kind: 'retry' }
  | { kind: 'skipped' };

function errorText(err: unknown): string {
  const e = err as { code?: unknown; message?: string } | null;
  const msg = e?.message || String(err);
  return e?.code ? `${String(e.code)}: ${msg}` : msg;
}

// ── config (per signed-in account) ──────────────────────────────────────────

let configCache: { key: string; config: GooglePlayConfig } | null = null;

async function getConfig(): Promise<GooglePlayConfig> {
  const u = useAuth.getState().user as { id?: number | string } | null;
  const key = String(u?.id ?? useAuth.getState().token?.access ?? '');
  if (configCache?.key === key) return configCache.config;
  const config = await fetchGooglePlayConfig();
  configCache = { key, config };
  return config;
}

// ── verify + finish ─────────────────────────────────────────────────────────

function applyPlan(data: GooglePlayVerifyResponse): string {
  const plan = data.plan;
  if (plan)
    updateSubscription({
      active: plan.is_active ?? true,
      plan: { tier: plan.tier, display_name: plan.display_name },
    });
  return plan?.display_name || plan?.tier || 'your plan';
}

async function finish(purchase: Purchase) {
  try {
    // The backend acknowledged it already; this marks it done on the device.
    await finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Already acknowledged — nothing to do.
  }
}

async function verifyAndFinish(purchase: Purchase): Promise<Outcome> {
  const token = purchase.purchaseToken;
  if (!token || purchase.purchaseState === 'pending')
    return { kind: 'skipped' };
  if (useAuth.getState().status !== 'signIn') return { kind: 'retry' };
  let res: Awaited<ReturnType<typeof verifyGooglePlayPurchase>>;
  try {
    res = await verifyGooglePlayPurchase(
      token,
      (purchase as { packageNameAndroid?: string | null }).packageNameAndroid
    );
  } catch {
    return { kind: 'retry' };
  }
  const { status, data } = res;
  if (status === 200 && data.success) {
    await finish(purchase);
    return { kind: 'activated', planName: applyPlan(data) };
  }
  if (status === 200 && data.expired) return { kind: 'expired' };
  if (status === 400 || status === 409)
    return {
      kind: 'rejected',
      message:
        data.message ||
        (status === 409
          ? 'This Google Play subscription belongs to another AppSketch account.'
          : 'This purchase could not be verified.'),
    };
  return { kind: 'retry' };
}

function announce(o: Outcome) {
  if (o.kind === 'activated') {
    haptic.success();
    toast.success(`You're on ${o.planName}. Enjoy!`);
  } else if (o.kind === 'rejected') toast.error(o.message);
  else if (o.kind === 'retry') toast.info(RETRY_MSG);
}

async function handlePurchase(p: Purchase, silent: boolean) {
  if (!isPlanProduct(p.productId)) return;
  if (p.purchaseState === 'pending') {
    setIap({ busySku: null });
    if (!silent)
      toast.info(
        'Payment pending — your plan starts as soon as Google Play confirms it.'
      );
    return;
  }
  const key = String(p.purchaseToken ?? p.id);
  if (inFlight.has(key)) return;
  inFlight.add(key);
  try {
    const outcome = await verifyAndFinish(p);
    if (!silent) announce(outcome);
  } finally {
    inFlight.delete(key);
    setIap({ busySku: null });
  }
}

function onPurchaseError(err: { code?: unknown; message?: string } | null) {
  setIap({ busySku: null });
  if (isUserCancelledError(err)) return;
  toast.error(err?.message || 'The purchase could not be completed.');
}

// ── products ────────────────────────────────────────────────────────────────

type Offer = {
  basePlanIdAndroid?: string | null;
  offerTokenAndroid?: string | null;
  displayPrice: string;
  price: number;
  currency?: string | null;
  id?: string | null;
  pricingPhasesAndroid?: { pricingPhaseList?: unknown[] } | null;
};

/** One entry per base plan, keyed `ai.appsketch.plan.<tier>.<interval>`. A
 *  base plan can carry extra offers (trials); the plain base-plan offer (one
 *  pricing phase) is preferred so the price shown is what renews. */
function flatten(list: ProductSubscription[]) {
  const products: Record<string, ProductSubscription> = {};
  for (const product of list) {
    const offers = (
      (product as { subscriptionOffers?: Offer[] }).subscriptionOffers ?? []
    ).filter((o) => o.basePlanIdAndroid && o.offerTokenAndroid);
    const byPlan: Record<string, Offer> = {};
    for (const o of offers) {
      const plan = o.basePlanIdAndroid as string;
      const phases = o.pricingPhasesAndroid?.pricingPhaseList?.length ?? 1;
      const cur = byPlan[plan];
      const curPhases =
        cur?.pricingPhasesAndroid?.pricingPhaseList?.length ?? 1;
      if (!cur || phases < curPhases) byPlan[plan] = o;
    }
    for (const [plan, o] of Object.entries(byPlan)) {
      const sku = `${product.id}.${plan}`;
      offerTokens[sku] = o.offerTokenAndroid as string;
      products[sku] = {
        ...product,
        id: sku,
        displayPrice: o.displayPrice,
        price: o.price,
        currency: o.currency ?? (product as { currency?: string }).currency,
      } as ProductSubscription;
    }
  }
  return products;
}

async function loadProducts() {
  try {
    const list = (await fetchProducts({ skus: [...wanted], type: 'subs' })) as
      | ProductSubscription[]
      | null;
    const products = flatten(list ?? []);
    const found = Object.keys(products).length;
    setIap({
      products,
      status: found ? 'ready' : 'unavailable',
      detail: found ? null : `Google Play returned 0 of ${wanted.size} plans`,
    });
  } catch (err) {
    setIap({ status: 'unavailable', detail: errorText(err) });
  }
}

// ── lifecycle (same names as apple-iap.ts) ──────────────────────────────────

/** Purchases Play still holds unacknowledged (paid, never verified). */
export async function reconcilePending() {
  if (!connected) return;
  try {
    const purchases = await getAvailablePurchases();
    for (const p of purchases ?? []) {
      if (
        (p as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid
      )
        continue;
      await handlePurchase(p as Purchase, true);
    }
  } catch {
    // Best effort; the next launch tries again.
  }
}

export async function connectStore() {
  if (connected) return;
  setIap({ status: 'connecting' });
  try {
    await initConnection();
    connected = true;
  } catch (err) {
    setIap({ status: 'unavailable', detail: errorText(err) });
    return;
  }
  subs = [
    purchaseUpdatedListener(
      (p) => void handlePurchase(p, !useIapStore.getState().busySku)
    ),
    purchaseErrorListener(onPurchaseError),
  ];
  await loadProducts();
  setTimeout(() => void reconcilePending(), 1500);
}

export async function disconnectStore() {
  subs.forEach((s) => s.remove());
  subs = [];
  if (connected) await endConnection().catch(() => false);
  connected = false;
}

/** App Store-style skus of tiers the launch list does not know yet. */
export async function ensureProducts(skus: string[]) {
  const missing = skus
    .filter(isAppleProductId)
    .map((s) => splitSku(s).productId)
    .filter((id) => !wanted.has(id));
  if (!missing.length) return;
  missing.forEach((id) => wanted.add(id));
  if (connected) await loadProducts();
}

export async function reloadProducts() {
  if (!connected) return connectStore();
  setIap({ status: 'connecting' });
  await loadProducts();
}

/** The AppSketch subscription this Google account already has, if any — a
 *  plan change must replace it, not run beside it. */
async function currentPlanPurchase(): Promise<Purchase | null> {
  try {
    const all = await getAvailablePurchases();
    return (all ?? []).find((p) => isPlanProduct(p.productId)) ?? null;
  } catch {
    return null;
  }
}

/** Opens Google Play's purchase sheet. The result arrives through the
 *  purchase listener, which verifies with the backend first. */
export async function buyPlan(tier: string, interval: PlanInterval) {
  const sku = appleProductId(tier, interval);
  const offerToken = offerTokens[sku];
  if (!useIapStore.getState().products[sku] || !offerToken) {
    toast.info(UNAVAILABLE);
    return;
  }
  const { productId } = splitSku(sku);
  setIap({ busySku: sku });
  let accountId: string;
  try {
    accountId = (await getConfig()).obfuscated_account_id;
  } catch {
    setIap({ busySku: null });
    toast.info(UNAVAILABLE);
    return;
  }
  const current = await currentPlanPurchase();
  const replacing = current && current.purchaseToken;
  try {
    await requestPurchase({
      request: {
        google: {
          skus: [productId],
          subscriptionOffers: [{ sku: productId, offerToken }],
          obfuscatedAccountId: accountId,
          ...(replacing
            ? {
                purchaseToken: current.purchaseToken,
                subscriptionProductReplacementParams: {
                  oldProductId: current.productId,
                  replacementMode: 'with-time-proration' as const,
                },
              }
            : null),
        },
      },
      type: 'subs',
    });
  } catch (err) {
    onPurchaseError(err as { message?: string });
  }
}

/** "Restore purchases": verify every AppSketch subscription the signed-in
 *  Google account holds. */
export async function restorePlans() {
  if (!connected) return;
  setIap({ restoring: true });
  try {
    const purchases = (await getAvailablePurchases()) ?? [];
    const outcomes: Outcome[] = [];
    for (const p of purchases.filter((x) => isPlanProduct(x.productId)))
      outcomes.push(await verifyAndFinish(p));
    const activated = outcomes.find((o) => o.kind === 'activated');
    const rejected = outcomes.find((o) => o.kind === 'rejected');
    if (activated) announce(activated);
    else if (rejected) announce(rejected);
    else if (outcomes.some((o) => o.kind === 'retry'))
      announce({ kind: 'retry' });
    else if (outcomes.some((o) => o.kind === 'expired'))
      toast.info('Your Google Play subscription has expired.');
    else
      toast.info('No AppSketch subscription was found on this Google account.');
  } catch (err) {
    if (!isUserCancelledError(err))
      toast.error('Restore failed. Please try again.');
  } finally {
    setIap({ restoring: false });
  }
}

export async function manageSubscriptions() {
  try {
    await deepLinkToSubscriptions({});
  } catch {
    Linking.openURL(
      'https://play.google.com/store/account/subscriptions'
    ).catch(() => {});
  }
}
