/**
 * Release signing for `expo prebuild --clean`: android/ is generated, so the
 * upload keystore and its signingConfig live outside it (credentials/android)
 * and are copied back in on every prebuild.
 */
const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
} = require('@expo/config-plugins');

const CRED_DIR = 'credentials/android';

function readProps(root) {
  const file = path.join(root, CRED_DIR, 'keystore.properties');
  if (!fs.existsSync(file)) return null;
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
  );
}

module.exports = function withReleaseSigning(config) {
  config = withDangerousMod(config, [
    'android',
    async (c) => {
      const root = c.modRequest.projectRoot;
      const props = readProps(root);
      if (props) {
        fs.copyFileSync(
          path.join(root, CRED_DIR, 'release.keystore'),
          path.join(c.modRequest.platformProjectRoot, 'app', props.MYAPP_UPLOAD_STORE_FILE)
        );
      }
      return c;
    },
  ]);

  config = withGradleProperties(config, (c) => {
    const props = readProps(c.modRequest.projectRoot);
    if (!props) return c;
    for (const [key, value] of Object.entries(props)) {
      c.modResults = c.modResults.filter((p) => p.key !== key);
      c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });

  return withAppBuildGradle(config, (c) => {
    let src = c.modResults.contents;
    if (!src.includes('MYAPP_UPLOAD_STORE_FILE')) {
      src = src.replace(
        /signingConfigs \{\n(\s*)debug \{/,
        `signingConfigs {
$1release {
$1    storeFile file(MYAPP_UPLOAD_STORE_FILE)
$1    storePassword MYAPP_UPLOAD_STORE_PASSWORD
$1    keyAlias MYAPP_UPLOAD_KEY_ALIAS
$1    keyPassword MYAPP_UPLOAD_KEY_PASSWORD
$1}
$1debug {`
      );
      // Only the release buildType: its block comes after debug's.
      src = src.replace(
        /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release'
      );
    }
    c.modResults.contents = src;
    return c;
  });
};
