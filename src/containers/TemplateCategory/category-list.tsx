import { FlashList, type FlashListRef } from '@shopify/flash-list';
import * as React from 'react';
import { type ScrollViewProps, View } from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';

import { TALL } from '../Home/Studio/geometry';
import type { DealRow } from './deal';
import { CategoryRow } from './rows';
import { categoryLive } from './use-category-nav';

/**
 * The bento, virtualised: a FlashList (v2) of rows, recycled by each row's
 * column signature. The scroll component is a Reanimated ScrollView, so the
 * screen reads the scroll offset on the UI thread (title collapse, bar
 * hairline); the JS scroll event only feeds the live-tile budget. Dragging
 * the feed dismisses the search keyboard.
 */

type Scroller = AnimatedRef<Animated.ScrollView>;

const CategoryScroller = React.forwardRef<
  unknown,
  ScrollViewProps & { scrollRef: Scroller }
>(function CategoryScroller({ scrollRef, ...props }, ref) {
  const setRef = React.useCallback(
    (node: Animated.ScrollView | null) => {
      scrollRef(node as never);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref, scrollRef]
  );
  return (
    <Animated.ScrollView
      {...props}
      ref={setRef as never}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
});

const renderItem = ({ item, index }: { item: DealRow; index: number }) => (
  <CategoryRow row={item} index={index} />
);
const keyOf = (item: DealRow) => item.key;
const typeOf = (item: DealRow) => item.type;

type Props = {
  rows: DealRow[];
  header: React.ReactElement;
  empty: React.ReactElement | null;
  bottomPad: number;
  scrollRef: Scroller;
  listRef: React.RefObject<FlashListRef<DealRow> | null>;
  extraData: unknown;
};

export function CategoryList(props: Props) {
  const { rows, header, empty, bottomPad, scrollRef, listRef } = props;
  const [topH, setTopH] = React.useState(0);
  const [viewH, setViewH] = React.useState(0);
  React.useEffect(() => {
    if (topH > 0 && viewH > 0) categoryLive.setLayout(topH, viewH);
  }, [topH, viewH]);
  const Scroll = React.useCallback(
    (p: ScrollViewProps) => <CategoryScroller {...p} scrollRef={scrollRef} />,
    [scrollRef]
  );
  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
    >
      <FlashList
        ref={listRef}
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyOf}
        getItemType={typeOf}
        ListHeaderComponent={
          <View onLayout={(e) => setTopH(e.nativeEvent.layout.height)}>
            {header}
          </View>
        }
        ListEmptyComponent={empty}
        renderScrollComponent={Scroll as never}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        drawDistance={TALL * 2}
        extraData={props.extraData}
        onScroll={(e) => categoryLive.onScroll(e.nativeEvent.contentOffset.y)}
      />
    </View>
  );
}
