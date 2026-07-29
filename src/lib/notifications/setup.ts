import messaging from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform, Vibration } from 'react-native';

import { useCmsTabIntent } from '@/lib/store/cms-tab-intent';

/**
 * Android notification channel id. A channel's sound/vibration are LOCKED once
 * created, so this id is versioned — bump it whenever those settings change so
 * upgrading users get a freshly-created channel instead of the old one. Must
 * stay in sync with the `default_notification_channel_id` meta-data in
 * AndroidManifest.xml (and the backend's STAFF_FCM_ANDROID_CHANNEL_ID in
 * shop/services/delivery_service.py).
 */
export const NOTIFICATION_CHANNEL_ID = 'appsketch_staff_orders_v1';

/** Vibration pattern used for both the Android channel and foreground receipts. */
const VIBRATION_PATTERN = [0, 400, 200, 400];

/**
 * Route map: notification data.route → a CMS tab key. This is the tenant
 * (staff) app — `CmsShell` keeps its active tab as local state rather than a
 * per-tab expo-router route (see `src/containers/CMS/CmsShell.tsx`), so a tap
 * navigates to `/cms` and sets the pending tab via `useCmsTabIntent` for
 * `CmsShell` to pick up on mount/focus.
 *
 * Values are plain strings, not `CmsTabKey` — see the note in
 * `@/lib/store/cms-tab-intent` on why this layer must not import from
 * `@/containers/CMS/*` (require cycle via `@/lib` → `useAuth`).
 */
const ROUTE_TO_TAB: Record<string, string> = {
  orders: 'orders',
  'order-placed': 'orders',
  notifications: 'notifications',
};

/**
 * Show notifications when app is foregrounded.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldAnimate: true,
  }),
});

type NotificationData = {
  route?: string;
  screen?: string;
  id?: string;
  [key: string]: unknown;
};

function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data as
    | NotificationData
    | undefined;
  if (!data) return;

  const route = data.route ?? data.screen;
  const tab =
    typeof route === 'string' ? ROUTE_TO_TAB[route.toLowerCase()] : undefined;
  if (tab) {
    useCmsTabIntent.getState().setPendingTab(tab);
    router.push('/cms' as never);
  }
}

/**
 * Get the Firebase FCM registration token (works on both iOS and Android).
 * On iOS, Firebase Messaging registers the APNs token with FCM and returns a
 * proper FCM registration token that the backend's FcmService can push to.
 * Returns null if not a physical device or permission denied.
 */
export async function getFCMToken(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn(
        '[getFCMToken] Skipped: not a physical device (simulator/emulator ' +
          'have no APNs/FCM registration).'
      );
    }
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    if (__DEV__) {
      console.warn(
        `[getFCMToken] Skipped: notification permission is "${status}", not granted.`
      );
    }
    return null;
  }

  try {
    const token = await messaging().getToken();
    return token;
  } catch (err) {
    if (__DEV__) {
      console.warn('[getFCMToken] messaging().getToken() threw:', err);
    }
    return null;
  }
}

/**
 * Create the Android notification channel that every push (remote or locally
 * re-presented) is posted to.
 *
 * A channel's sound/vibration/importance are LOCKED once created — Android
 * ignores later changes to an existing channel id — so the id is versioned.
 * Bump the suffix whenever those settings change. Must match the backend's
 * STAFF_FCM_ANDROID_CHANNEL_ID and `default_notification_channel_id` in
 * AndroidManifest.xml.
 *
 * Idempotent and safe to call repeatedly.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'New orders',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'notification.wav', // file in res/raw (bundled via app.config sounds)
    enableVibrate: true,
    vibrationPattern: VIBRATION_PATTERN,
    lightColor: '#397441',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  // Android 13+ requires explicit runtime permission.
  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Re-present foreground FCM pushes as local notifications.
 *
 * While the app is in the FOREGROUND, Android/FCM does NOT post a tray
 * notification — react-native-firebase intercepts the message and hands it to
 * onMessage() instead. Without this a push arriving while staff have the app
 * open is silently dropped. Background and killed states are handled by FCM's
 * own system-tray display, driven by the backend's android/apns config.
 *
 * `messaging()` throws when the native Firebase app was never initialized (iOS
 * needs `FirebaseApp.configure()` in AppDelegate; Android needs the
 * google-services plugin + json). That must not take down the rest of
 * notification setup, so this degrades to a no-op unsubscribe instead.
 */
function subscribeToForegroundPushes(): () => void {
  try {
    return messaging().onMessage(async (remoteMessage) => {
      const n = remoteMessage?.notification;
      const data = (remoteMessage?.data ?? {}) as NotificationData;
      const title = n?.title ?? (data.title as string | undefined) ?? '';
      const body = n?.body ?? (data.body as string | undefined) ?? '';
      if (!title && !body) return;

      if (Platform.OS === 'ios') Vibration.vibrate(VIBRATION_PATTERN);

      try {
        // Android drops notifications posted to a channel it doesn't know about.
        await ensureAndroidChannel();
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data, sound: 'notification.wav' },
          // `channelId` belongs on the TRIGGER — NotificationContentInput has
          // no such field, so passing it in `content` is silently ignored and
          // the notification lands on expo's fallback channel (default sound).
          // A bare `{channelId}` trigger presents immediately, on the right
          // channel.
          trigger:
            Platform.OS === 'android'
              ? ({ channelId: NOTIFICATION_CHANNEL_ID } as any)
              : null,
        });
      } catch {
        // Presenting is best-effort — never break the push pipeline.
      }
    });
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[setupNotifications] Firebase messaging unavailable — foreground ' +
          'pushes will not be re-presented. Is FirebaseApp.configure() / the ' +
          'google-services config in place?',
        err
      );
    }
    return () => {};
  }
}

/**
 * Set up notification listeners + handle cold-start tap.
 * Returns a cleanup function — call it on unmount.
 */
export async function setupNotifications(): Promise<() => void> {
  // Guarantee the channel exists before any listener can post to it, rather
  // than relying on requestNotificationPermission() having run first.
  await ensureAndroidChannel();

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    handleNotificationResponse(lastResponse);
    await Notifications.dismissNotificationAsync(
      lastResponse.notification.request.identifier
    );
  }

  const subscriptionRespond =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

  const subscriptionReceived = Notifications.addNotificationReceivedListener(
    () => {
      // Foreground: notification shown by handler
    }
  );

  const unsubscribeOnMessage = subscribeToForegroundPushes();

  return () => {
    subscriptionRespond.remove();
    subscriptionReceived.remove();
    unsubscribeOnMessage();
  };
}
