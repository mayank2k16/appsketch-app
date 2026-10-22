import type { FlashListRef } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar } from '@/components/ui';
import { ALL_CATEGORIES } from '@/lib/category-route';

import { LiveBudgetContext } from '../Home/Studio/live-budget';
import { StudioContext } from '../Home/Studio/studio-context';
import { BrowsePanel } from './browse-panel';
import { CategoryList } from './category-list';
import { CategorySlider } from './category-slider';
import type { DealRow } from './deal';
import { CategoryEmpty } from './empty-states';
import { SkeletonGrid } from './skeleton';
import { type CatColors, catColors } from './theme';
import { countLine, TitleBlock } from './title-block';
import { TopBar } from './top-bar';
import { useCategoryData } from './use-category-data';
import {
  categoryLive,
  useCategoryNav,
  useLiveWiring,
  useTileActions,
} from './use-category-nav';

/**
 * /category/[name] — one category (or All) as Home's bento, with search,
 * a category slider and a "browse all categories" panel. See
 * docs/template-category-screen.md.
 */

/** The fixed bars: a solid canvas (content never shows through), whose
 *  bottom hairline appears once the feed scrolls under it. */
function Bars({
  c,
  offset,
  top,
  children,
}: {
  c: CatColors;
  offset: SharedValue<number>;
  top: number;
  children: React.ReactNode;
}) {
  const edge = useAnimatedStyle(() => ({
    borderBottomColor: interpolateColor(
      offset.value,
      [0, 24],
      [c.bg, c.hairline]
    ),
  }));
  return (
    <Animated.View
      style={[s.bars, { paddingTop: top + 6, backgroundColor: c.bg }, edge]}
    >
      {children}
    </Animated.View>
  );
}

function useCategoryScreen(name: string) {
  const { colorScheme } = useColorScheme();
  const c = React.useMemo(
    () => catColors(colorScheme === 'dark'),
    [colorScheme]
  );
  const [query, setQuery] = React.useState('');
  const deferred = React.useDeferredValue(query);
  const [panel, setPanel] = React.useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);
  const listRef = React.useRef<FlashListRef<DealRow>>(null);
  const nav = useCategoryNav(name, listRef);
  const data = useCategoryData(nav.category, deferred);
  const actions = useTileActions({ dark: c.dark, deal: data.deal, ...nav });
  useLiveWiring(data.deal);
  // A new search starts at the top of its results.
  React.useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [deferred]);
  const { setCategory } = nav;
  const panelApi = React.useMemo(
    () => ({
      open: () => {
        Keyboard.dismiss();
        setPanel(true);
      },
      close: () => setPanel(false),
      pick: (n: string) => {
        setPanel(false);
        setCategory(n);
      },
    }),
    [setCategory]
  );
  const line = countLine({
    total: data.deal.total,
    of: data.categoryCount,
    query: deferred,
  });
  return {
    c,
    query,
    setQuery,
    panel,
    panelApi,
    data,
    line,
    scrollRef,
    offset,
    listRef,
    nav,
    actions,
  };
}

function Feed({ st }: { st: ScreenState }) {
  const { c, data, nav } = st;
  const name = nav.category;
  const insets = useSafeAreaInsets();
  return (
    <CategoryList
      rows={data.deal.rows}
      header={
        <>
          <TitleBlock c={c} category={name} line={st.line} offset={st.offset} />
          {data.isLoading ? <SkeletonGrid c={c} /> : null}
        </>
      }
      empty={
        <CategoryEmpty
          c={c}
          data={data}
          category={name}
          query={st.query}
          actions={{
            setQuery: st.setQuery,
            setCategory: nav.setCategory,
            back: nav.back,
          }}
        />
      }
      bottomPad={insets.bottom + 24}
      scrollRef={st.scrollRef}
      listRef={st.listRef}
      extraData={st.actions}
    />
  );
}

type ScreenState = ReturnType<typeof useCategoryScreen>;

export function TemplateCategoryScreen({ name: routeName }: { name: string }) {
  const st = useCategoryScreen(routeName);
  const name = st.nav.category;
  const { c, data, nav, panelApi } = st;
  const insets = useSafeAreaInsets();
  const placeholder =
    name === ALL_CATEGORIES ? 'Search all templates' : `Search ${name}`;
  return (
    <LiveBudgetContext.Provider value={categoryLive}>
      <StudioContext.Provider value={st.actions}>
        <View style={[s.root, { backgroundColor: c.bg }]}>
          <FocusAwareStatusBar />
          <Bars c={c} offset={st.offset} top={insets.top}>
            <TopBar
              c={c}
              query={st.query}
              onQuery={st.setQuery}
              placeholder={placeholder}
              onBack={nav.back}
              onBrowse={panelApi.open}
            />
            <CategorySlider
              c={c}
              categories={data.categories}
              category={name}
              onPick={nav.setCategory}
            />
          </Bars>
          <Feed st={st} />
          <BrowsePanel
            c={c}
            open={st.panel}
            onClose={panelApi.close}
            categories={data.categories}
            category={name}
            onPick={panelApi.pick}
          />
        </View>
      </StudioContext.Provider>
    </LiveBudgetContext.Provider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bars: { gap: 10, paddingBottom: 10, borderBottomWidth: 1, zIndex: 2 },
});
