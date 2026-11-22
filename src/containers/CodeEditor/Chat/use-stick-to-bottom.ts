import * as React from 'react';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

/**
 * Chat auto-scroll that gets out of the way. While the view is at the bottom
 * it follows everything the agent streams in (new messages, new activity
 * steps, a step's text growing). Once the user drags up to read, it stops;
 * when they scroll back to the bottom (or tap "Jump to latest") it follows
 * again. Only the user's own drags change that — the list growing or our own
 * scrollToEnd never unpins it.
 */
const NEAR_BOTTOM = 64;

export function useStickToBottom(listRef: React.RefObject<ScrollView | null>) {
  const pinnedRef = React.useRef(true);
  const [pinned, setPinned] = React.useState(true);
  const dragging = React.useRef(false);

  const setPin = React.useCallback((v: boolean) => {
    if (pinnedRef.current === v) return;
    pinnedRef.current = v;
    setPinned(v);
  }, []);

  const nearBottom = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    return (
      contentSize.height - (contentOffset.y + layoutMeasurement.height) <
      NEAR_BOTTOM
    );
  };

  const toEnd = React.useCallback(
    (animated = true) =>
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated })),
    [listRef]
  );

  /** Pin and go to the end (a sent message, the keyboard, the pill). */
  const jump = React.useCallback(() => {
    setPin(true);
    toEnd(true);
  }, [setPin, toEnd]);

  /** Follow new content only while pinned. */
  const follow = React.useCallback(() => {
    if (pinnedRef.current) toEnd(true);
  }, [toEnd]);

  const scrollProps = {
    scrollEventThrottle: 32,
    onScrollBeginDrag: () => {
      dragging.current = true;
    },
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (dragging.current) setPin(nearBottom(e));
    },
    onScrollEndDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPin(nearBottom(e));
    },
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false;
      setPin(nearBottom(e));
    },
    // A step's text growing changes the height without adding an item.
    onContentSizeChange: follow,
  };

  return { pinned, jump, follow, scrollProps };
}
