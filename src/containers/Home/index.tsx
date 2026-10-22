import { useIsFocused } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { DrawerMenu } from '@/components/drawer-menu';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { useAppStartup } from '@/lib';
import { chromeTone, useChromeIsBlack } from '@/lib/chrome-tone';

import { AgentV2 } from './AgentV2';
import { HomeHeader } from './Header';
import { HeroBanner } from './Hero';
import { ShiftingDots } from './Hero/shifting-dots';
import { TwinkleDots } from './Hero/TwinkleDots';
import { setOnScreen, useOnScreen } from './on-screen';
import { StudioFeed } from './Studio';
import { type HomeColors, homeTheme } from './theme/HomeTheme';

const { width: W, height: H } = Dimensions.get('window');

/** The list's header: the hero and the prompt, with the hero's colour band
 *  behind them. Below it comes the studio feed (Studio/feed-list.tsx) — a
 *  virtualised bento whose scroll view is keyboard-aware for the prompt. */
function HomeTop({
  promptRef,
}: {
  promptRef: React.RefObject<TextInput | null>;
}) {
  /** The prompt card block's position, which places the hero's colour band. */
  const [card, setCard] = React.useState<{ y: number; h: number } | null>(null);
  const focused = useIsFocused();
  const shown = useOnScreen('hero');
  return (
    <View>
      {/* The hero's colour band (white only): scrolls with the hero, clean
          canvas on top, pastel colour rising from the prompt card's middle
          and melting back into the page just below it. */}
      <AmbientBackground
        startY={card ? card.y + card.h * 0.5 : 0}
        height={card ? card.y + card.h + 150 : 0}
        live={focused && shown}
      >
        {card && (
          <ShiftingDots width={W} height={card.y + card.h + 150} zone="hero" />
        )}
      </AmbientBackground>
      <HeroBanner />
      <View
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          setCard((c) =>
            c && c.y === y && c.h === height ? c : { y, h: height }
          );
        }}
      >
        <AgentV2 inputRef={promptRef} />
      </View>
    </View>
  );
}

/** The dotted backdrop: dark's one fixed twinkling grid. (White's header
 *  dots slide with the header — see CollapsingHeader.) */
function HomeBackdrop({ dark, t }: { dark: boolean; t: HomeColors }) {
  const isDark = dark;
  return (
    <>
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
    </>
  );
}

/** Home's status bar: the theme's, light while the black showcase has the
 * chrome. Re-asserted on focus — expo-status-bar screens (the product page)
 * set the native style imperatively, and RN's stack skips a style it thinks
 * is already applied, so coming back could leave a dark bar on dark Home. */
function useHomeStatusBar(t: HomeColors) {
  const chromeBlack = useChromeIsBlack();
  const focused = useIsFocused();
  const barStyle = chromeBlack ? 'light-content' : t.statusBar;
  React.useEffect(() => {
    if (focused) StatusBar.setBarStyle(barStyle, true);
  }, [focused, barStyle]);
  return { focused, barStyle };
}

type Collapse = { hide: SharedValue<number>; max: SharedValue<number> };

/** The header's dots twinkle only while some of the header is on screen. */
function useHeaderDotsLive({ hide, max }: Collapse) {
  useAnimatedReaction(
    () => max.value <= 0 || hide.value < max.value - 0.5,
    (shown, was) => {
      if (shown !== was) runOnJS(setOnScreen)('header', shown);
    }
  );
}

function useCollapse(): Collapse {
  const hide = useSharedValue(0);
  const max = useSharedValue(0);
  return React.useMemo(() => ({ hide, max }), [hide, max]);
}

/**
 * Home's header as a hide-on-scroll overlay (header-collapse.ts drives
 * `hide` from the list's scroll on the UI thread). The header and its dotted
 * band slide up together — no fade — and a solid strip (page colour, black
 * in the showcase via chromeTone) fades in behind the status bar so the
 * feed never shows under the clock.
 */
function CollapsingHeader(p: {
  t: HomeColors;
  dark: boolean;
  collapse: Collapse;
  onHeight: (h: number) => void;
  onMenuPress: () => void;
}) {
  const { hide, max } = p.collapse;
  const insets = useSafeAreaInsets();
  const [h, setH] = React.useState(0);
  const { onHeight } = p;
  React.useEffect(() => {
    max.set(h);
    onHeight(h);
  }, [h, max, onHeight]);
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: -hide.value }],
  }));
  const bg = p.t.bg;
  useHeaderDotsLive(p.collapse);
  const strip = useAnimatedStyle(() => ({
    opacity: max.value > 0 ? Math.min(1, hide.value / (max.value * 0.6)) : 0,
    backgroundColor: interpolateColor(chromeTone.value, [0, 1], [bg, '#000']),
  }));
  return (
    <>
      <Animated.View
        style={[s.header, { backgroundColor: p.t.bg }, slide]}
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
      >
        {!p.dark && h > 0 ? (
          <View pointerEvents="none" style={[s.headerDots, { height: h }]}>
            {/* Only the header's height is drawn (a full-screen field per
                colour was ~190 MB of layers); the grid keeps the
                full-screen layout so the dots sit exactly where they did. */}
            <ShiftingDots width={W} height={h} gridHeight={H} zone="header" />
          </View>
        ) : null}
        <HomeHeader onMenuPress={p.onMenuPress} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[s.strip, { height: insets.top }, strip]}
      />
    </>
  );
}

export function HomeScreen() {
  // Camera/location/notifications permissions are requested once the user
  // actually reaches Home, not during splash/login — asking upfront before
  // the user has any context for why the app wants them was getting ignored
  // more often than granted.
  useAppStartup();

  // The scroll offset is read on the UI thread only (Studio/feed-list.tsx:
  // `useScrollOffset` → chrome tone); the JS scroll event just feeds the
  // live-tile budget.
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [headerH, setHeaderH] = React.useState(0);
  const collapse = useCollapse();

  // The tab bar floats over the scene now, so the scroll has to end above it
  // rather than behind it — see useTabBarHeight.
  const tabBarH = useTabBarHeight();

  const promptRef = React.useRef<TextInput>(null);
  const { focused, barStyle } = useHomeStatusBar(t);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Mounted only while Home is focused, so it is the top entry of
          RN's status-bar stack (other screens' entries stay mounted).
          Light while the black showcase has the header (chromeTone). */}
      {focused ? (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={barStyle}
        />
      ) : null}

      <HomeBackdrop dark={isDark} t={t} />

      <StudioFeed
        top={<HomeTop promptRef={promptRef} />}
        t={t}
        dark={isDark}
        bottomPad={tabBarH}
        viewportH={H - headerH}
        promptRef={promptRef}
        headerH={headerH}
        collapse={collapse}
      />

      {/* The header overlays the list (after it, for z-order) and slides
          away on scroll; the list leaves `headerH` of room above the hero. */}
      <CollapsingHeader
        t={t}
        dark={isDark}
        collapse={collapse}
        onHeight={setHeaderH}
        onMenuPress={() => setDrawerOpen(true)}
      />

      {/* Sliding drawer */}
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  headerDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  root: {
    flex: 1,
  },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  strip: { position: 'absolute', top: 0, left: 0, right: 0 },
});
