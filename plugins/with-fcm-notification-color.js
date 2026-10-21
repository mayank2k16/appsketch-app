/**
 * expo-notifications writes FCM's default_notification_color into the app
 * manifest, and @react-native-firebase/messaging declares the same meta-data
 * (@color/white) in its library manifest; the merge fails on the clash. Let
 * the app's value win, as the hand-edited manifest did before CNG.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const NAME = 'com.google.firebase.messaging.default_notification_color';

module.exports = function withFcmNotificationColor(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const app = manifest.application?.[0];
    if (!app) return c;
    app['meta-data'] = app['meta-data'] ?? [];
    let item = app['meta-data'].find((m) => m.$['android:name'] === NAME);
    // This mod can run before expo-notifications'; it then updates our entry
    // in place, keeping tools:replace.
    if (!item) {
      item = { $: { 'android:name': NAME, 'android:resource': '@color/notification_icon_color' } };
      app['meta-data'].push(item);
    }
    item.$['tools:replace'] = 'android:resource';
    return c;
  });
};
