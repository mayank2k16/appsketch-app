import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { DrawerMenu } from '@/components/drawer-menu';
import { LazySection } from './components/LazySection';
import { useAppStartup } from '@/lib';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { homeTheme } from './theme/HomeTheme';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { TwinkleDots } from './Hero/TwinkleDots';
import { TrustedBand } from './Gallery';
import { TemplateReel } from './TemplateReel';
import { AgentV2 } from './AgentV2';
import { Showcase } from './Showcase';
import { HowItWorksSection } from './HowItWorks';
import { IntegrationsCatalogSection } from './IntegrationsCatalog';
import { WhatsInsideSection } from './WhatsInside';
import { ShippedSection } from './Shipped';
import { TestimonialsSection } from './Testimonials';
import { FAQSection } from './FAQ';
import { ClosingCTASection } from './ClosingCTA';
import { FooterSection } from './Footer';

const { width: W, height: H } = Dimensions.get('window');

export function HomeScreen() {
  // Camera/location/notifications permissions are requested once the user
  // actually reaches Home, not during splash/login — asking upfront before
  // the user has any context for why the app wants them was getting ignored
  // more often than granted.
  useAppStartup();

  // No scroll listener at all. The gallery masonry used to consume a
  // `useAnimatedScrollHandler` for its parallax; with that effect gone, Home
  // scrolls with nothing subscribed to the offset — no worklet and no JS
  // callback runs per scroll frame.
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  /** The prompt card block's position, which places the hero's colour band. */
  const [card, setCard] = React.useState<{ y: number; h: number } | null>(null);

  // The tab bar floats over the scene now, so the scroll has to end above it
  // rather than behind it — see useTabBarHeight.
  const tabBarH = useTabBarHeight();

  // The four CTA handlers that lived here went with the "Get started" /
  // "Learn more" buttons in the hero and the Gallery section. Two of them were
  // empty TODOs; the other two pushed /agent and /about, both still reachable
  // from the drawer.

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
      {isDark && (
        <TwinkleDots
          width={W}
          height={H}
          color={t.dotColor}
          spacing={31}
          radius={1.1}
          baseOpacity={isDark ? 0.16 : 0.08}
          peakOpacity={isDark ? 0.42 : 0.24}
        />
      )}

      {/* Header absolutely overlays the hero — rendered after scroll for z-order */}
      <HomeHeader onMenuPress={() => setDrawerOpen(true)} />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: tabBarH }]}
        bounces={false}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        // Detaches off-screen section subtrees from the native view hierarchy
        // while they are scrolled away, so the compositor only ever walks the
        // handful of sections actually near the viewport.
        removeClippedSubviews
      >
        {/* The hero's colour band (white only): scrolls with the hero, clean
            canvas on top, pastel colour rising from the prompt card's middle
            and melting back into the page just below it. */}
        <AmbientBackground
          startY={card ? card.y + card.h * 0.5 : 0}
          height={card ? card.y + card.h + 150 : 0}
        >
          {/* White: the hero's dot field, in the brand orange, on the band so
              it scrolls with the hero and melts out with the colour. */}
          {card && (
            <TwinkleDots
              width={W}
              height={card.y + card.h + 150}
              // Same grid as dark (spacing 31, radius 1.1), in a light orange.
              color="#FFB37F"
              spacing={31}
              radius={1.1}
              baseOpacity={0.5}
              peakOpacity={0.95}
            />
          )}
        </AmbientBackground>

        {/* ── Full-screen hero ── */}
        <HeroBanner />

        {/* AgentV2 — simplified stand-in for the original animated Agent
            preview (no orbit clocks, no per-glyph animation). The original
            is untouched at ./Agent and still used standalone at
            (tabs)/agent.tsx; swap this import back to restore it here. */}
        <View
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            setCard((c) =>
              c && c.y === y && c.h === height ? c : { y, h: height }
            );
          }}
        >
          <AgentV2 />
        </View>

        {/* The template reel, straight under the suggestion prompts. It
            replaced the Gallery section's masonry (same idea, but static CDN
            shots behind a scrim); the section's "Trusted by" row stays. */}
        <TemplateReel />
        <TrustedBand t={t} />

        {/* Everything below the fold mounts after first paint, in order, each
            reserving its height so the scroll content never resizes under the
            user. Previously all of these mounted synchronously on first render
            — hundreds of views plus ~70 remote images before the hero was
            even interactive. */}
        <LazySection minHeight={620} order={0}>
          <Showcase />
        </LazySection>

        <LazySection minHeight={900} order={1}>
          <HowItWorksSection />
        </LazySection>

        <LazySection minHeight={880} order={2}>
          <WhatsInsideSection />
        </LazySection>

        <LazySection
          minHeight={Math.round((Dimensions.get('window').width * 70) / 40)}
          order={3}
        >
          <IntegrationsCatalogSection />
        </LazySection>

        <LazySection minHeight={620} order={4}>
          <ShippedSection />
        </LazySection>

        <LazySection minHeight={520} order={5}>
          <TestimonialsSection />
        </LazySection>

        <LazySection minHeight={760} order={6}>
          <FAQSection />
        </LazySection>

        <LazySection minHeight={1000} order={7}>
          <ClosingCTASection />
        </LazySection>

        <LazySection
          minHeight={Math.round((Dimensions.get('window').width * 6) / 16)}
          order={8}
        >
          <FooterSection />
        </LazySection>

        {/* ── Future home sections slot in here ── */}
      </KeyboardAwareScrollView>

      {/* Sliding drawer */}
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
