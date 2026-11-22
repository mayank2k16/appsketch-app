import { Tabs } from 'expo-router';
import * as React from 'react';

import { GlowTabBar } from '@/components/bottom-tabs/GlowTabBar';
import { useContinueTemplateBuy } from '@/containers/AppCart/template-buy';
import { useAppleIapBootstrap } from '@/lib/iap';

export default function TabsLayout() {
  // StoreKit connection + unfinished-transaction sweep (iOS only) for as
  // long as the main app is up — see docs/pricing-and-apple.md.
  useAppleIapBootstrap();
  // A template bought with "Buy plan" opens in the builder as soon as the
  // plan is active, whichever screen is open when the purchase confirms.
  useContinueTemplateBuy();
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <GlowTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // The bar is absolutely positioned (see GlowTabBar's `ring`), so the
        // scene must run the full height of the window for the screen to show
        // through the wedges outside its rounded corners. Without this the
        // navigator still reserves a row and the scene stops short of it.
        tabBarStyle: { position: 'absolute' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="agent" options={{ title: 'Agent' }} />
      <Tabs.Screen name="my-apps" options={{ title: 'My apps' }} />
      <Tabs.Screen name="pricing" options={{ title: 'Pricing' }} />
    </Tabs>
  );
}
