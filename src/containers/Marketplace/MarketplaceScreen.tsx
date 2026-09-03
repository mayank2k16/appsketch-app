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
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { TemplateListItem } from '@/api/templates';
import { useBrowseTemplates, useTemplateCategories } from '@/api/templates';
import { F } from '@/lib/fonts';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useTabBarHeight } from '@/components/bottom-tabs/useTabBarHeight';
import { useBrandedCoderTheme, type AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

import { TemplateCard } from './components/TemplateCard';
import { TemplateCardSkeleton } from './components/TemplateCardSkeleton';

const ALL = 'all';
const SKELETON_COUNT = 6;
const skeletonData = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

export function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const t = useBrandedCoderTheme(colorScheme);
  // The tab bar floats over the scene, so the grid has to end above it rather
  // than behind it — see useTabBarHeight.
  const tabBarH = useTabBarHeight();
  const isDark = colorScheme === 'dark';

  const [activeCategory, setActiveCategory] = React.useState<string | number>(ALL);
  const [searchInput, setSearchInput] = React.useState('');
  const search = useDebouncedValue(searchInput, 400);

  const categoriesQuery = useTemplateCategories();
  const categories = categoriesQuery.data ?? [];

  const templatesQuery = useBrowseTemplates({
    category: activeCategory === ALL ? undefined : activeCategory,
    search: search || undefined,
  });
  const pages = templatesQuery.data?.pages ?? [];
  const templates = React.useMemo(() => pages.flatMap((p) => p.results), [pages]);
  const count = pages[0]?.count ?? 0;

  const activeCategoryName =
    activeCategory === ALL ? 'All templates' : categories.find((c) => c.id === activeCategory)?.name || 'Templates';

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
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }),
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
      Animated.timing(contentOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [templatesQuery.isLoading, contentOpacity]);

  function handleCustomise() {
    toast.success('Template customisation is coming soon.');
  }

  function handleUse(template: TemplateListItem) {
    // Navigate immediately — the create-tenant-from-template call (~4-7s)
    // runs on the destination screen instead of blocking this tap on a
    // spinner. See AppPreviewScreen's "creating" phase.
    router.push({
      pathname: '/app-preview',
      params: { templateId: String(template.id), name: template.name },
    } as never);
  }

  const renderItem = React.useCallback(
    ({ item }: { item: TemplateListItem }) => (
      <View style={{ flex: 1, marginHorizontal: 4, marginBottom: 10 }}>
        <TemplateCard
          t={t}
          isDark={isDark}
          template={item}
          onCustomise={handleCustomise}
          onUse={() => handleUse(item)}
        />
      </View>
    ),
    [t, isDark]
  );

  const listHeader = (
    <>
      <View onLayout={handleHeadingsLayout}>
        <View style={s.header}>
          {/* Was the old brand indigo typed straight into the style, where no
              palette swap could reach it. On the token now, so it follows the
              ramp with everything else. */}
          <Text style={[s.eyebrow, { color: t.tagText }]}>AI template library</Text>
          <Text style={[s.heading, { color: t.text }]}>Make any template yours with ease</Text>
          <Text style={[s.subtitle, { color: t.textSub }]}>Start from a template and let AI make it yours.</Text>
        </View>
      </View>
      <View style={{ height: stickyGroupHeight + 5 }} />
    </>
  );

  const commonListProps = {
    ListHeaderComponent: listHeader,
    numColumns: 2 as const,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: [
      s.gridContent,
      { paddingTop: HEADER_TOP, paddingBottom: tabBarH + 14 },
    ],
    onScroll,
    scrollEventThrottle: 16,
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      {/* Fixed ambient wash the glass cards blur through as the grid scrolls
          past it — same concentric-circle blur stand-in AgentV2 uses (RN has
          no shape-blur primitive), reusing the same gradient family. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[s.blob, { top: 60, left: -70, backgroundColor: t.agentSendGradient[0], opacity: isDark ? 0.16 : 0.10 }]} />
        <View style={[s.blob, { top: 220, right: -80, backgroundColor: t.agentSendGradient[1], opacity: isDark ? 0.14 : 0.09 }]} />
      </View>

      {/* Headings scroll away; search/pills/result-row are the sticky overlay below. */}
      {templatesQuery.isLoading ? (
        <Animated.FlatList
          {...commonListProps}
          data={skeletonData}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => (
            <View style={{ flex: 1, marginHorizontal: 4, marginBottom: 10 }}>
              <TemplateCardSkeleton t={t} isDark={isDark} />
            </View>
          )}
          style={{ flex: 1 }}
        />
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <Animated.FlatList
            {...commonListProps}
            data={templates}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={[s.emptyTitle, { color: t.text }]}>No templates found</Text>
                <Text style={{ color: t.textSub, fontSize: 12.5, marginTop: 4 }}>Try a different category or search term.</Text>
              </View>
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (templatesQuery.hasNextPage && !templatesQuery.isFetchingNextPage) {
                templatesQuery.fetchNextPage();
              }
            }}
            ListFooterComponent={
              templatesQuery.isFetchingNextPage ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={t.accent} />
                </View>
              ) : null
            }
          />
        </Animated.View>
      )}

      {/* Permanently masks the safe-area margin above the sticky bar — once
          scrolled far enough, grid rows reach that strip and would otherwise
          show through it, since the FlatList spans the full screen behind it. */}
      <View pointerEvents="none" style={[s.topMask, { height: HEADER_TOP, backgroundColor: t.bg }]} />

      <Animated.View
        onLayout={handleStickyLayout}
        style={[
          s.stickyOverlay,
          {
            top: HEADER_TOP,
            backgroundColor: t.bg,
            borderBottomColor: t.border,
            shadowOpacity: isDark ? 0.3 : 0.08,
            transform: [{ translateY: stickyTranslateY }],
          },
        ]}
      >
        <View style={[s.searchWrap, { backgroundColor: t.card, borderColor: t.border }]}>
          <Ionicons name="search" size={16} color={t.textMuted} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search by name, description or tag…"
            placeholderTextColor={t.textMuted}
            style={[s.searchInput, { color: t.text }]}
            returnKeyType="search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipScrollContent}>
          <CategoryChip label="All templates" active={activeCategory === ALL} t={t} onPress={() => setActiveCategory(ALL)} />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              t={t}
              onPress={() => setActiveCategory(cat.id)}
            />
          ))}
        </ScrollView>

        <View style={s.resultRow}>
          <Text style={[s.resultName, { color: t.text }]}>{activeCategoryName}</Text>
          {!templatesQuery.isLoading && (
            <View style={s.resultCountRow}>
              {templatesQuery.isFetching && <ActivityIndicator size="small" color={t.textMuted} style={{ marginRight: 6 }} />}
              <Text style={[s.resultCount, { color: t.textMuted }]}>{count} templates</Text>
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
  t,
  onPress,
}: {
  label: string;
  active: boolean;
  t: AppColors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        s.chip,
        { backgroundColor: t.templatesChipBg, borderColor: t.templatesChipBorder },
        active && { backgroundColor: t.accent, borderColor: t.accent },
      ]}
    >
      <Text style={[s.chipLabel, { color: active ? t.accentOn : t.templatesChipText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  header: { paddingHorizontal: 10, paddingTop: 18, marginBottom: 16, width: '90%' },
  eyebrow: { fontFamily: F.sans700, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  heading: { fontFamily: F.display900, fontSize: 22, letterSpacing: -0.4, lineHeight: 27, marginBottom: 6 },
  subtitle: { fontFamily: F.sans400, fontSize: 13, lineHeight: 19 },
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
  searchInput: { flex: 1, fontFamily: F.sans400, fontSize: 13.5, height: '100%' },
  chipScroll: { flexGrow: 0, marginBottom: 14 },
  chipScrollContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
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
  resultCount: { fontFamily: F.sans500, fontSize: 11.5 },
  // Shared by both the skeleton grid and the real grid so swapping between
  // them never shifts card position/spacing. The 5px top gap that used to
  // live here is now baked into the ListHeaderComponent spacer instead.
  gridContent: { paddingHorizontal: 6, paddingBottom: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
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
