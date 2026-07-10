/**
 * Custom side-entry toast — slides in from the RIGHT edge, sits in the top-right
 * area (first half of screen). Black background, green accent.
 *
 * Imperative API:  registerToastHandler() is called once by <ToastContainer />.
 * toast.ts calls   triggerToast()         to show a message from anywhere.
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Brand tokens ──────────────────────────────────────────────────────────────
const BG      = '#111111';
const GREEN   = '#10B981';
const DANGER  = '#FF3B30';
const WARNING = '#FF9500';
const WHITE   = '#FFFFFF';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type:         ToastType;
  message:      string;
  description?: string;
  duration?:    number;
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

// ── Icon + colour per type ────────────────────────────────────────────────────
function accentColor(type: ToastType) {
  switch (type) {
    case 'success': return GREEN;
    case 'error':   return DANGER;
    case 'warning': return WARNING;
    case 'info':    return GREEN;
  }
}

function iconName(type: ToastType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'success': return 'checkmark-circle';
    case 'error':   return 'close-circle';
    case 'warning': return 'warning';
    case 'info':    return 'information-circle';
  }
}

// ── Toast card ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
// Card takes ~70% of screen width, anchored to the right
const CARD_W = Math.min(SW * 0.72, 300);

interface ToastItem extends ToastOptions {
  id: number;
}

function ToastCard({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const translateX = useRef(new Animated.Value(CARD_W + 20)).current;
  const opacity    = useRef(new Animated.Value(1)).current;
  const duration   = item.duration ?? 2800;

  useEffect(() => {
    // Slide in from right
    Animated.spring(translateX, {
      toValue:        0,
      damping:        18,
      stiffness:      220,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue:         CARD_W + 20,
        duration:        240,
        easing:          Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:         0,
        duration:        200,
        useNativeDriver: true,
      }),
    ]).start(() => onDone(item.id));
  }, [item.id]);

  const accent = accentColor(item.type);

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateX }], opacity },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      {/* Icon */}
      <Ionicons name={iconName(item.type)} size={20} color={accent} style={styles.icon} />

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2}>{item.message}</Text>
        {!!item.description && (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>

      {/* Dismiss tap */}
      <Pressable onPress={dismiss} hitSlop={10} style={styles.closeBtn}>
        <Ionicons name="close" size={14} color="rgba(255,255,255,0.45)" />
      </Pressable>
    </Animated.View>
  );
}

// ── Container (mount once in _layout.tsx) ────────────────────────────────────
export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++counterRef.current;
    setItems(prev => [...prev, { ...opts, id }]);
  }, []);

  // Register globally once on mount
  useEffect(() => {
    registerToastHandler(show);
    return () => { _handler = null; };
  }, [show]);

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  const topOffset = insets.top + (Platform.OS === 'android' ? 8 : 10);

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: topOffset }]}
      pointerEvents="box-none"
    >
      {items.map(item => (
        <ToastCard key={item.id} item={item} onDone={remove} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    right:     0,
    zIndex:    9999,
    alignItems: 'flex-end',
    gap:        8,
  },
  card: {
    width:           CARD_W,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: BG,
    borderTopLeftRadius:    16,
    borderBottomLeftRadius: 16,
    paddingVertical:  12,
    paddingRight:     12,
    paddingLeft:       0,
    // Shadow
    shadowColor:    '#000',
    shadowOffset:   { width: -3, height: 6 },
    shadowOpacity:  0.35,
    shadowRadius:   12,
    elevation:      16,
  },
  accentBar: {
    width:                  4,
    alignSelf:              'stretch',
    borderTopLeftRadius:    16,
    borderBottomLeftRadius: 16,
    marginRight:            10,
  },
  icon: {
    marginRight: 8,
  },
  textWrap: {
    flex:   1,
    gap:    2,
  },
  title: {
    color:       WHITE,
    fontSize:    13,
    fontWeight:  '700',
    letterSpacing: -0.2,
    lineHeight:  18,
  },
  desc: {
    color:      'rgba(255,255,255,0.60)',
    fontSize:   11,
    lineHeight: 15,
  },
  closeBtn: {
    marginLeft: 6,
    padding:    2,
  },
});
