/* eslint-disable react-compiler/react-compiler --
   Pre-existing: ToastCard's mount-only replay effect opts out of
   exhaustive-deps on purpose, which bails the compiler for this file. */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AppColors, brandGradient, useAppTheme } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

// Toasts fly in from just off the top-right corner, which is where the eye
// already is after a tap in the header — and, unlike the old bottom slide, it
// never collides with the composer or the floating tab bar.
const ENTER_X = 56;
const ENTER_Y = -28;

// ── Global handler ref (set by <ToastContainer />) ────────────────────────────
let _handler: ((opts: ToastOptions) => void) | null = null;

export function registerToastHandler(fn: (opts: ToastOptions) => void) {
  _handler = fn;
}

export function triggerToast(opts: ToastOptions) {
  if (_handler) {
    _handler(opts);
  } else {
    // Fallback: retry once the component has mounted (startup race)
    setTimeout(() => _handler?.(opts), 200);
  }
}

function accentFor(t: AppColors, type: ToastType) {
  switch (type) {
    case 'success':
      return t.toastSuccess;
    case 'error':
      return t.toastError;
    case 'warning':
      return t.toastWarning;
    case 'info':
      return t.toastInfo;
  }
}

function iconFor(
  type: ToastType
): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'alert-circle';
    case 'warning':
      return 'warning';
    case 'info':
      return 'information-circle';
  }
}

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_DISMISS_THRESHOLD = 80;

interface ToastItem extends ToastOptions {
  id: number;
}

// Gesture + timer + animated-style wiring for one swipeable toast card doesn't split cleanly.
// eslint-disable-next-line max-lines-per-function
function ToastCard({
  item,
  t,
  onDone,
}: {
  item: ToastItem;
  t: AppColors;
  onDone: (id: number) => void;
}) {
  const duration = item.duration ?? 3500;
  const translateY = useSharedValue(ENTER_Y);
  const translateX = useSharedValue(ENTER_X);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remove = useCallback(() => onDone(item.id), [item.id, onDone]);

  const dismiss = useCallback(
    (direction: 1 | -1) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      translateX.value = withTiming(
        direction * SCREEN_W,
        { duration: 220 },
        (finished) => {
          if (finished) runOnJS(remove)();
        }
      );
      opacity.value = withTiming(0, { duration: 200 });
    },
    [translateX, opacity, remove]
  );

  const armAutoDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismiss(1), duration);
  }, [dismiss, duration]);

  const pauseAutoDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Fly in from off the top-right corner + fade in
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    opacity.value = withTiming(1, { duration: 220 });
    armAutoDismiss();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      runOnJS(pauseAutoDismiss)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      opacity.value = 1 - Math.min(Math.abs(e.translationX) / 200, 0.85);
    })
    .onEnd((e) => {
      const past =
        Math.abs(e.translationX) > SWIPE_DISMISS_THRESHOLD ||
        Math.abs(e.velocityX) > 800;
      if (past) {
        runOnJS(dismiss)(e.translationX >= 0 ? 1 : -1);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        opacity.value = withTiming(1, { duration: 150 });
        runOnJS(armAutoDismiss)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const accent = accentFor(t, item.type);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.shadow, animatedStyle]}>
        <View style={styles.ring}>
          {/* The brand ramp as a 1px border: gradient behind, OPAQUE card on top.
            `toastBg` is a solid hex on both schemes — a translucent fill here
            would let the ramp through and turn the whole toast into a slab. */}
          <LinearGradient
            colors={brandGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.card, { backgroundColor: t.toastBg }]}>
            <Ionicons name={iconFor(item.type)} size={20} color={accent} />
            <View style={styles.textWrap}>
              <Text
                style={[styles.title, { color: t.toastText }]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
              {!!item.description && (
                <Text
                  style={[styles.desc, { color: t.toastTextSub }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Container (mount once in _layout.tsx) ────────────────────────────────────
export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const [items, setItems] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++counterRef.current;
    setItems((prev) => [...prev, { ...opts, id }]);
  }, []);

  useEffect(() => {
    registerToastHandler(show);
    return () => {
      _handler = null;
    };
  }, [show]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} t={t} onDone={remove} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 12,
    zIndex: 9999,
    // Anchored top-right: newest stacks below the previous one, and each card
    // hugs the right edge rather than stretching the full width.
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 8,
  },
  // Shadow and clip live on separate views: `overflow: 'hidden'` sets
  // masksToBounds on iOS, which would clip the shadow away too.
  shadow: {
    maxWidth: 340,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  ring: {
    borderRadius: 12,
    padding: 1,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  // No `flex: 1` here on purpose. `container` gives the row a shrink-wrap
  // cross-axis (`alignItems: 'flex-end'`), and a flex child inside a
  // shrink-wrap ancestor gets a 0 flex-basis to grow from — Yoga then sizes
  // the whole card to just the icon, and the text collapses to nothing,
  // which is the "just a tick, abruptly square" toast this replaces. A
  // `maxWidth` on the Text itself instead lets it size to its own content
  // and wrap within that cap, with no flex distribution involved at all.
  textWrap: {
    maxWidth: 260,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
