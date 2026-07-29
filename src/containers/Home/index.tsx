import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { DrawerMenu } from '@/components/drawer-menu';
import { useAppStartup } from '@/lib';
import { homeTheme } from './theme/HomeTheme';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { TwinkleDots } from './Hero/TwinkleDots';
import { GallerySection } from './Gallery';
import { AgentV2 } from './AgentV2';
import { Showcase } from './Showcase';
import { HowItWorksSection } from './HowItWorks';
import { WhatsInsideSection } from './WhatsInside';
import { ShippedSection } from './Shipped';
import { TestimonialsSection } from './Testimonials';
import { FAQSection } from './FAQ';
import { ClosingCTASection } from './ClosingCTA';

const { width: W, height: H } = Dimensions.get('window');

export function HomeScreen() {
  // Camera/location/notifications permissions are requested once the user
  // actually reaches Home, not during splash/login — asking upfront before
  // the user has any context for why the app wants them was getting ignored
  // more often than granted.
  useAppStartup();

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  function handleStartPress() {
    router.push('/agent');
  }

  function handleLearnPress() {
    router.push('/about');
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
        spacing={31}
        radius={1.1}
        baseOpacity={isDark ? 0.16 : 0.08}
        peakOpacity={isDark ? 0.42 : 0.24}
      />

      {/* Header absolutely overlays the hero — rendered after scroll for z-order */}
      <HomeHeader onMenuPress={() => setDrawerOpen(true)} />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        bounces={false}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
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

        <HowItWorksSection />

        <WhatsInsideSection />

        <ShippedSection />

        <TestimonialsSection />

        <FAQSection />

        <ClosingCTASection
          onStartPress={handleStartPress}
          onLearnPress={handleLearnPress}
        />

        {/* ── Future home sections slot in here ── */}
      </KeyboardAwareScrollView>

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
