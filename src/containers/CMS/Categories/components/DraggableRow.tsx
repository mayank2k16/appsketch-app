import * as React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

/**
 * Generic long-press-to-drag primitive for a single row inside a flat,
 * fixed-height sibling group. Shared by category rows (`DraggableCategoryRow`)
 * and a category's linked-products list (`CategoryDetailSheet`) — the gesture
 * and shift math is identical, only the row content and what "group" means
 * differ.
 *
 * Mirrors the web CMS's `SortableRow.jsx` (react-dnd): the dragged row lifts
 * and follows the finger, every other row in the group shifts by one step to
 * open a gap, and the move is committed once on release rather than
 * continuously — this port only needs a UI-thread transform during the
 * gesture, no per-frame JS work.
 */
type Props = {
  rowHeight: number;
  /** Rows only interact with others sharing the same groupKey — the RN
   * equivalent of react-dnd's per-parent drag `type` partition. */
  groupKey: string;
  indexInGroup: number;
  groupSize: number;
  enabled: boolean;
  activeGroup: SharedValue<string>;
  dragY: SharedValue<number>;
  fromIndex: SharedValue<number>;
  toIndex: SharedValue<number>;
  onDragStart: () => void;
  onDragEnd: (from: number, to: number) => void;
  children: React.ReactNode;
};

type DragProps = Omit<Props, 'children'>;

/** The pan gesture itself: lift on long-press, snap the drop target to whole
 * row steps clamped to the group's bounds, commit once on release. Shared
 * values here are owned by the screen and mutated from these worklets by
 * design — the standard Reanimated pattern for coordinating a drag across
 * sibling rows without a JS re-render on every gesture frame. */
function useDragGesture({
  rowHeight,
  groupKey,
  indexInGroup,
  groupSize,
  enabled,
  activeGroup,
  dragY,
  fromIndex,
  toIndex,
  onDragStart,
  onDragEnd,
}: DragProps) {
  return Gesture.Pan()
    .activateAfterLongPress(250)
    .enabled(enabled)
    .onStart(() => {
      activeGroup.value = groupKey;
      fromIndex.value = indexInGroup;
      toIndex.value = indexInGroup;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      dragY.value = e.translationY;
      // Snap to whole-row steps, clamped to the group's own bounds — the
      // clamp is what keeps a row from ever leaving its group.
      const next = Math.round(e.translationY / rowHeight) + fromIndex.value;
      toIndex.value = Math.min(Math.max(next, 0), groupSize - 1);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)(fromIndex.value, toIndex.value);
    })
    .onFinalize(() => {
      activeGroup.value = '';
      dragY.value = 0;
    });
}

/** The visual side of the same gesture: the lifted row follows the finger,
 * every other row in the group shifts by one step to open a gap at the
 * current drop target. */
function useDragAnimatedStyle({
  rowHeight,
  groupKey,
  indexInGroup,
  activeGroup,
  dragY,
  fromIndex,
  toIndex,
}: Omit<DragProps, 'groupSize' | 'enabled' | 'onDragStart' | 'onDragEnd'>) {
  return useAnimatedStyle(() => {
    if (activeGroup.value !== groupKey) {
      return {
        transform: [{ translateY: 0 }, { scale: 1 }],
        zIndex: 0,
        elevation: 0,
        opacity: 1,
      };
    }
    if (indexInGroup === fromIndex.value) {
      return {
        transform: [{ translateY: dragY.value }, { scale: 1.02 }],
        zIndex: 10,
        elevation: 10,
        opacity: 0.95,
      };
    }
    const from = fromIndex.value;
    const to = toIndex.value;
    let shift = 0;
    if (from < to && indexInGroup > from && indexInGroup <= to)
      shift = -rowHeight;
    if (from > to && indexInGroup >= to && indexInGroup < from)
      shift = rowHeight;
    return {
      transform: [
        { translateY: withTiming(shift, { duration: 150 }) },
        { scale: 1 },
      ],
      zIndex: 1,
      // Android ignores zIndex for sibling overlap; elevation is what
      // actually stacks the lifted row above the rest there.
      elevation: 1,
      opacity: 1,
    };
  });
}

export function DraggableRow({ children, ...dragProps }: Props) {
  const pan = useDragGesture(dragProps);
  const animatedStyle = useDragAnimatedStyle(dragProps);

  return (
    <GestureDetector gesture={pan}>
      {/* collapsable={false} is required on Android: a parent View carrying
       * a `transform` style (even the idle identity transform above) makes
       * Android's view-flattening optimization drop Image/expo-image
       * children from the native render tree entirely — invisible on
       * device, invisible in the RN inspector, but never reproduces on web
       * (no such flattening pass exists there) or with static styles. */}
      <Animated.View style={animatedStyle} collapsable={false}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
