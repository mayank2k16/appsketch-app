import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { restorePlans, useIapStore } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

export const TERMS_OF_USE_URL =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_POLICY_URL = 'https://appsketch.ai/privacy-policy';

const open = (url: string) => {
  WebBrowser.openBrowserAsync(url).catch(() => {});
};

/** Guideline 3.1.2 block under the plans (iOS): Restore Purchases, the
 *  auto-renew disclosure, and working links to the Terms of Use (Apple's
 *  standard EULA) and the Privacy Policy. */
export function StoreFooter({
  t,
  p,
  signedIn,
}: {
  t: AppColors;
  p: PricingPalette;
  signedIn: boolean;
}) {
  const router = useRouter();
  const restoring = useIapStore((s) => s.restoring);
  // Always offered (3.1.1). Restoring attaches the plan to an AppSketch
  // account, so a guest signs in first and comes back here.
  const onRestore = () => {
    if (signedIn) void restorePlans();
    else router.push({ pathname: '/welcome', params: { return: '1' } });
  };
  const link = { color: t.text, textDecorationLine: 'underline' as const };
  return (
    <View style={st.wrap}>
      <PressableScale
        onPress={onRestore}
        disabled={restoring}
        disabledOpacity={1}
        accessibilityRole="button"
        style={[
          st.restore,
          { borderColor: p.cardBorder, backgroundColor: p.cardBg },
        ]}
      >
        {restoring ? (
          <ActivityIndicator size="small" color={t.text} />
        ) : (
          <Text style={[st.restoreText, { color: t.text }]}>
            Restore Purchases
          </Text>
        )}
      </PressableScale>
      <Text style={[st.legal, { color: t.textSub }]}>
        Payment is charged to your Apple ID account at confirmation of purchase.
        Subscription renews automatically unless cancelled at least 24 hours
        before the end of the current period. Your account is charged for
        renewal within 24 hours before the end of the current period. Manage or
        cancel in your App Store account settings.
      </Text>
      <View style={st.links}>
        <Text
          accessibilityRole="link"
          onPress={() => open(TERMS_OF_USE_URL)}
          style={[st.link, link]}
        >
          Terms of Use
        </Text>
        <Text style={[st.link, { color: t.textSub }]}>·</Text>
        <Text
          accessibilityRole="link"
          onPress={() => open(PRIVACY_POLICY_URL)}
          style={[st.link, link]}
        >
          Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingTop: 30, gap: 16 },
  restore: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: { fontFamily: F.sans600, fontSize: 14.5 },
  legal: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  link: { fontFamily: F.sans600, fontSize: 12.5 },
});
