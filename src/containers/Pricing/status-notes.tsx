import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { manageSubscriptions, reloadProducts } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

type Base = { t: AppColors; p: PricingPalette };

/** The signed-in user's plan, front and centre: a tinted brand card with a
 *  ribbon icon, and Apple's subscription management on iOS. */
export function CurrentPlan({
  t,
  p,
  name,
  manage,
}: Base & { name: string; manage: boolean }) {
  return (
    <View
      style={[
        st.box,
        st.current,
        { backgroundColor: p.currentBg, borderColor: p.currentBorder },
      ]}
    >
      <View style={[st.medal, { backgroundColor: p.currentInk }]}>
        <Ionicons name="ribbon" size={20} color="#FFFFFF" />
      </View>
      <View style={st.body}>
        <View style={st.kickRow}>
          <View style={[st.dot, { backgroundColor: p.success }]} />
          <Text style={[st.kicker, { color: p.currentInk }]}>
            Your current plan · Active
          </Text>
        </View>
        <Text style={[st.title, st.big, { color: t.text }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      {manage ? (
        <PressableScale
          onPress={() => void manageSubscriptions()}
          haptic="tap"
          accessibilityRole="button"
          style={[st.pill, { backgroundColor: p.currentInk, borderWidth: 0 }]}
        >
          <Text style={[st.pillText, { color: '#FFFFFF' }]}>Manage</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** StoreKit returned no products (not set up in App Store Connect yet, no
 *  StoreKit configuration on a simulator, or the store is unreachable). A
 *  calm notice and a retry — never a way to pay outside the App Store. */
export function StoreUnavailable({
  t,
  p,
  detail,
}: Base & { detail?: string | null }) {
  return (
    <View
      style={[
        st.box,
        { backgroundColor: p.noticeBg, borderColor: p.cardBorder },
      ]}
    >
      <Ionicons name="time-outline" size={20} color={t.textSub} />
      <View style={st.body}>
        <Text style={[st.title, st.small, { color: t.text }]}>
          Purchases are not available right now
        </Text>
        <Text style={[st.note, { color: t.textSub }]}>
          You can still compare the plans. Please try again in a little while.
        </Text>
        {detail ? (
          <Text style={[st.detail, { color: t.textSub }]} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      <PressableScale
        onPress={() => void reloadProducts()}
        haptic="tap"
        accessibilityRole="button"
        style={[st.pill, { borderColor: p.cardBorder }]}
      >
        <Text style={[st.pillText, { color: t.text }]}>Retry</Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  current: { borderWidth: 1.5, paddingVertical: 16 },
  medal: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  big: { fontFamily: F.display900, fontSize: 21, letterSpacing: -0.4 },
  detail: { fontFamily: F.sans500, fontSize: 11, marginTop: 6 },
  body: { flex: 1 },
  kicker: {
    fontFamily: F.sans600,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: { fontFamily: F.sans700, fontSize: 16, marginTop: 2 },
  small: { fontSize: 14, marginTop: 0 },
  note: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: F.sans600, fontSize: 13 },
});
