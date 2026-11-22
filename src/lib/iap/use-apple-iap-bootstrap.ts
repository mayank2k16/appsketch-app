import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';

import {
  connectStore,
  hasStoreBilling,
  reconcilePending,
  syncEntitlements,
} from './store';

/** Opens the store connection (StoreKit on iOS, Google Play Billing on
 *  Android) for as long as the main app (tabs) is mounted, and re-runs the
 *  unfinished-purchase sweep whenever someone signs in (a purchase made just
 *  before a session expired gets verified against the account that is now
 *  signed in). No-op on web. */
export function useAppleIapBootstrap() {
  const status = useAuth.use.status();
  React.useEffect(() => {
    if (!hasStoreBilling()) return;
    // Opened once for the app's life and never closed on unmount: a tabs
    // remount racing a disconnect used to leave no purchase listener.
    void connectStore();
  }, []);
  React.useEffect(() => {
    // Unfinished purchases first, then every active subscription (an upgrade
    // inside the group, or a purchase whose event was missed).
    if (hasStoreBilling() && status === 'signIn')
      void reconcilePending().then(() => syncEntitlements());
  }, [status]);
}
