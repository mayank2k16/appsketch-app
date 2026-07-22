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
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme, type AppColors } from '@/lib/theme';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

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
    case 'success': return t.toastSuccess;
    case 'error': return t.toastError;
    case 'warning': return t.toastWarning;
    case 'info': return t.toastInfo;
  }
}

function iconFor(type: ToastType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'success': return 'checkmark-circle';
    case 'error': return 'alert-circle';
    case 'warning': return 'warning';
    case 'info': return 'information-circle';
  }
}

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_DISMISS_THRESHOLD = 80;

interface ToastItem extends ToastOptions {
  id: number;
}

function ToastCard({ item, t, onDone }: { item: ToastItem; t: AppColors; onDone: (id: number) => void }) {
  const duration = item.duration ?? 2800;
  const translateY = useSharedValue(40);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remove = useCallback(() => onDone(item.id), [item.id, onDone]);

  const dismiss = useCallback((direction: 1 | -1) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    translateX.value = withTiming(direction * SCREEN_W, { duration: 220 }, (finished) => {
      if (finished) runOnJS(remove)();
    });
    opacity.value = withTiming(0, { duration: 200 });
  }, [translateX, opacity, remove]);

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
    // Slide up from the bottom edge + fade in
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
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
      const past = Math.abs(e.translationX) > SWIPE_DISMISS_THRESHOLD || Math.abs(e.velocityX) > 800;
      if (past) {
        runOnJS(dismiss)(e.translationX >= 0 ? 1 : -1);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        opacity.value = withTiming(1, { duration: 150 });
        runOnJS(armAutoDismiss)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const accent = accentFor(t, item.type);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: t.toastBg, borderColor: t.toastBorder },
          animatedStyle,
        ]}
      >
        <Ionicons name={iconFor(item.type)} size={20} color={accent} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: t.toastText }]} numberOfLines={2}>{item.message}</Text>
          {!!item.description && (
            <Text style={[styles.desc, { color: t.toastTextSub }]} numberOfLines={2}>{item.description}</Text>
          )}
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
    return () => { _handler = null; };
  }, [show]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.container, { bottom: insets.bottom + 20 }]}
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
    right: 16,
    zIndex: 9999,
    flexDirection: 'column-reverse',
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  textWrap: {
    flex: 1,
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
