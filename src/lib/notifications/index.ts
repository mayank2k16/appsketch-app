/**
 * Push notifications — Firebase FCM (Android) / APNs (iOS), via
 * @react-native-firebase/messaging. Supports deep linking to CMS tabs when a
 * staff member taps a notification (e.g. a new-order alert → Orders tab).
 *
 * Flow:
 *   1. requestNotificationPermission() / setupNotifications() — app startup
 *   2. On OTP verify: getFCMToken() → sent as device_id in the verify payload
 *      → Django saves to TenantUser.device_id → FcmService pushes to this
 *      device (see `verify_tenant_user` in the backend).
 */

export {
  ensureAndroidChannel,
  getFCMToken,
  requestNotificationPermission,
  setupNotifications,
} from './setup';
