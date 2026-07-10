/**
 * Runs on app start: requests permissions and sets up notifications.
 * Handles all permission states; failures are non-blocking.
 */

import * as React from 'react';

import { requestAllPermissions } from '@/lib/permissions';
import {
  getExpoPushToken,
  setupNotifications,
} from '@/lib/notifications';

let notificationCleanup: (() => void) | null = null;

export function useAppStartup() {
  React.useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const [, cleanup] = await Promise.all([
          requestAllPermissions().then((result) => {
            if (__DEV__) {
              console.log('[AppStartup] Permissions:', result);
            }
          }),
          setupNotifications(),
        ]);

        if (mounted) notificationCleanup = cleanup;

        const token = await getExpoPushToken();
        if (token && __DEV__) {
          console.log('[AppStartup] Push token:', token);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[AppStartup] Error:', err);
        }
      }
    }

    run();
    return () => {
      mounted = false;
      notificationCleanup?.();
      notificationCleanup = null;
    };
  }, []);
}
