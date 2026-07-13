import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { DrawerMenu } from '@/components/drawer-menu';
import { homeTheme } from './theme/HomeTheme';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { GallerySection } from './Gallery';
import AgentScreen from './Agent';
import { Showcase } from './Showcase';

export function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  function handleStartPress() {
    // TODO: route to onboarding / explore
  }

  function handleLearnPress() {
    // TODO: route to info / about
  }

  function handleGalleryStartPress() {
    // TODO: route to gallery
  }

  function handleGalleryLearnPress() {
    // TODO: route to examples
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={t.statusBar}
      />

      {/* Header absolutely overlays the hero — rendered after scroll for z-order */}
      <HomeHeader onMenuPress={() => setDrawerOpen(true)} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        bounces={false}
      >
        {/* ── Full-screen hero ── */}
        <HeroBanner
          onStartPress={handleStartPress}
          onLearnPress={handleLearnPress}
        />
        <AgentScreen />

        <GallerySection
          onStartPress={handleGalleryStartPress}
          onLearnPress={handleGalleryLearnPress}
        />

        <Showcase />

        {/* ── Future home sections slot in here ── */}
      </ScrollView>

      {/* Sliding drawer */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
});
