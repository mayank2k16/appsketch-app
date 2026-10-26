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
  // can't bind to it and the speech recognizer's start() fails
  // immediately with no useful message — surfaced in the UI as "Couldn't
  // start voice input." The speech plugin only adds the
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
    // Premium white icon (opaque — iOS flattens transparency to black).
    icon: './assets/icon.png',
    // White is the default theme, dark is a setting (docs/white-theme.md).
    // 'automatic' lets the in-app choice drive native chrome (alerts,
    // keyboard, pickers) through Appearance.setColorScheme.
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      // iPad runs full screen in portrait like the phone; the layouts are
      // portrait-only, so no landscape or split-view sizes.
      requireFullScreen: true,
      bundleIdentifier: Env.BUNDLE_ID,
      // TestFlight build number: bump before every upload (last: 50).
      buildNumber: "68",
      // Sign in with Apple (App Store guideline 4.8 — required because the
      // app offers Google sign-in). Prebuild adds
      // com.apple.developer.applesignin; ios/AppSketch/AppSketch.entitlements
      // carries the same key by hand. See docs/pricing-and-apple.md.
      usesAppleSignIn: true,
      // App Store / TestFlight builds are signed with the production push
      // profile; a 'development' value fails the archive's manual signing.
      entitlements:
        Env.APP_ENV === 'production'
          ? { 'aps-environment': 'production' }
          : undefined,
      googleServicesFile: './credentials/firebase/GoogleService-Info.plist',
      // Was a hand-edited ios/Zorviaa/PrivacyInfo.xcprivacy before the native
      // folders became generated (CNG); prebuild writes it from here now.
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1', '3B52.1'],
          },
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1', '1C8F.1', 'C56D.1'],
          },
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
          },
        ],
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Light content over the orange launch screen (docs/splash.md); the
        // in-app splash sets the bar itself from then on.
        UIStatusBarStyle: 'UIStatusBarStyleLightContent',
        NSLocationWhenInUseUsageDescription:
          'We need your location to show nearby stores and delivery options.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'We need your location to show nearby stores and delivery options.',
        NSCameraUsageDescription:
          'AppSketch uses the camera to scan the QR code in your workspace and to take product photos.',
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
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FAFAF8',
      },
      package: Env.PACKAGE,
      googleServicesFile: './credentials/firebase/google-services.json',
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
      // Guest apps (in-app host) use it; the host must ship every native
      // module published templates use — see docs/in-app-host.md.
      'expo-sharing',
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
      // Before expo-splash-screen: mods on one file run last-registered
      // first, so this edits the splash theme after that plugin writes it.
      './plugins/with-splash-light-status-bar',
      [
        'expo-splash-screen',
        {
          // Solid brand orange edge to edge, no logo (the image is fully
          // transparent), in both themes. The in-app splash
          // (src/app/splash.tsx) starts on this exact picture: the canvas
          // sweeps in clockwise, the orange gathers into the logo's dot and
          // the pencil draws the logo from it (docs/splash.md). Assets:
          // scripts/make-splash-logo.py, which also writes the prebuilt ios/
          // and android/ copies. Light status bar: ios.infoPlist
          // UIStatusBarStyle + plugins/with-splash-light-status-bar.
          backgroundColor: '#EB4709',
          image: './assets/splash-blank.png',
          imageWidth: 16,
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
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Speak your prompt instead of typing it.',
          speechRecognitionPermission:
            'Turn what you say into the text of your prompt.',
        },
      ],
      'expo-localization',
      'expo-router',
      ['app-icon-badge', appIconBadgeConfig],
      [
        'expo-camera',
        {
          cameraPermission:
            'AppSketch uses the camera to scan the QR code in your workspace and to take product photos.',
          recordAudioAndroid: false,
        },
      ],
      'expo-audio',
      // StoreKit 2 subscriptions on the Pricing tab (iOS only in JS; see
      // docs/pricing-and-apple.md).
      'expo-iap',
      './plugins/with-release-signing',
      './plugins/with-firebase-modular-headers',
      './plugins/with-guest-network',
      './plugins/with-fcm-notification-color',
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
