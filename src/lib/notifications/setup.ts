import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Route map: notification data.route → expo-router path.
 * Add entries for screens you want to deep link to.
 */
const ROUTE_MAP: Record<string, string> = {
  home: '/storefront',
  storefront: '/storefront',
  cart: '/storefront/cart',
  wishlist: '/storefront/(tabs)/wishlist',
  explore: '/storefront/(tabs)/explore',
  profile: '/storefront/(tabs)/profile',
  orders: '/storefront/myorders',
  'order-success': '/storefront/OrderSuccessScreen',
  product: '/storefront/[id]',
  categories: '/storefront/categories',
  login: '/login',
};

/**
 * How to handle incoming notifications when app is foregrounded.
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

function resolveRoute(data: NotificationData): string | null {
  const route = data.route ?? data.screen;
  if (!route || typeof route !== 'string') return null;

  const normalized = route.toLowerCase().replace(/^\//, '');
  return ROUTE_MAP[normalized] ?? (route.startsWith('/') ? route : `/${route}`);
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content
    .data as NotificationData | undefined;
  if (!data) return;

  const path = resolveRoute(data);

  if (path) {
    if (path.includes('[id]') && data.id) {
      router.push(path.replace('[id]', String(data.id)) as never);
    } else {
      router.push(path as never);
    }
  }
}

/**
 * Get Expo Push Token for sending notifications via Expo / Firebase.
 * Returns null if not a physical device or permission denied.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token.data;
  } catch {
    return null;
  }
}

/**
 * Set up notification listeners.
 * Also handles cold start: app opened from notification tap.
 * Call once at app startup (e.g. in root layout).
 */
export async function setupNotifications(): Promise<() => void> {
  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  if (lastResponse) {
    handleNotificationResponse(lastResponse);
    await Notifications.dismissNotificationAsync(
      lastResponse.notification.request.identifier
    );
  }

  const subscriptionRespond =
    Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

  const subscriptionReceived =
    Notifications.addNotificationReceivedListener(() => {
      // Foreground: notification shown by handler
    });

  return () => {
    subscriptionRespond.remove();
    subscriptionReceived.remove();
  };
}
