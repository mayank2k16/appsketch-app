import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as React from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { W } from '../Home/Studio/geometry';
import { PanelRow } from './panel-row';
import { type CatColors, EDGE_W } from './theme';
import type { CategoryInfo } from './use-category-data';

/**
 * "Browse all categories": a panel sliding in from the right (82% of the
 * width, at most 360) over the screen, which blurs behind it. Tap the
 * backdrop, press ×, swipe the panel right, or press Android back to close;
 * picking a category selects it and closes. One spring (no overshoot) drives
 * the panel and the backdrop together; the drag drives the same value.
 */

export const PANEL_W = Math.min(W * 0.82, 360);
const SPRING = {
  damping: 30,
  stiffness: 300,
  mass: 0.9,
  overshootClamping: true,
};

function usePanelMotion(open: boolean, onClose: () => void) {
  const p = useSharedValue(0);
  const [mounted, setMounted] = React.useState(open);
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      p.value = withSpring(1, SPRING);
    } else {
      p.value = withSpring(0, SPRING, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [open, p]);
  React.useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(10)
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
          p.set(Math.min(1, Math.max(0, 1 - e.translationX / PANEL_W)));
        })
        .onEnd((e) => {
          if (e.translationX > PANEL_W * 0.28 || e.velocityX > 700) {
            runOnJS(onClose)();
          } else {
            p.set(withSpring(1, SPRING));
          }
        }),
    [p, onClose]
  );
  return { p, mounted, pan };
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

/** The screen behind the panel: its blur rises with the panel (animated
 *  intensity, not a dimming tint), and a tap anywhere on it closes. */
function Backdrop({
  p,
  c,
  onClose,
}: {
  p: SharedValue<number>;
  c: CatColors;
  onClose: () => void;
}) {
  const max = c.dark ? 40 : 32;
  const blur = useAnimatedProps(() => ({ intensity: p.value * max }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <AnimatedBlur
        animatedProps={blur}
        intensity={0}
        tint={c.dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close categories"
      />
    </View>
  );
}

function PanelHead({
  c,
  categories,
  onClose,
}: {
  c: CatColors;
  categories: CategoryInfo[];
  onClose: () => void;
}) {
  const total = categories[0]?.count ?? 0;
  return (
    <View style={s.head}>
      <View style={s.headText}>
        <Text style={[s.title, { color: c.ink }]}>Categories</Text>
        <Text style={[s.sub, { color: c.sub }]}>
          {Math.max(0, categories.length - 1)} categories · {total} templates
        </Text>
      </View>
      <PressableScale
        onPress={onClose}
        hitSlop={8}
        accessibilityLabel="Close categories"
        style={[s.close, { backgroundColor: c.inset }]}
      >
        <Ionicons name="close" size={18} color={c.ink} />
      </PressableScale>
    </View>
  );
}

type Props = {
  c: CatColors;
  open: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  category: string;
  onPick: (name: string) => void;
};

export function BrowsePanel(props: Props) {
  const { c, open, onClose, categories, category, onPick } = props;
  const insets = useSafeAreaInsets();
  const { p, mounted, pan } = usePanelMotion(open, onClose);
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - p.value) * (PANEL_W + EDGE_W) }],
  }));
  if (!mounted) return null;
  return (
    <View style={s.layer} pointerEvents={open ? 'auto' : 'none'}>
      <Backdrop p={p} c={c} onClose={onClose} />
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityViewIsModal
          style={[
            s.panel,
            { backgroundColor: c.surface, borderColor: c.edge },
            { paddingTop: insets.top + 8 },
            slide,
          ]}
        >
          <PanelHead c={c} categories={categories} onClose={onClose} />
          <ScrollView
            contentContainerStyle={[
              s.list,
              { paddingBottom: insets.bottom + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((cat) => (
              <PanelRow
                key={cat.name}
                cat={cat}
                active={cat.name === category}
                c={c}
                onPick={onPick}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  // Above the screen's fixed bars (zIndex 2): the blur covers them too, and
  // a tap there closes the panel instead of reaching a chip.
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: PANEL_W,
    borderLeftWidth: EDGE_W,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 12,
  },
  headText: { flex: 1 },
  title: { fontFamily: F.sans800, fontSize: 22, letterSpacing: -0.6 },
  sub: { fontFamily: F.sans500, fontSize: 12.5, marginTop: 2 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 8, paddingTop: 4, gap: 2 },
});
