import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { DrawerMenu } from '@/components/drawer-menu';
import { homeTheme } from './theme/HomeTheme';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { GallerySection } from './Gallery';
import AgentScreen from './Agent';
import { Showcase } from './Showcase';

const { height: H } = Dimensions.get('window');
// AgentScreen's own root is `flex: 1`, correct for its other use as a full
// standalone tab screen ((tabs)/agent.tsx renders it directly). Nested here
// inside a ScrollView there's no bounded parent for that flex to fill against,
// so it was expanding to an oversized height — bloating CipherField's glyph
// grid (which sizes itself off the measured height) and pushing Hero out of
// the way the scroll content laid out. Give it a fixed height instead.
const AGENT_PREVIEW_HEIGHT = H * 0.4;

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
        <View style={{ height: AGENT_PREVIEW_HEIGHT }}>
          <AgentScreen />
        </View>

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
