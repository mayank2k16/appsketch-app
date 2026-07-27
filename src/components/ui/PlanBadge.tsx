/**
 * PlanBadge — subscription-tier pill for headers.
 *
 * Free renders nothing. The three paid tiers step up in "glow" as they go:
 * `Basic` is a plain tinted outline (no gradient, no motion), `Growth` (and
 * any other paid tier) gets the full logo gradient
 * (`#3B82F6 → #8B5CF6 → #EC4899 → #F97316`, lifted straight from
 * `assets/logo.png`'s icon outline), and `100X` gets an enhanced version of
 * that gradient: a looping shimmer sweep + pulsing glow halo, reusing the
 * same `Animated` (opacity/scale/translateX, native-driver) technique as
 * `PulsingDot.tsx` and `GradientText.tsx`'s `AnimatedGradientText` —
 * no new animation library.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { F } from '@/lib/fonts';

const LOGO_GRADIENT = ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316'] as const;

type BadgeLevel = 'basic' | 'standard' | 'max';

function getBadgeLevel(tier: string | null | undefined): BadgeLevel | null {
  const t = (tier ?? '').trim().toLowerCase();
  if (!t || t === 'free') return null;
  if (t === '100x') return 'max';
  if (t === 'basic') return 'basic';
  return 'standard';
}

export function PlanBadge({ tier }: { tier: string | null | undefined }) {
  const level = getBadgeLevel(tier);
  if (!level) return null;

  const label = tier!.toUpperCase();
  if (level === 'max') return <MaxPlanBadge label={label} />;
  if (level === 'standard') return <StandardPlanBadge label={label} />;
  return <BasicPlanBadge label={label} />;
}

// ─── Basic — lowest tier of the three: plain tinted outline, no gradient/motion ──
function BasicPlanBadge({ label }: { label: string }) {
  return (
    <View style={st.basicPill}>
      <Text style={st.basicLabel}>{label}</Text>
    </View>
  );
}

// ─── Growth (and every other non-Basic/100X paid tier) — static gradient pill ───
function StandardPlanBadge({ label }: { label: string }) {
  return (
    <LinearGradient colors={LOGO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.pill}>
      <Text style={st.label}>{label}</Text>
    </LinearGradient>
  );
}

// ─── 100X — same gradient, plus a sweeping shine band + pulsing glow halo ──
function MaxPlanBadge({ label }: { label: string }) {
  const [pillWidth, setPillWidth] = React.useState(0);
  const sweep = React.useRef(new Animated.Value(0)).current;
  const glow = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(650),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    sweepLoop.start();
    glowLoop.start();
    return () => {
      sweepLoop.stop();
      glowLoop.stop();
    };
  }, [sweep, glow]);

  const bandWidth = Math.max(pillWidth * 0.55, 1);
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-bandWidth, pillWidth] });


  return (
    <View style={st.maxWrap}>
      <LinearGradient
        colors={LOGO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={st.maxPill}
        onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
      >
        {pillWidth > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[st.sweepBand, { width: bandWidth, transform: [{ translateX }] }]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        )}
        <Ionicons name="sparkles" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
        <Text style={st.maxLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  basicPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
  },
  basicLabel: {
    fontFamily: F.sans700,
    fontSize: 10,
    color: '#3B82F6',
    letterSpacing: 0.4,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  label: {
    fontFamily: F.sans700,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  maxWrap: {
    position: 'relative',
  },
  glowHalo: {
    ...StyleSheet.absoluteFillObject,
    margin: -4,
    borderRadius: 999,
    backgroundColor: '#EC4899',
  },
  maxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  sweepBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  maxLabel: {
    fontFamily: F.sans700,
    fontSize: 10.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
});
