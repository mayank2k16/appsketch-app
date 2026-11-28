// Google Play treats screenOrientation="portrait" and the CAMERA / location /
// RECORD_AUDIO permissions as *required* hardware features, which hides the app
// from devices without them (Play's pre-review check blocks the release:
// "Required hardware feature declarations are restricting your app's
// availability"). None of them is essential, so declare each one optional.
const { withAndroidManifest } = require('expo/config-plugins');

const FEATURES = [
  'android.hardware.screen.portrait',
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
  'android.hardware.location',
  'android.hardware.location.gps',
  'android.hardware.location.network',
  'android.hardware.microphone',
];

module.exports = function withOptionalHardwareFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const existing = manifest['uses-feature'] || [];
    const byName = new Map(existing.map((f) => [f.$['android:name'], f]));
    for (const name of FEATURES) {
      const entry = byName.get(name) || { $: { 'android:name': name } };
      entry.$['android:required'] = 'false';
      byName.set(name, entry);
    }
    manifest['uses-feature'] = [...byName.values()];
    return cfg;
  });
};
