import * as React from 'react';

import { useAuth } from '@/hooks/useAuth';

import {
  connectStore,
  disconnectStore,
  isIos,
  reconcilePending,
} from './apple-iap';

/** Opens the StoreKit connection for as long as the main app (tabs) is
 *  mounted, and re-runs the unfinished-transaction sweep whenever someone
 *  signs in (a purchase made just before a session expired gets verified
 *  against the account that is now signed in). No-op off iOS. */
export function useAppleIapBootstrap() {
  const status = useAuth.use.status();
  React.useEffect(() => {
    if (!isIos()) return;
    void connectStore();
    return () => {
      void disconnectStore();
    };
  }, []);
  React.useEffect(() => {
    if (isIos() && status === 'signIn') void reconcilePending();
  }, [status]);
}
