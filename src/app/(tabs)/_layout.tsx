import { Tabs } from 'expo-router';
import * as React from 'react';

import { GlowTabBar } from '@/components/bottom-tabs/GlowTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <GlowTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="agent" options={{ title: 'Agent' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace' }} />
    </Tabs>
  );
}
