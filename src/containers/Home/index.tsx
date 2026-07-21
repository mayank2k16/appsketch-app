import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { DrawerMenu } from '@/components/drawer-menu';
import { homeTheme } from './theme/HomeTheme';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { TwinkleDots } from './Hero/TwinkleDots';
import { GallerySection } from './Gallery';
import { AgentV2 } from './AgentV2';
import { Showcase } from './Showcase';

const { width: W, height: H } = Dimensions.get('window');

export function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

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

      {/* Single shared dotted backdrop — Header and Hero (and the old Agent's
          CipherField) previously each ran their own separate animated dot
          grid simultaneously; consolidated into one fixed, non-scrolling
          full-screen layer so there's only ever one running, not several. */}
      <TwinkleDots
        width={W}
        height={H}
        color={t.dotColor}
        spacing={32}
        radius={1.3}
        baseOpacity={isDark ? 0.04 : 0.03}
        peakOpacity={isDark ? 0.18 : 0.12}
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

        {/* AgentV2 — simplified stand-in for the original animated Agent
            preview (no orbit clocks, no per-glyph animation). The original
            is untouched at ./Agent and still used standalone at
            (tabs)/agent.tsx; swap this import back to restore it here. */}
        <AgentV2 />

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
