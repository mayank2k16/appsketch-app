/**
 * screens/OrderSuccessScreen.tsx
 *
 * Shown after payment is confirmed.
 * Auto-redirects to /storefront/myorders after 5 seconds.
 *
 * Route: /storefront/order-success
 * Params: orderId (string)
 *
 * Add to your expo-router file structure:
 *   app/storefront/order-success.tsx  →  export { default } from '@/screens/OrderSuccessScreen'
 */

import * as React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { F } from '@/lib/fonts';

const { width, height } = Dimensions.get('window');
const TOTAL_DURATION = 5000;

const RED     = '#C41230';
const BLACK   = '#0D0D0D';
const WHITE   = '#FFFFFF';
const BG      = '#FFF5F7';

// ── Ripple + Checkmark ─────────────────────────────────────────────────────────
function CheckBurst({ color }: { color: string }) {
  const scale   = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const r1      = React.useRef(new Animated.Value(0)).current;
  const r2      = React.useRef(new Animated.Value(0)).current;
  const r3      = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.stagger(120, [
        Animated.timing(r1, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.timing(r2, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.timing(r3, { toValue: 1, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const ring = (anim: Animated.Value, maxScale = 2.8) => ({
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.7, 0.3, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] }) }],
  });

  return (
    <View style={styles.checkWrap}>
      <Animated.View style={ring(r1, 2.4)} />
      <Animated.View style={ring(r2, 3.0)} />
      <Animated.View style={ring(r3, 3.6)} />
      <Animated.View style={[styles.checkCircle, { backgroundColor: color, transform: [{ scale }], opacity }]}>
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>
    </View>
  );
}

// ── Confetti particle ──────────────────────────────────────────────────────────
function Particle({ x, delay, color, size }: { x: number; delay: number; color: string; size: number }) {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const translateX = React.useRef(new Animated.Value(0)).current;
  const opacity    = React.useRef(new Animated.Value(0)).current;
  const rotate     = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const drift = (Math.random() - 0.5) * 80;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -(height * 0.28 + Math.random() * 80), duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: drift, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotate,     { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(opacity,  { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: height * 0.38,
      left: x,
      width: size, height: size,
      borderRadius: size * 0.3,
      backgroundColor: color,
      opacity,
      transform: [
        { translateY },
        { translateX },
        { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
      ],
    }} />
  );
}

// ── Countdown bar ──────────────────────────────────────────────────────────────
function CountdownBar({ duration, color }: { duration: number; color: string }) {
  const progress = React.useRef(new Animated.Value(1)).current;
  const [secs, setSecs] = React.useState(Math.ceil(duration / 1000));

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 0, duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const iv = setInterval(() => {
      setSecs(s => { if (s <= 1) { clearInterval(iv); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barWrap}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barLabel, { color }]}>Redirecting in {secs}s…</Text>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function OrderSuccessScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  // Page fade-up
  const pageY  = React.useRef(new Animated.Value(30)).current;
  const pageOp = React.useRef(new Animated.Value(0)).current;

  // Info cards stagger
  const card1 = React.useRef(new Animated.Value(0)).current;
  const card2 = React.useRef(new Animated.Value(0)).current;

  // Button
  const btnOp = React.useRef(new Animated.Value(0)).current;

  // Confetti — orange/black palette
  const particles = React.useMemo(() => {
    const colors = [RED, '#FFD166', BLACK, '#E01F3D', '#FFF5F7'];
    return Array.from({ length: 22 }, (_, i) => ({
      x:     (width / 22) * i + Math.random() * 10,
      delay: 200 + i * 70,
      color: colors[i % colors.length],
      size:  5 + Math.random() * 7,
    }));
  }, []);

  React.useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(pageY,  { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(pageOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.stagger(120, [
        Animated.spring(card1, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.spring(card2, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(btnOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto-redirect
    const t = setTimeout(() => router.replace('/storefront/myorders' as never), TOTAL_DURATION);
    return () => clearTimeout(t);
  }, []);

  const cardStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Confetti */}
        {particles.map((p, i) => <Particle key={i} {...p} />)}

        {/* Soft orange bg blob */}
        <View style={styles.bgBlob} />

        <Animated.View style={[styles.content, { opacity: pageOp, transform: [{ translateY: pageY }] }]}>

          {/* ── Check burst ── */}
          <CheckBurst color={RED} />

          {/* ── Title ── */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Order Placed! 🎉</Text>
            {orderId ? (
              <Text style={styles.orderNum}>Order #{orderId}</Text>
            ) : null}
            <Text style={styles.subtitle}>
              Sit tight — we're getting your order ready.
            </Text>
          </View>

          {/* ── Info cards ── */}
          <View style={styles.cards}>
            <Animated.View style={[styles.card, cardStyle(card1)]}>
              <Text style={styles.cardIcon}>📦</Text>
              <Text style={styles.cardLabel}>Processing</Text>
              <Text style={styles.cardDesc}>Your items are being packed</Text>
            </Animated.View>
            <Animated.View style={[styles.card, cardStyle(card2)]}>
              <Text style={styles.cardIcon}>🚚</Text>
              <Text style={styles.cardLabel}>Delivery</Text>
              <Text style={styles.cardDesc}>Express delivery en route</Text>
            </Animated.View>
          </View>

          {/* ── Countdown bar ── */}
          <CountdownBar duration={TOTAL_DURATION} color={RED} />

          {/* ── Manual button ── */}
          <Animated.View style={{ opacity: btnOp, width: '100%' }}>
            <TouchableOpacity
              style={styles.btn}
              activeOpacity={0.82}
              onPress={() => router.replace('/storefront/myorders' as never)}
            >
              <Text style={styles.btnTxt}>View My Orders →</Text>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </View>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bgBlob: {
    position: 'absolute',
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    top: -width * 0.7,
    backgroundColor: 'rgba(196,18,48,0.08)',
  },

  content: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 10,
    gap: 28,
  },

  // Check
  checkWrap: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: RED, shadowOpacity: 0.4,
    shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  checkMark: { fontSize: 48, color: WHITE, fontFamily: F.sans900, lineHeight: 58 },

  // Title
  titleBlock: { alignItems: 'center', gap: 6 },
  title:      { fontSize: 30, fontFamily: F.sans900, color: BLACK, letterSpacing: -0.8, padding: 10 },
  orderNum:   { fontSize: 14, fontFamily: F.sans700, color: RED },
  subtitle:   { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Cards
  cards: { flexDirection: 'row', gap: 12, width: '100%' },
  card: {
    flex: 1, backgroundColor: WHITE, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#FFD5D8',
    padding: 18, alignItems: 'center', gap: 5,
    ...Platform.select({
      ios:     { shadowColor: RED, shadowOpacity: 0.10, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  cardIcon:  { fontSize: 26 },
  cardLabel: { fontSize: 13, fontFamily: F.sans800, color: BLACK, letterSpacing: 0.2 },
  cardDesc:  { fontSize: 11, color: '#999', textAlign: 'center', lineHeight: 15 },

  // Countdown bar
  barWrap:  { width: '100%', alignItems: 'center', gap: 8 },
  barTrack: { width: '100%', height: 4, backgroundColor: '#FFD5D8', borderRadius: 2, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },
  barLabel: { fontSize: 12, fontFamily: F.sans600 },

  // Button
  btn: {
    width: '100%', paddingVertical: 17, borderRadius: 50,
    alignItems: 'center', backgroundColor: RED,
    ...Platform.select({
      ios:     { shadowColor: RED, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
      android: { elevation: 8 },
    }),
  },
  btnTxt: { color: WHITE, fontSize: 16, fontFamily: F.sans800, letterSpacing: 0.3 },
});