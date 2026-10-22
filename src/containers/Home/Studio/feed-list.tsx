import { FlashList, type FlashListRef } from '@shopify/flash-list';
import * as React from 'react';
import {
  type ScrollViewProps,
  StyleSheet,
  type TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import type Animated from 'react-native-reanimated';
import {
  type AnimatedRef,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';

import { useHeaderCollapse } from '../header-collapse';
import { setOnScreen } from '../on-screen';
import type { HomeColors } from '../theme/HomeTheme';
import { useChromeDriver } from './chrome-driver';
import { COL_W, GAP, PAD, TALL } from './geometry';
import { liveBudget } from './live-budget';
import type { FeedItem } from './recipes';
import { RowView } from './rows';
import { Showcase } from './showcase';
import { type StudioActions, StudioContext } from './studio-context';
import { StudioHead } from './studio-head';
import { type StudioState, useStudio } from './use-studio';

/**
 * Home's scroll: a virtualised FlashList (v2) whose header is the hero +
 * prompt + studio head, and whose items are the bento rows (one recipe per
 * item, recycled by recipe type). The scroll component is the keyboard-aware
 * scroll view, so the prompt still lifts above the keyboard. One animated ref
 * on it gives the UI-thread scroll offset that drives the chrome tone; the
 * JS scroll event only feeds the live-tile budget (a cheap check).
 */

type Scroller = AnimatedRef<Animated.ScrollView>;

/** The keyboard-aware scroll view, ref'd by both FlashList (`ref`) and
 *  Reanimated (`scrollRef`, for the UI-thread offset). */
const HomeScroller = React.forwardRef<
  unknown,
  ScrollViewProps & { scrollRef: Scroller }
>(function HomeScroller({ scrollRef, ...props }, ref) {
  const setRef = React.useCallback(
    (node: Animated.ScrollView | null) => {
      scrollRef(node as never);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref, scrollRef]
  );
  return (
    <KeyboardAwareScrollView
      {...props}
      ref={setRef as never}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    />
  );
});

function useScrollComponent(animatedRef: Scroller) {
  return React.useCallback(
    (props: ScrollViewProps) => (
      <HomeScroller {...props} scrollRef={animatedRef} />
    ),
    [animatedRef]
  );
}

function useActions(
  studio: StudioState,
  dark: boolean,
  refs: {
    list: React.RefObject<FlashListRef<FeedItem> | null>;
    prompt: React.RefObject<TextInput | null>;
    railY: React.RefObject<number>;
    offset: { value: number };
    showHeader: () => void;
  }
): StudioActions {
  const { setCategory: set, feed } = studio;
  return React.useMemo(
    () => ({
      dark,
      list: feed.order,
      setCategory: (name: string) => {
        set(name);
        // From deep in the feed, bring the rail (and the new deal) into view.
        const y = refs.railY.current;
        if (refs.offset.value > y) {
          refs.list.current?.scrollToOffset({ offset: y, animated: true });
        }
      },
      create: () => {
        refs.showHeader();
        refs.list.current?.scrollToOffset({ offset: 0, animated: true });
        setTimeout(() => refs.prompt.current?.focus(), 450);
      },
    }),
    [dark, feed.order, set, refs]
  );
}

function Skeleton({ dark }: { dark: boolean }) {
  const c = dark ? '#151517' : '#EFEFEC';
  return (
    <View style={s.ghostRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.ghost, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

const renderItem = ({ item, index }: { item: FeedItem; index: number }) =>
  item.kind === 'row' ? (
    <RowView item={item} index={index} />
  ) : (
    <Showcase blocks={item.blocks} h={item.h} />
  );

const keyOf = (item: FeedItem) => item.key;
const typeOf = (item: FeedItem) =>
  item.kind === 'row' ? item.recipe : 'showcase';

type Props = {
  top: React.ReactElement;
  t: HomeColors;
  dark: boolean;
  bottomPad: number;
  viewportH: number;
  promptRef: React.RefObject<TextInput | null>;
  /** The header overlays the list: this much space is left above the
   *  hero, and the header slides away by `hide` (0…`max`) on scroll. */
  headerH: number;
  collapse: { hide: SharedValue<number>; max: SharedValue<number> };
};

export function StudioFeed(props: Props) {
  const { top, t, dark, bottomPad, viewportH, promptRef } = props;
  const studio = useStudio();
  const animatedRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(animatedRef);
  const listRef = React.useRef<FlashListRef<FeedItem>>(null);
  const railY = React.useRef(0);
  const sv = useFeedLayout(studio, { viewportH, bottomPad }, offset);
  const header = useHeaderCollapse({
    offset,
    from: sv.listTop,
    ...props.collapse,
  });
  const refs = React.useMemo(
    () => ({
      list: listRef,
      prompt: promptRef,
      railY,
      offset,
      showHeader: header.show,
    }),
    [promptRef, offset, header.show]
  );
  const actions = useActions(studio, dark, refs);
  const Scroll = useScrollComponent(animatedRef);

  const listHeader = (
    <View>
      <View style={{ height: props.headerH }} />
      <FeedTop setTop={sv.setTop}>
        {top}
        <View onLayout={(e) => (railY.current = e.nativeEvent.layout.y)}>
          <StudioHead
            t={t}
            dark={dark}
            categories={studio.categories}
            category={studio.category}
            onPick={actions.setCategory}
          />
        </View>
        {studio.isLoading ? <Skeleton dark={dark} /> : null}
      </FeedTop>
    </View>
  );

  return (
    <StudioContext.Provider value={actions}>
      <FlashList
        ref={listRef}
        data={studio.feed.items}
        renderItem={renderItem}
        keyExtractor={keyOf}
        getItemType={typeOf}
        ListHeaderComponent={listHeader}
        renderScrollComponent={Scroll as never}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        drawDistance={TALL * 2}
        extraData={actions}
        onScroll={(e) => liveBudget.onScroll(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={header.snap}
        onMomentumScrollEnd={header.snap}
      />
    </StudioContext.Provider>
  );
}

type Geometry = {
  offset: SharedValue<number>;
  listTop: SharedValue<number>;
  showcase: SharedValue<{ y: number; h: number }>;
  viewport: SharedValue<number>;
};

/** Flags (on-screen.ts) whether the hero's dot field and the showcase's
 *  floating sheets are on screen, so their loops pause off it. */
function useZones({ offset, listTop, showcase, viewport }: Geometry) {
  // The hero's colour band runs ~150pt past the list header's end.
  useAnimatedReaction(
    () => listTop.value <= 0 || offset.value < listTop.value + 200,
    (shown, was) => {
      if (shown !== was) runOnJS(setOnScreen)('hero', shown);
    }
  );
  useAnimatedReaction(
    () => {
      const sc = showcase.value;
      if (sc.h <= 0) return false;
      const top = listTop.value + sc.y - offset.value;
      return top < viewport.value && top + sc.h > 0;
    },
    (shown, was) => {
      if (shown !== was) runOnJS(setOnScreen)('showcase', shown);
    }
  );
}

/** Feeds the tone driver and the live budget the list's geometry. */
function useFeedLayout(
  studio: StudioState,
  { viewportH, bottomPad }: { viewportH: number; bottomPad: number },
  offset: ReturnType<typeof useScrollOffset>
) {
  const listTop = useSharedValue(0);
  const showcase = useSharedValue({ y: 0, h: 0 });
  const viewport = useSharedValue(viewportH);
  const [topH, setTop] = React.useState(0);
  useChromeDriver({ offset, listTop, showcase, viewportH: viewport });
  useZones({ offset, listTop, showcase, viewport });

  React.useEffect(() => {
    showcase.value = studio.feed.showcase ?? { y: 0, h: 0 };
    liveBudget.setSpots(studio.feed.live);
  }, [studio.feed, showcase]);
  React.useEffect(() => {
    listTop.value = topH;
    viewport.value = viewportH;
    // Live tiles count only what is above the floating tab bar.
    if (topH > 0) liveBudget.setLayout(topH, viewportH - bottomPad);
  }, [topH, viewportH, bottomPad, listTop, viewport]);
  return { setTop, listTop };
}

/** Hero + prompt + studio head: measured (without the header's space)
 *  for the feed's start in content coordinates. */
function FeedTop({
  setTop,
  children,
}: {
  setTop: (h: number) => void;
  children: React.ReactNode;
}) {
  return (
    <View onLayout={(e) => setTop(e.nativeEvent.layout.height)}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  ghostRow: { flexDirection: 'row', gap: GAP, paddingHorizontal: PAD },
  ghost: { width: COL_W, height: TALL, borderRadius: 10 },
});
