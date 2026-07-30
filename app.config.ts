/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';
import { withAndroidManifest } from '@expo/config-plugins';

import { ClientEnv, Env } from './env';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.APP_ENV !== 'production',
  badges: [
    {
      text: Env.APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => {
  // ── Inject Google Maps API key into AndroidManifest.xml ─────────────────────
  // The react-native-maps config plugin (v1.20.1) can't be used because its
  // app.plugin.js imports JSX files that Node.js can't parse. We replicate the
  // only thing we need from it: the <meta-data> entry for the Maps API key.
  let cfg: ExpoConfig = { ...config } as ExpoConfig;
  if (Env.GOOGLE_MAPS_API_KEY) {
    cfg = withAndroidManifest(cfg, (c) => {
      const mainApp = c.modResults.manifest.application?.[0];
      if (mainApp) {
        const existing = (mainApp['meta-data'] ?? []) as any[];
        // Remove any existing entry for this key before inserting, to avoid duplicates
        mainApp['meta-data'] = [
          ...existing.filter(
            (m) => m.$?.['android:name'] !== 'com.google.android.geo.API_KEY'
          ),
          {
            $: {
              'android:name':  'com.google.android.geo.API_KEY',
              'android:value': Env.GOOGLE_MAPS_API_KEY,
            },
          },
        ];
      }
      return c;
    });
  }

  return {
    ...cfg,
    name: Env.NAME,
    description: `${Env.NAME} Mobile App`,
    owner: Env.EXPO_ACCOUNT_OWNER,
    scheme: Env.SCHEME,
    slug: 'appsketch-ai',
    version: Env.VERSION.toString(),
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: Env.BUNDLE_ID,
      googleServicesFile: './ios/Zorviaa/GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'We need your location to show nearby stores and delivery options.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'We need your location to show nearby stores and delivery options.',
        NSCameraUsageDescription:
          'We need camera access to scan barcodes and upload product photos.',
        NSUserNotificationsUsageDescription:
          'We send notifications about orders, offers, and updates.',
      },
    },
    experiments: {
      typedRoutes: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#FFFFFF',
      },
      package: Env.PACKAGE,
      googleServicesFile: './android/google-services.json',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      [
        'expo-notifications',
        {
          // Android requires this to be a plain white silhouette on a
          // transparent background — the OS re-tints it and ignores color, so
          // a full-color source (e.g. the app logo) renders as a solid blob in
          // the status bar. `assets/notification-icon.png` is a pre-converted
          // silhouette derived from `assets/logo.png` for exactly this reason.
          icon: './assets/notification-icon.png',
          color: '#ffffff',
          // Custom notification sound for new-order alerts (staff app), bundled
          // for both platforms — res/raw on Android (bare resource name
          // "notification"), app bundle on iOS ("notification.wav"). Must match
          // STAFF_FCM_ANDROID_SOUND / the Android channel in
          // src/lib/notifications/setup.ts and the backend's
          // shop/services/delivery_service.py::STAFF_FCM_ANDROID_SOUND.
          sounds: ['./assets/sounds/notification.wav'],
        },
      ],
      [
        'expo-video',
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#000000',
          image: './assets/logo.png',
          imageWidth: 150,
        },
      ],
      '@react-native-voice/voice',
      'expo-localization',
      'expo-router',
      ['app-icon-badge', appIconBadgeConfig],
      ['react-native-edge-to-edge'],
      // react-native-maps v1.20.1 auto-links via Podfile — no config plugin needed
    ],
    extra: {
      ...ClientEnv,
      eas: {
        projectId: Env.EAS_PROJECT_ID,
      },
    },
  };
};
