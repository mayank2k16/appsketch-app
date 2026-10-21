/**
 * Live Coder previews are served by Metro over plain http on
 * tunnel.appsketch.ai (rathole ports). Allow cleartext for appsketch.ai hosts
 * and loopback (a workspace forwarded with `adb reverse`, which iOS ATS
 * already exempts); everything else keeps the platform defaults.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
} = require('@expo/config-plugins');

const DOMAIN = 'appsketch.ai';

const NETWORK_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">${DOMAIN}</domain>
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
  </domain-config>
</network-security-config>
`;

module.exports = function withGuestNetwork(config) {
  config = withInfoPlist(config, (c) => {
    const ats = c.modResults.NSAppTransportSecurity ?? {};
    ats.NSExceptionDomains = {
      ...(ats.NSExceptionDomains ?? {}),
      [DOMAIN]: {
        NSIncludesSubdomains: true,
        NSExceptionAllowsInsecureHTTPLoads: true,
      },
    };
    c.modResults.NSAppTransportSecurity = ats;
    return c;
  });

  config = withDangerousMod(config, [
    'android',
    async (c) => {
      const dir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'network_security_config.xml'), NETWORK_XML);
      return c;
    },
  ]);

  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (app) app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return c;
  });
};
