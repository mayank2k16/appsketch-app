import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';

import {
  connectStore,
  disconnectStore,
  hasStoreBilling,
  reconcilePending,
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
    void connectStore();
    return () => {
      void disconnectStore();
    };
  }, []);
  React.useEffect(() => {
    if (hasStoreBilling() && status === 'signIn') void reconcilePending();
  }, [status]);
}
