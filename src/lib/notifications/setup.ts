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

/**
 * Android channel for everything that ISN'T an order alert — support-chat
 * replies today, anything else non-order-shaped tomorrow. Plays Android's own
 * default notification sound (no custom `sound`/`vibrationPattern`) rather
 * than the order channel's bundled "cha-ching"-style sound, which is what
 * every foreground push — support included — was locked into before this
 * existed (see `subscribeToForegroundPushes`). Same versioning rule as
 * `NOTIFICATION_CHANNEL_ID`: a channel's settings are locked at creation, so
 * bump the suffix if they ever need to change.
 */
export const GENERAL_NOTIFICATION_CHANNEL_ID = 'appsketch_general_v1';

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

/**
 * Route a tapped notification from its `data` payload.
 *
 * Called from BOTH notification stacks, because they cover different states:
 *   - expo-notifications' response listener — foreground taps, and pushes we
 *     re-presented locally via `scheduleNotificationAsync`.
 *   - Firebase's `onNotificationOpenedApp` / `getInitialNotification` — taps on
 *     the tray notification FCM itself displayed while the app was backgrounded
 *     or killed. expo-notifications never sees those on Android, which is why a
 *     tap used to just open the app on its home screen.
 *
 * On a cold start the navigator isn't mounted yet and `router.push` would be a
 * silent no-op, so navigation is deferred until it is (see `navigateWhenReady`).
 */
function routeFromNotificationData(data?: NotificationData | null): void {
  if (!data) return;

  const route = data.route ?? data.screen;
  if (route === 'support-chat') {
    // Tapping a support-agent reply — deep-link straight into that
    // conversation (payload: {route: "support-chat", conversation_id}, see
    // support/services.py maybe_push_customer).
    const conversationId = data.conversation_id;
    navigateWhenReady(() =>
      router.push({
        pathname: '/support-chat',
        params: conversationId ? { id: String(conversationId) } : undefined,
      })
    );
    return;
  }

  const tab =
    typeof route === 'string' ? ROUTE_TO_TAB[route.toLowerCase()] : undefined;
  if (tab) {
    useCmsTabIntent.getState().setPendingTab(tab);
    navigateWhenReady(() => router.push('/cms' as never));
  }
}

/**
 * Retry a navigation until the router has actually mounted.
 *
 * A cold start driven by a notification tap runs this before the root layout
 * has rendered; expo-router throws ("Attempted to navigate before mounting the
 * Root Layout") or silently drops the push. Retrying on a short interval lands
 * the navigation as soon as the tree is up, and gives up rather than looping
 * forever if something is badly wrong.
 */
function navigateWhenReady(go: () => void, attempt = 0): void {
  try {
    go();
  } catch {
    if (attempt >= 40) return; // ~10s, then give up
    setTimeout(() => navigateWhenReady(go, attempt + 1), 250);
  }
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  routeFromNotificationData(
    response.notification.request.content.data as NotificationData | undefined
  );
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

/** Companion to `ensureAndroidChannel` for `GENERAL_NOTIFICATION_CHANNEL_ID`
 * — support-chat replies and anything else that isn't an order alert.
 * Deliberately omits `sound`/`vibrationPattern` so Android applies its own
 * default notification sound/vibration instead of a custom bundled one. */
export async function ensureGeneralAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(GENERAL_NOTIFICATION_CHANNEL_ID, {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  // Android 13+ requires explicit runtime permission.
  await ensureAndroidChannel();
  await ensureGeneralAndroidChannel();

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

      // Route decides the channel/sound — NOT a blanket "every push is an
      // order alert" assumption. That assumption is what made a support-chat
      // reply arriving in the foreground play the orders channel's bundled
      // "cha-ching" sound instead of a normal notification chime.
      const route = data.route ?? data.screen;
      const isOrderAlert = typeof route === 'string' && route.toLowerCase() in ROUTE_TO_TAB;
      const channelId = isOrderAlert ? NOTIFICATION_CHANNEL_ID : GENERAL_NOTIFICATION_CHANNEL_ID;

      if (Platform.OS === 'ios') Vibration.vibrate(VIBRATION_PATTERN);

      try {
        // Android drops notifications posted to a channel it doesn't know about.
        await ensureAndroidChannel();
        await ensureGeneralAndroidChannel();
        await Notifications.scheduleNotificationAsync({
          // `sound: true` on iOS plays the system's default notification
          // sound; the bundled `notification.wav` is reserved for order
          // alerts. On Android the channel's own locked-in sound wins
          // regardless of this field, so it only matters here for iOS.
          content: { title, body, data, sound: isOrderAlert ? 'notification.wav' : true },
          // `channelId` belongs on the TRIGGER — NotificationContentInput has
          // no such field, so passing it in `content` is silently ignored and
          // the notification lands on expo's fallback channel (default sound).
          // A bare `{channelId}` trigger presents immediately, on the right
          // channel.
          trigger:
            Platform.OS === 'android' ? ({ channelId } as any) : null,
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
  const unsubscribeOnOpen = subscribeToNotificationOpens();

  return () => {
    subscriptionRespond.remove();
    subscriptionReceived.remove();
    unsubscribeOnMessage();
    unsubscribeOnOpen();
  };
}

/**
 * Handle taps on notifications that **FCM itself** put in the tray (app
 * backgrounded or killed).
 *
 * expo-notifications' response listener only sees notifications posted through
 * expo — on Android it never fires for FCM's own tray notification, so without
 * this a tapped support reply just opened the app on whatever screen it last
 * had. `getInitialNotification` covers "app was killed", `onNotificationOpenedApp`
 * covers "app was backgrounded".
 */
function subscribeToNotificationOpens(): () => void {
  try {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data) {
          routeFromNotificationData(remoteMessage.data as NotificationData);
        }
      })
      .catch(() => {});

    return messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage?.data) {
        routeFromNotificationData(remoteMessage.data as NotificationData);
      }
    });
  } catch (err) {
    if (__DEV__) {
      console.warn(
        '[setupNotifications] Firebase messaging unavailable — background ' +
          'notification taps will not deep-link.',
        err
      );
    }
    return () => {};
  }
}
