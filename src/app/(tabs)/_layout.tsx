import { Tabs } from 'expo-router';
import * as React from 'react';

import { GlowTabBar } from '@/components/bottom-tabs/GlowTabBar';

export default function TabsLayout() {
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
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace' }} />
    </Tabs>
  );
}
