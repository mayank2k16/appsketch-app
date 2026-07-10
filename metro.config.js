/* eslint-env node */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Prefer node crawler when Watchman has permission issues (e.g. "Operation not permitted")
if (process.env.CI === '1') {
  config.watcher = { ...config.watcher, useWatchman: false };
}

const finalConfig = withNativeWind(config, { input: './global.css' });

// react-native-maps has no web implementation and pulls in native-only code
// (codegenNativeCommands) that Metro can't resolve for the web platform, even
// though consumers already feature-detect it via a guarded require(). Redirect
// it to a no-op stub when bundling for web only.
const upstreamResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform, ...rest) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'metro-stubs/react-native-maps.web.js'),
    };
  }
  return upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform, ...rest)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
