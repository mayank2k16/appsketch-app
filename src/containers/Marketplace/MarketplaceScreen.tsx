/* eslint-disable unicorn/filename-case, max-lines-per-function --
   Pre-existing: predates the kebab-case rule, and the sticky-header scroll
   math plus the grid for the whole screen doesn't split cleanly. */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  type LayoutChangeEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MarketKind } from '@/api/templates';
import { useMarketTemplates, useTemplateCategories } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { useCloneAndOpen } from '@/containers/TemplateProduct/use-use-template';
import { F } from '@/lib/fonts';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { TwinkleStars } from './components/TwinkleStars';
import { GalleryCard, GallerySkeleton } from './gallery/gallery-card';
import { type Block, type Placed, toBlocks } from './gallery/masonry';
import { type GalleryTheme, galleryTheme, MONO } from './gallery/theme';
import { useTemplatePreview } from './use-template-preview';

const ALL = 'all';
const KINDS: { kind: MarketKind; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'apps', label: 'Apps' },
  { kind: 'websites', label: 'Websites' },
  { kind: 'ecosystems', label: 'Ecosystems' },
];

/** The grid runs almost to the screen's edges, as on the web. */
const OUTER = 10;
const COL_GAP = 8;
const skeletonData = [0];

export function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  // appsketch.ai/templates' own colours: white, or its black theme.
  const g = galleryTheme(isDark);
  const { width: winW, height: winH } = useWindowDimensions();
  const fullW = winW - 2 * OUTER;
  const colW = (fullW - COL_GAP) / 2;
  // A pushed screen now (Pricing took its tab), so the grid only clears the
  // home indicator, not a tab bar.
  const bottomPad = Math.max(insets.bottom, 16);

  const [activeCategory, setActiveCategory] = React.useState<string | number>(
    ALL
  );
  const [kind, setKind] = React.useState<MarketKind>('all');
  const [searchInput, setSearchInput] = React.useState('');
  const search = useDebouncedValue(searchInput, 400);

  const categoriesQuery = useTemplateCategories();
  const categories = categoriesQuery.data ?? [];

  // The same two sources as appsketch.ai/templates: published apps (mobile
  // apps, websites, ecosystems) and the legacy layout sites.
  const templatesQuery = useMarketTemplates({
    kind,
    categoryId: activeCategory === ALL ? undefined : activeCategory,
    categoryName:
      activeCategory === ALL
        ? undefined
        : categories.find((c) => c.id === activeCategory)?.name,
    search: search || undefined,
  });
  const pages = React.useMemo(
    () => templatesQuery.data?.pages ?? [],
    [templatesQuery.data]
  );
  const templates = React.useMemo(() => pages.flatMap((p) => p.items), [pages]);
  const count = pages[0]?.count ?? 0;
  // The web gallery's masonry: phone apps tall, every 5th website a feature.
  const blocks = React.useMemo(() => toBlocks(templates), [templates]);

  const activeCategoryName =
    activeCategory === ALL
      ? 'All templates'
      : categories.find((c) => c.id === activeCategory)?.name || 'Templates';

  // Headings scroll away normally; the search/pills/result-row group is an
  // absolutely-positioned overlay that rides up with the headings until they
  // fully scroll past, then pins at HEADER_TOP. The FlatList reserves a
  // matching spacer (see `listHeader`) so grid rows line up with the overlay
  // at every scroll position.
  //
  // useNativeDriver is deliberately false here: on this app's New
  // Architecture (Fabric) build, a native-driven scroll value's
  // .interpolate() output never actually updated (confirmed by listening to
  // both — the raw scroll value ticked fine, the interpolated one never
  // fired), so the overlay stayed frozen at its mount-time position. JS-driven
  // updates go through the normal render path instead and are reliable.
  const HEADER_TOP = insets.top + 25;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [headingsHeight, setHeadingsHeight] = React.useState(90);
  const [stickyGroupHeight, setStickyGroupHeight] = React.useState(150);

  const onScroll = React.useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY]
  );

  // `extrapolateLeft: 'extend'` is what keeps the headings out from under the
  // search bar during an overscroll bounce. Clamped on both ends, a pull-down
  // (scrollY < 0) pinned the overlay at HEADER_TOP + headingsHeight while the
  // list content kept travelling down — so the heading slid beneath it.
  // Extending on the left lets the overlay ride down by exactly the overscroll
  // distance, holding its position relative to the content. The right end
  // stays clamped: that is the sticky behaviour itself.
  const stickyTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(headingsHeight, 1)],
    outputRange: [headingsHeight, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const handleHeadingsLayout = React.useCallback((e: LayoutChangeEvent) => {
    setHeadingsHeight(e.nativeEvent.layout.height);
  }, []);

  const handleStickyLayout = React.useCallback((e: LayoutChangeEvent) => {
    setStickyGroupHeight(e.nativeEvent.layout.height);
  }, []);

  // A scroll during the brief skeleton phase shouldn't leave the real grid's
  // sticky bar mis-positioned once it mounts at offset 0.
  React.useEffect(() => {
    if (!templatesQuery.isLoading) scrollY.setValue(0);
  }, [templatesQuery.isLoading, scrollY]);

  // Crossfades the grid in once the very first load resolves — after that,
  // `keepPreviousData` (see useBrowseTemplates) keeps the same FlatList
  // mounted across category/search changes, so this only fires once.
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!templatesQuery.isLoading) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [templatesQuery.isLoading, contentOpacity]);

  // Shared with Home's template carousel, so both open a template the same way.
  const handlePreview = useTemplatePreview();
  // "Use app", as on the web gallery: copy the template into the user's
  // account (an ecosystem copies every app in it), then open the builder on
  // the copy with its preview — shared with the template page.
  const { use: handleUse, usingKey } = useCloneAndOpen();

  const renderCard = (card: Placed, width: number) => (
    <GalleryCard
      key={card.template.key}
      g={g}
      template={card.template}
      shape={card.shape}
      width={width}
      index={card.index}
      onPreview={() => handlePreview(card.template)}
      onUse={() => handleUse(card.template)}
      using={usingKey === card.template.key}
    />
  );

  const renderItem = ({ item }: { item: Block }) =>
    item.type === 'wide' ? (
      renderCard(item.card, fullW)
    ) : (
      <View style={s.cols}>
        <View style={{ width: colW }}>
          {item.left.map((c) => renderCard(c, colW))}
        </View>
        <View style={{ width: colW }}>
          {item.right.map((c) => renderCard(c, colW))}
        </View>
      </View>
    );

  const listHeader = (
    <>
      <View onLayout={handleHeadingsLayout}>
        <PressableScale
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
          hitSlop={8}
          accessibilityLabel="Back"
          style={[s.backBtn, { borderColor: g.line, backgroundColor: g.panel }]}
        >
          <Ionicons name="chevron-back" size={19} color={g.ink} />
        </PressableScale>
        {/* The web gallery's hero, in its words. */}
        <View style={s.header}>
          <View style={s.eyebrowRow}>
            <View style={[s.eyebrowDot, { backgroundColor: g.orange }]} />
            <Text style={[s.eyebrow, { color: g.muted }]}>
              AppSketch templates
            </Text>
          </View>
          <Text style={[s.heading, { color: g.ink }]}>
            Start from something{' '}
            <Text style={{ color: g.orange }}>extraordinary</Text>
          </Text>
          <Text style={[s.subtitle, { color: g.muted }]}>
            Launch-ready apps and layouts. Try any of them, then let AI make it
            yours.
          </Text>
        </View>
        <PressableScale
          onPress={() => router.push('/scan')}
          hitSlop={8}
          accessibilityLabel="Scan an app QR code"
          style={[s.scanBtn, { borderColor: g.line, backgroundColor: g.panel }]}
        >
          <Ionicons name="qr-code-outline" size={18} color={g.ink} />
        </PressableScale>
      </View>
      <View style={{ height: stickyGroupHeight + 5 }} />
    </>
  );

  const commonListProps = {
    ListHeaderComponent: listHeader,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: [
      s.gridContent,
      { paddingTop: HEADER_TOP, paddingBottom: bottomPad + 14 },
    ],
    onScroll,
    scrollEventThrottle: 16,
  };

  return (
    <View style={[s.root, { backgroundColor: g.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={g.statusBar}
      />

      {/* A scattered, twinkling starfield the glass cards float over as the
          grid scrolls — replaces the old pair of blurred brand-colour
          circles, which read as a plain wash rather than something alive. */}
      <TwinkleStars
        width={winW}
        height={winH}
        color={g.faint}
        count={isDark ? 110 : 50}
        halos={isDark}
      />

      {/* Headings scroll away; search/pills/result-row are the sticky overlay below. */}
      {templatesQuery.isLoading ? (
        <Animated.FlatList
          {...commonListProps}
          data={skeletonData}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => (
            <>
              <GallerySkeleton g={g} width={fullW} shape="" />
              <View style={s.cols}>
                <View style={{ width: colW }}>
                  <GallerySkeleton g={g} width={colW} shape="tall" />
                  <GallerySkeleton g={g} width={colW} shape="" />
                </View>
                <View style={{ width: colW }}>
                  <GallerySkeleton g={g} width={colW} shape="" />
                  <GallerySkeleton g={g} width={colW} shape="" />
                  <GallerySkeleton g={g} width={colW} shape="" />
                </View>
              </View>
            </>
          )}
          style={{ flex: 1 }}
        />
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <Animated.FlatList
            {...commonListProps}
            data={blocks}
            keyExtractor={(item) => item.key}
            extraData={usingKey}
            renderItem={renderItem}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={[s.emptyTitle, { color: g.ink }]}>
                  No templates found
                </Text>
                <Text style={{ color: g.muted, fontSize: 12.5, marginTop: 4 }}>
                  Try a different category or search term.
                </Text>
              </View>
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (
                templatesQuery.hasNextPage &&
                !templatesQuery.isFetchingNextPage
              ) {
                templatesQuery.fetchNextPage();
              }
            }}
            ListFooterComponent={
              templatesQuery.isFetchingNextPage ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={g.orange} />
                </View>
              ) : null
            }
          />
        </Animated.View>
      )}

      {/* Permanently masks the safe-area margin above the sticky bar — once
          scrolled far enough, grid rows reach that strip and would otherwise
          show through it, since the FlatList spans the full screen behind it. */}
      <View
        pointerEvents="none"
        style={[s.topMask, { height: HEADER_TOP, backgroundColor: g.bg }]}
      />

      <Animated.View
        onLayout={handleStickyLayout}
        style={[
          s.stickyOverlay,
          {
            top: HEADER_TOP,
            backgroundColor: g.bg,
            borderBottomColor: g.line,
            // White is flat: the hairline under the bar is the only edge.
            shadowOpacity: isDark ? 0.3 : 0,
            elevation: isDark ? 6 : 0,
            transform: [{ translateY: stickyTranslateY }],
          },
        ]}
      >
        <View
          style={[
            s.searchWrap,
            { backgroundColor: g.panel, borderColor: g.line },
          ]}
        >
          <Ionicons name="search" size={16} color={g.faint} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search by name, description or tag…"
            placeholderTextColor={g.faint}
            style={[s.searchInput, { color: g.ink }]}
            returnKeyType="search"
          />
        </View>

        <View style={s.kindRow}>
          {KINDS.map((k) => {
            const active = kind === k.kind;
            return (
              <PressableScale
                key={k.kind}
                onPress={() => setKind(k.kind)}
                style={[
                  s.kindTab,
                  { backgroundColor: g.panel, borderColor: g.line },
                  active && {
                    backgroundColor: g.activeFill,
                    borderColor: g.activeFill,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.kindLabel, { color: active ? '#fff' : g.ink }]}>
                  {k.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipScroll}
          contentContainerStyle={s.chipScrollContent}
        >
          <CategoryChip
            label="All templates"
            active={activeCategory === ALL}
            g={g}
            onPress={() => setActiveCategory(ALL)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              g={g}
              onPress={() => setActiveCategory(cat.id)}
            />
          ))}
        </ScrollView>

        <View style={s.resultRow}>
          <Text style={[s.resultName, { color: g.ink }]}>
            {activeCategoryName}
          </Text>
          {!templatesQuery.isLoading && (
            <View style={s.resultCountRow}>
              {templatesQuery.isFetching && (
                <ActivityIndicator
                  size="small"
                  color={g.faint}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={[s.resultCount, { color: g.faint }]}>
                {count} templates
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

function CategoryChip({
  label,
  active,
  g,
  onPress,
}: {
  label: string;
  active: boolean;
  g: GalleryTheme;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[
        s.chip,
        {
          backgroundColor: g.panel,
          borderColor: g.line,
        },
        active && { backgroundColor: g.activeFill, borderColor: g.activeFill },
      ]}
    >
      <Text style={[s.chipLabel, { color: active ? '#fff' : g.ink }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  kindRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  kindTab: {
    paddingHorizontal: 13,
    height: 30,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  kindLabel: { fontFamily: F.sans600, fontSize: 12.5 },
  cols: { flexDirection: 'row', justifyContent: 'space-between' },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  backBtn: {
    marginTop: 18,
    marginLeft: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 14,
    marginBottom: 16,
    width: '90%',
  },
  eyebrow: {
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: F.display900,
    fontSize: 27,
    letterSpacing: -0.9,
    lineHeight: 31,
    marginBottom: 8,
  },
  subtitle: { fontFamily: F.sans400, fontSize: 13, lineHeight: 19 },
  scanBtn: {
    position: 'absolute',
    top: 18,
    right: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 44,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.sans400,
    fontSize: 13.5,
    height: '100%',
  },
  chipScroll: { flexGrow: 0, marginBottom: 14 },
  chipScrollContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipLabel: { fontFamily: F.sans600, fontSize: 12.5 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  resultName: { fontFamily: F.sans700, fontSize: 14.5 },
  resultCountRow: { flexDirection: 'row', alignItems: 'center' },
  resultCount: {
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  // Shared by both the skeleton grid and the real grid so swapping between
  // them never shifts card position/spacing. The 5px top gap that used to
  // live here is now baked into the ListHeaderComponent spacer instead.
  gridContent: { paddingHorizontal: OUTER, paddingBottom: 14 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontFamily: F.sans700, fontSize: 15 },
  topMask: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9 },
  stickyOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 2,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
});
