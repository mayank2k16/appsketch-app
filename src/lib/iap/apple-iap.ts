/**
 * StoreKit 2 (expo-iap) for the AppSketch plans — iOS only. One connection
 * for the app's lifetime (opened by `useAppleIapBootstrap` in the tabs
 * layout), so transactions that finished paying while the app was closed or
 * the verify call failed are picked up at launch, not only when the Pricing
 * tab happens to be open. State the UI reads lives in `useIapStore`.
 */
import {
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  getAvailablePurchases,
  getPendingTransactionsIOS,
  initConnection,
  isUserCancelledError,
  type ProductSubscription,
  type Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from 'expo-iap';
import { AppState, Linking, Platform } from 'react-native';

import { haptic } from '@/lib/haptics';
import { toast } from '@/lib/toast';

import { setIap, useIapStore } from './iap-store';
import {
  APPLE_PRODUCT_IDS,
  appleProductId,
  isAppleProductId,
  type PlanInterval,
} from './product-ids';
import { getAppleConfig, verifyAndFinish, type VerifyOutcome } from './verify';

const MANAGE_URL = 'https://apps.apple.com/account/subscriptions';
const RETRY_MSG =
  "Your payment went through. We'll finish activating your plan automatically — check back in a moment.";

let connected = false;
let subs: { remove: () => void }[] = [];
/** Transaction ids being verified right now (listener + reconcile overlap). */
const inFlight = new Set<string>();
/** Transactions already settled with the backend (listener + the purchase
 *  `requestPurchase` returns can both deliver the same one). */
const settled = new Set<string>();

export const isIos = () => Platform.OS === 'ios';

function errorText(err: unknown): string {
  const e = err as { code?: unknown; message?: string } | null;
  const msg = e?.message || String(err);
  return e?.code ? `${String(e.code)}: ${msg}` : msg;
}

function txKey(p: Purchase): string {
  return String(
    (p as { transactionId?: string }).transactionId ?? p.id ?? p.productId
  );
}

function announce(outcome: VerifyOutcome) {
  switch (outcome.kind) {
    case 'activated':
      haptic.success();
      toast.success(`You're on ${outcome.planName}. Enjoy!`);
      break;
    case 'rejected':
      toast.error(outcome.message);
      break;
    case 'retry':
      toast.info(RETRY_MSG);
      break;
    default:
      break;
  }
}

async function handlePurchase(p: Purchase, silent: boolean) {
  if (!isAppleProductId(p.productId)) return;
  if (p.purchaseState === 'pending') {
    setIap({ busySku: null });
    if (!silent)
      toast.info(
        'Waiting for approval — your plan starts once the purchase is approved.'
      );
    return;
  }
  const key = txKey(p);
  if (inFlight.has(key) || settled.has(key)) {
    if (settled.has(key) && useIapStore.getState().busySku === p.productId)
      setIap({ busySku: null });
    return;
  }
  inFlight.add(key);
  try {
    const outcome = await verifyAndFinish(p);
    if (outcome.kind !== 'retry' && outcome.kind !== 'skipped')
      settled.add(key);
    if (!silent) announce(outcome);
  } finally {
    inFlight.delete(key);
    if (useIapStore.getState().busySku === p.productId)
      setIap({ busySku: null });
  }
}

function onPurchaseError(err: { code?: unknown; message?: string } | null) {
  setIap({ busySku: null });
  if (isUserCancelledError(err)) return;
  toast.error(err?.message || 'The purchase could not be completed.');
}

/** Every product id ever asked for (launch list + live plan tiers). */
const wanted = new Set<string>(APPLE_PRODUCT_IDS);

async function loadProducts() {
  try {
    const list = (await fetchProducts({
      skus: [...wanted],
      type: 'subs',
    })) as ProductSubscription[] | null;
    const products: Record<string, ProductSubscription> = {};
    for (const product of list ?? []) products[product.id] = product;
    const found = Object.keys(products).length;
    setIap({
      products,
      status: found ? 'ready' : 'unavailable',
      detail: found ? null : `App Store returned 0 of ${wanted.size} plans`,
    });
  } catch (err) {
    setIap({ status: 'unavailable', detail: errorText(err) });
  }
}

/** Finish what StoreKit still holds unfinished (paid, never verified). */
export async function reconcilePending() {
  if (!connected) return;
  try {
    const pending = await getPendingTransactionsIOS();
    for (const p of pending ?? []) await handlePurchase(p as Purchase, true);
  } catch {
    // Best effort; the next launch tries again.
  }
}

/** Purchase listeners live for the whole app, registered once. They used
 *  to be removed with the tabs layout; a remount racing the old
 *  disconnect left the app connected with no listener, so a paid purchase
 *  was never verified and the button spun forever. */
function listen() {
  if (subs.length) return;
  subs = [
    // Loud only for the purchase the user just started; renewals and other
    // background deliveries are verified quietly.
    purchaseUpdatedListener(
      (p) =>
        void handlePurchase(p, useIapStore.getState().busySku !== p.productId)
    ),
    purchaseErrorListener(onPurchaseError),
  ];
  // Coming back to the app (e.g. from the payment sheet or Settings) is a
  // natural moment to finish anything StoreKit still holds.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void reconcilePending();
  });
}

let connecting: Promise<void> | null = null;

export async function connectStore() {
  if (!isIos()) return;
  if (connected) {
    listen();
    return;
  }
  if (connecting) return connecting;
  connecting = (async () => {
    setIap({ status: 'connecting' });
    try {
      await initConnection();
      connected = true;
    } catch (err) {
      setIap({ status: 'unavailable', detail: errorText(err) });
      return;
    }
    listen();
    await loadProducts();
    // StoreKit queues unfinished transactions just after connecting.
    setTimeout(() => void reconcilePending(), 1500);
  })().finally(() => {
    connecting = null;
  });
  return connecting;
}

/** Kept for completeness; the app never disconnects (see `listen`). */
export async function disconnectStore() {
  subs.forEach((s) => s.remove());
  subs = [];
  if (connected) await endConnection().catch(() => false);
  connected = false;
}

/** Asks StoreKit for product ids not requested yet (a tier the plans API
 *  returns that the launch list does not know). */
export async function ensureProducts(skus: string[]) {
  const missing = skus.filter((sku) => !wanted.has(sku));
  if (!missing.length) return;
  missing.forEach((sku) => wanted.add(sku));
  if (connected) await loadProducts();
}

/** Retry after "Purchases are not available right now". */
export async function reloadProducts() {
  if (!connected) return connectStore();
  setIap({ status: 'connecting' });
  await loadProducts();
}

/** Opens Apple's purchase sheet. The result arrives through the purchase
 *  listener (`handlePurchase`), which verifies with the backend first. */
export async function buyPlan(tier: string, interval: PlanInterval) {
  const sku = appleProductId(tier, interval);
  if (!useIapStore.getState().products[sku]) {
    toast.info(
      'Purchases are not available right now. Please try again later.'
    );
    return;
  }
  setIap({ busySku: sku });
  let appAccountToken: string;
  try {
    appAccountToken = (await getAppleConfig()).app_account_token;
  } catch {
    setIap({ busySku: null });
    toast.info(
      'Purchases are not available right now. Please try again later.'
    );
    return;
  }
  await connectStore();
  try {
    const result = await requestPurchase({
      request: { apple: { sku, appAccountToken } },
      type: 'subs',
    });
    // The listener is the main path; the purchase returned here is a second
    // one (handlePurchase de-duplicates), so a missed event cannot strand a
    // paid purchase.
    const got = (Array.isArray(result) ? result : [result]).filter(
      (x): x is Purchase => !!x && typeof x === 'object' && 'productId' in x
    );
    for (const p of got) void handlePurchase(p, false);
  } catch (err) {
    onPurchaseError(err as { message?: string });
    return;
  }
  watchdog(sku);
}

/** If the purchase still has not been confirmed a little after the sheet
 *  closed, ask StoreKit for unfinished transactions; never leave the button
 *  spinning. */
function watchdog(sku: string) {
  setTimeout(async () => {
    if (useIapStore.getState().busySku !== sku) return;
    await reconcilePending();
    setTimeout(() => {
      if (useIapStore.getState().busySku !== sku) return;
      setIap({ busySku: null });
      toast.info(RETRY_MSG);
    }, 15000);
  }, 8000);
}

function summarizeRestore(outcomes: VerifyOutcome[]) {
  const activated = outcomes.find((o) => o.kind === 'activated');
  const rejected = outcomes.find((o) => o.kind === 'rejected');
  if (activated) return announce(activated);
  if (rejected) return announce(rejected);
  if (outcomes.some((o) => o.kind === 'retry'))
    return announce({ kind: 'retry' });
  if (outcomes.some((o) => o.kind === 'expired')) {
    toast.info('Your App Store subscription has expired.');
    return;
  }
  toast.info('No AppSketch subscription was found for this Apple ID.');
}

/** "Restore Purchases": sync with the App Store, then verify every AppSketch
 *  transaction the Apple ID still holds. */
export async function restorePlans() {
  if (!connected) return;
  setIap({ restoring: true });
  try {
    await restorePurchases();
    const purchases = await getAvailablePurchases({
      onlyIncludeActiveItemsIOS: true,
    });
    const outcomes: VerifyOutcome[] = [];
    for (const p of purchases.filter((x) => isAppleProductId(x.productId))) {
      outcomes.push(await verifyAndFinish(p));
    }
    summarizeRestore(outcomes);
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
    Linking.openURL(MANAGE_URL).catch(() => {});
  }
}
