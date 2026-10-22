/**
 * The launch screen is solid orange (expo-splash-screen in app.config.ts), so
 * its status bar wants light content. iOS takes that from UIStatusBarStyle
 * (ios.infoPlist); on Android the system splash takes it from the splash
 * theme, which expo-splash-screen writes without windowLightStatusBar. The
 * in-app splash (src/app/splash.tsx) switches to dark content itself.
 */
const { withAndroidStyles } = require('@expo/config-plugins');

const THEME = 'Theme.App.SplashScreen';
const ITEM = 'android:windowLightStatusBar';

module.exports = function withSplashLightStatusBar(config) {
  return withAndroidStyles(config, (c) => {
    const styles = c.modResults.resources.style ?? [];
    const theme = styles.find((s) => s.$.name === THEME);
    if (!theme) return c;
    theme.item = (theme.item ?? []).filter((i) => i.$.name !== ITEM);
    theme.item.push({ $: { name: ITEM }, _: 'false' });
    return c;
  });
};
