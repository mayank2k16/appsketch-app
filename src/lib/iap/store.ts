/**
 * The plan store for this platform: StoreKit on iOS (apple-iap.ts), Google
 * Play Billing on Android (play-iap.ts). Both export the same functions; the
 * app calls these and never picks a store itself.
 */
import { Platform } from 'react-native';

import * as apple from './apple-iap';
import * as play from './play-iap';
import { type PlanInterval, storeInterval } from './product-ids';

const impl = () => (Platform.OS === 'android' ? play : apple);

export const isIos = () => Platform.OS === 'ios';
export const isAndroid = () => Platform.OS === 'android';
/** Plans are bought in-app through the platform store (iOS and Android). */
export const hasStoreBilling = () => isIos() || isAndroid();
/** "the App Store" / "Google Play", for copy. */
export const storeName = () => (isAndroid() ? 'Google Play' : 'the App Store');

export const connectStore = () => impl().connectStore();
export const disconnectStore = () => impl().disconnectStore();
export const reconcilePending = () => impl().reconcilePending();
export const ensureProducts = (skus: string[]) => impl().ensureProducts(skus);
export const reloadProducts = () => impl().reloadProducts();
/** 100X yearly is not a store product: it is bought monthly (product-ids.ts). */
export const buyPlan = (tier: string, interval: PlanInterval) =>
  impl().buyPlan(tier, storeInterval(tier, interval));
export const restorePlans = () => impl().restorePlans();
export const manageSubscriptions = () => impl().manageSubscriptions();
