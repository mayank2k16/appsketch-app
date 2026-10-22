import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MarketTemplate } from '@/api/templates';
import { thumbOf, titleOf } from '@/containers/Home/TemplateReel/layout';
import { openCategory } from '@/lib/category-route';
import {
  clearPendingTemplate,
  type PendingTemplate,
} from '@/lib/template-transition';

import { BreadCrumbs } from './bread-crumbs';
import { DetailsBox } from './details-box';
import { type Geometry, pageGeometry } from './geometry';
import { GrowOverlay } from './grow-overlay';
import { HeroCard, heroRectOf } from './hero-card';
import { HeroChrome } from './hero-chrome';
import { type Device, liveUrlOf } from './live-url';
import { MoreSheet } from './more-sheet';
import { ProductFallback } from './not-found';
import { PageBackdrop } from './page-backdrop';
import { pageTheme } from './theme';
import { usePageActive } from './use-page-active';
import { usePager } from './use-pager';
import {
  type ProductMotion,
  useProductTransition,
} from './use-product-transition';
import { type Group, useResolvedTemplate } from './use-resolved-template';

/**
 * The template product page (docs/template-product-page.md): two stacked
 * panels — the template's LIVE site on the top ~75% (Mobile | Tablet |
 * Desktop), its details and CTAs in a box below — and a left/right swipe
 * through the rest of its list. Opened from a tile via `openTemplate()`
 * (grows out of the tile) or cold by route (fades up).
 */
export function TemplateProductScreen({
  templateKey,
}: {
  templateKey: string;
}) {
  const resolved = useResolvedTemplate(templateKey);
  if (resolved.state !== 'ready') {
    return <ProductFallback loading={resolved.state === 'loading'} />;
  }
  return (
    <ProductPage
      templateKey={templateKey}
      entry={resolved.entry}
      fromTile={resolved.fromTile && !!resolved.entry.rect}
      list={resolved.list}
      start={resolved.start}
      groups={resolved.groups}
    />
  );
}

type PageProps = {
  templateKey: string;
  entry: PendingTemplate;
  fromTile: boolean;
  list: readonly MarketTemplate[];
  start: number;
  groups: readonly Group[];
};

function usePageBasics() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const g = React.useMemo(
    () => pageGeometry(W, H, { top: insets.top, bottom: insets.bottom }),
    [W, H, insets.top, insets.bottom]
  );
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return { g, dark, t: pageTheme(dark), active: usePageActive() };
}

/** Which templates' live sites have rendered (the LIVE badge shows for
 *  the centred one; a warm neighbour may be live too). */
function useLiveKeys() {
  const [live, setLive] = React.useState<ReadonlySet<string>>(new Set());
  const onLive = React.useCallback((key: string, on: boolean) => {
    setLive((prev) => {
      if (prev.has(key) === on) return prev;
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);
  return { live, onLive };
}

/** Wait before warming neighbours when the centred page never goes live
 *  (no live site, or a cold app still starting). */
const WARM_FALLBACK_MS = 2500;

/**
 * The page whose neighbours may preload their live sites: the centred page
 * once its own site is up (it goes first), or after WARM_FALLBACK_MS.
 * Neighbours' screenshots are prefetched at once (apps show only that).
 */
function useWarmNeighbours(
  list: readonly MarketTemplate[],
  index: number,
  currentLive: boolean
) {
  const [warmFor, setWarmFor] = React.useState(-1);
  React.useEffect(() => {
    for (const i of [index + 1, index - 1]) {
      const uri = list[i] ? thumbOf(list[i]) : '';
      if (uri) void Image.prefetch(uri, 'memory-disk');
    }
  }, [list, index]);
  React.useEffect(() => {
    if (currentLive) {
      setWarmFor(index);
      return;
    }
    const t = setTimeout(() => setWarmFor(index), WARM_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [index, currentLive]);
  return warmFor === index;
}

/** Page-wide choices: the device the live sites render at (Desktop first)
 *  and the template whose "More" card is open. */
function useChoices() {
  const [device, setDevice] = React.useState<Device>('desktop');
  const [more, setMore] = React.useState<MarketTemplate | null>(null);
  const closeMore = React.useCallback(() => setMore(null), []);
  return { device, setDevice, more, setMore, closeMore };
}

function usePageState(p: PageProps) {
  const [{ list, start, groups }] = React.useState(() => ({
    list: p.list,
    start: p.start,
    groups: p.groups,
  }));
  const basics = usePageBasics();
  const keyRef = React.useRef(list[start].key);
  const currentKey = React.useCallback(() => keyRef.current, []);
  const motion = useProductTransition({
    templateKey: p.templateKey,
    fromTile: p.fromTile,
    currentKey,
  });
  const pager = usePager({
    start,
    count: list.length,
    g: basics.g,
    m: motion.m,
    ready: motion.landed,
    onClose: motion.close,
  });
  keyRef.current = list[pager.index].key;
  const choices = useChoices();
  const lives = useLiveKeys();
  // Neighbours warm around the SETTLED page: nothing mounts or unmounts a
  // WebView while a swipe's spring is still running (a WebView's creation
  // blocks the main thread for a frame or two).
  const warm = useWarmNeighbours(
    list,
    pager.settled,
    lives.live.has(list[pager.settled].key)
  );
  const nav = useCrumbNav(p.templateKey);
  return {
    list,
    groups,
    ...basics,
    ...motion,
    ...pager,
    ...lives,
    warm,
    ...choices,
    nav,
    placeOf: (i: number) => {
      const gr = groupOf(groups, i);
      return { n: i - gr.start + 1, of: gr.size };
    },
  };
}

type State = ReturnType<typeof usePageState>;

/** The breadcrumb's links. "Templates" pops back to Home; a category
 *  replaces this page with its screen (back from there returns to where
 *  the page was opened from, never to this page again). */
function useCrumbNav(templateKey: string) {
  const router = useRouter();
  return React.useMemo(
    () => ({
      home: () => {
        clearPendingTemplate(templateKey);
        router.dismissTo('/home' as never);
      },
      category: (name: string) => {
        clearPendingTemplate(templateKey);
        if (router.canGoBack()) router.back();
        openCategory(router, name);
      },
    }),
    [router, templateKey]
  );
}

/** Page i's category run in the swipe list. */
function groupOf(groups: readonly Group[], i: number): Group {
  for (const gr of groups)
    if (i >= gr.start && i < gr.start + gr.size) return gr;
  return { name: null, start: 0, size: 1 };
}

/** The pages around the centred one — and, while a swipe is still
 *  landing, around the page it left too, so nothing unmounts mid-spring. */
function windowOf(
  list: readonly MarketTemplate[],
  index: number,
  settled = index
) {
  const out: { template: MarketTemplate; i: number }[] = [];
  for (
    let i = Math.max(0, Math.min(index, settled) - 1);
    i <= Math.min(list.length - 1, Math.max(index, settled) + 1);
    i++
  ) {
    out.push({ template: list[i], i });
  }
  return out;
}

/** The centred page is live; a neighbour of the settled page preloads once
 *  that one is up (`warm`), or stays loaded if it already rendered
 *  (swiping back). While a swipe lands, only WebViews that already exist
 *  stay; a page that had none gets its own once the swipe has settled. */
function loadOf(st: State, key: string, i: number) {
  const mounted =
    st.live.has(key) || (st.warm && Math.abs(i - st.settled) <= 1);
  if (i === st.index) {
    return st.settled === i || mounted ? ('on' as const) : ('off' as const);
  }
  return mounted ? ('warm' as const) : ('off' as const);
}

/** The hero band as a whole: rises / fades on cold opens and when closing
 *  on another template, and follows a pull-down. */
function useZoneStyle(m: ProductMotion, g: Geometry) {
  return useAnimatedStyle(() => {
    const solo = m.solo.value;
    const r = m.reveal.value;
    const pull = 1 - Math.min(m.drag.value / g.H, 1) * 0.25;
    return {
      opacity: solo ? r : 1,
      transform: [
        { translateY: m.drag.value + solo * (1 - r) * 24 },
        { scale: (solo ? 0.94 + 0.06 * r : 1) * pull },
      ],
    };
  });
}

function Heroes({ s: st, origin }: { s: State; origin: string | null }) {
  const pages = windowOf(st.list, st.index, st.settled);
  const zone = useZoneStyle(st.m, st.g);
  return (
    <GestureDetector gesture={st.gestures.hero}>
      <Animated.View
        style={[
          s.zone,
          { height: st.g.heroTall.y + st.g.heroTall.height },
          zone,
        ]}
      >
        {pages.map(({ template, i }) => (
          <HeroCard
            key={template.key}
            template={template}
            i={i}
            x={st.x}
            g={st.g}
            m={st.m}
            origin={template.key === origin}
            load={loadOf(st, template.key, i)}
            active={st.active}
            dark={st.dark}
            edge={st.t.frame}
            device={st.device}
            onLive={st.onLive}
          />
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

/** True from the first page change on (the "Swipe" cue then goes). */
function useSwiped(index: number) {
  const [first] = React.useState(index);
  const [swiped, setSwiped] = React.useState(false);
  if (!swiped && index !== first) setSwiped(true);
  return swiped;
}

function Overlays({ s: st, p }: { s: State; p: PageProps }) {
  const current = st.list[st.index];
  return (
    <>
      {p.fromTile && p.entry.rect ? (
        <GrowOverlay
          seed={p.entry.template.key}
          dark={st.dark}
          dots={!!liveUrlOf(p.entry.template)}
          rect={p.entry.rect}
          to={heroRectOf(p.entry.template, st.g)}
          m={st.m}
        />
      ) : null}
      <HeroChrome
        g={st.g}
        m={st.m}
        t={st.t}
        dark={st.dark}
        onClose={st.close}
        live={st.live.has(current.key)}
        active={st.active}
        x={st.x}
        index={st.index}
        device={liveUrlOf(current) ? st.device : null}
        onDevice={st.setDevice}
      />
      <BreadCrumbs
        g={st.g}
        m={st.m}
        t={st.t}
        category={groupOf(st.groups, st.index).name}
        name={titleOf(current)}
        onHome={st.nav.home}
        onCategory={st.nav.category}
      />
      <MoreSheet
        template={st.more}
        g={st.g}
        t={st.t}
        dark={st.dark}
        onClose={st.closeMore}
      />
    </>
  );
}

function ProductPage(p: PageProps) {
  const st = usePageState(p);
  const { m } = st;
  const bg = useAnimatedStyle(() => ({ opacity: m.reveal.value }));
  const swiped = useSwiped(st.index);
  return (
    <Animated.View style={s.root}>
      <StatusBar style={st.dark ? 'light' : 'dark'} />
      <Animated.View style={[StyleSheet.absoluteFill, bg]}>
        <PageBackdrop
          pages={windowOf(st.list, st.index)}
          x={st.x}
          dark={st.dark}
          base={st.t.page}
        />
      </Animated.View>
      <Heroes s={st} origin={p.fromTile ? p.templateKey : null} />
      <DetailsBox
        pages={windowOf(st.list, st.index)}
        index={st.index}
        placeOf={st.placeOf}
        swiped={swiped}
        x={st.x}
        g={st.g}
        m={m}
        t={st.t}
        dark={st.dark}
        gesture={st.gestures.details}
        onMore={st.setMore}
      />
      <Overlays s={st} p={p} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  zone: { position: 'absolute', top: 0, left: 0, right: 0 },
});
