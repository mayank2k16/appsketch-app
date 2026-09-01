/* eslint-disable max-lines-per-function */
import type { ConfigContext, ExpoConfig } from '@expo/config';
import { withAndroidManifest } from '@expo/config-plugins';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

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
  let cfg: ExpoConfig = { ...config } as ExpoConfig;

  // ── Package-visibility query for the system speech recognizer ───────────────
  // Android 11+ (API 30+) hides the speech-recognition service behind
  // package-visibility filtering. Without declaring it here, SpeechRecognizer
  // can't bind to it and @react-native-voice/voice's `Voice.start()` rejects
  // immediately with no useful message — surfaced in the UI as "Couldn't
  // start voice input." The voice package's own config plugin only adds the
  // RECORD_AUDIO permission, not this.
  cfg = withAndroidManifest(cfg, (c) => {
    const manifest = c.modResults.manifest as any;
    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];
    queries.intent = [
      ...(queries.intent ?? []),
      {
        action: [
          { $: { 'android:name': 'android.speech.RecognitionService' } },
        ],
      },
    ];
    queries.package = [
      ...(queries.package ?? []),
      { $: { 'android:name': 'com.google.android.googlequicksearchbox' } },
    ];
    return c;
  });

  // ── Inject Google Maps API key into AndroidManifest.xml ─────────────────────
  // The react-native-maps config plugin (v1.20.1) can't be used because its
  // app.plugin.js imports JSX files that Node.js can't parse. We replicate the
  // only thing we need from it: the <meta-data> entry for the Maps API key.
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
              'android:name': 'com.google.android.geo.API_KEY',
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
    // Dark only — the app ships no light theme, and 'automatic' let the
    // native shell (splash, system chrome) flash white before JS booted.
    userInterfaceStyle: 'dark',
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
        // Without these keys iOS refuses the PHPhotoLibrary authorization that
        // `expo-image-picker` requests before presenting its sheet, and the
        // picker comes up in an unauthorized limbo where Cancel and Add do
        // nothing — the "gallery opens but the cross and the tick are dead"
        // bug. A missing usage string is not a warning on iOS; it is a hard
        // failure at the moment of the request.
        NSPhotoLibraryUsageDescription:
          'We need access to your photos so you can attach screenshots and reference images for the agent.',
        NSPhotoLibraryAddUsageDescription:
          'We need access to your photos to save images you export from the app.',
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
        // Android 13+ split the old READ_EXTERNAL_STORAGE grant per media type;
        // without this the gallery returns an empty list instead of an error.
        'READ_MEDIA_IMAGES',
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
      ['expo-video'],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#000000',
          image: './assets/logo.png',
          imageWidth: 150,
        },
      ],
      // Declared explicitly (rather than relying on autolinking alone) so the
      // photo-library usage strings and the Android media permission are owned
      // by the plugin on every prebuild, not just by the infoPlist block above.
      [
        'expo-image-picker',
        {
          photosPermission:
            'We need access to your photos so you can attach screenshots and reference images for the agent.',
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission:
            'We need access to your photos so you can attach screenshots and reference images for the agent.',
          savePhotosPermission:
            'We need access to your photos to save images you export from the app.',
          isAccessMediaLocationEnabled: false,
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
