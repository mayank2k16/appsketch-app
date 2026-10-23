import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { manageSubscriptions, reloadProducts } from '@/lib/iap';
import type { AppColors } from '@/lib/theme';

import type { PricingPalette } from './theme';

type Base = { t: AppColors; p: PricingPalette };

/** The signed-in user's plan, with Apple's subscription management on iOS. */
export function CurrentPlan({
  t,
  p,
  name,
  manage,
}: Base & { name: string; manage: boolean }) {
  return (
    <View
      style={[st.box, { backgroundColor: p.cardBg, borderColor: p.cardBorder }]}
    >
      <View style={[st.dot, { backgroundColor: p.success }]} />
      <View style={st.body}>
        <Text style={[st.kicker, { color: t.textSub }]}>Current plan</Text>
        <Text style={[st.title, { color: t.text }]}>{name}</Text>
      </View>
      {manage ? (
        <PressableScale
          onPress={() => void manageSubscriptions()}
          haptic="tap"
          accessibilityRole="button"
          style={[st.pill, { borderColor: p.cardBorder }]}
        >
          <Text style={[st.pillText, { color: t.text }]}>Manage</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** StoreKit returned no products (not set up in App Store Connect yet, no
 *  StoreKit configuration on a simulator, or the store is unreachable). A
 *  calm notice and a retry — never a way to pay outside the App Store. */
export function StoreUnavailable({ t, p }: Base) {
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
  dot: { width: 8, height: 8, borderRadius: 4 },
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
