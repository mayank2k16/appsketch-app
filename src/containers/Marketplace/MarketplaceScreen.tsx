import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import { useAppTheme } from '@/lib/theme';
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
  const t = useAppTheme(colorScheme);
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

      {/* Sticky — only the grid below scrolls. */}
      <View style={{ paddingTop: insets.top + 25 }}>
        <View style={s.header}>
          <Text style={[s.eyebrow, { color: t.accent }]}>AI template library</Text>
          <Text style={[s.heading, { color: t.text }]}>Make any template yours with ease</Text>
          <Text style={[s.subtitle, { color: t.textSub }]}>Start from a template and let AI make it yours.</Text>
        </View>

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
      </View>

      {templatesQuery.isLoading ? (
        <FlatList
          data={skeletonData}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => (
            <View style={{ flex: 1, marginHorizontal: 4, marginBottom: 10 }}>
              <TemplateCardSkeleton t={t} isDark={isDark} />
            </View>
          )}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.gridContent}
        />
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <FlatList
            data={templates}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.gridContent}
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
  t: ReturnType<typeof useAppTheme>;
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
      <Text style={[s.chipLabel, { color: active ? '#FFFFFF' : t.templatesChipText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  header: { paddingHorizontal: 20, marginBottom: 16 },
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
  // them never shifts card position/spacing.
  gridContent: { paddingTop: 5, paddingHorizontal: 6, paddingBottom: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: F.sans700, fontSize: 15 },
});
