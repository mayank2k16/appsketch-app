/**
 * Runs on app start: asks for notifications and sets them up.
 * Location and camera are NOT asked here: the app never uses location, and
 * every camera feature asks when the user opens it (Google Play flags apps
 * that ask for permissions at launch without a reason). Failures are
 * non-blocking.
 */

import * as React from 'react';

import {
  getFCMToken,
  requestNotificationPermission,
  setupNotifications,
} from '@/lib/notifications';

let notificationCleanup: (() => void) | null = null;

export function useAppStartup() {
  React.useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const [, cleanup] = await Promise.all([
          requestNotificationPermission(),
          setupNotifications(),
        ]);

        if (mounted) notificationCleanup = cleanup;

        const token = await getFCMToken();
        if (token && __DEV__) {
          console.log('[AppStartup] FCM token:', token);
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
