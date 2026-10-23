import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { type CartOrder, useOrder } from '@/api/app-cart';
import {
  inr,
  type ServicesPalette,
  signedInr,
  tint,
} from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';

const COPY: Record<CartOrder['status'], [string, string]> = {
  pending: ['Confirming your payment', 'This takes a few seconds.'],
  paid: ['Payment received', 'Setting things up for you…'],
  fulfilling: [
    'Setting things up',
    'Registering your domain and pointing it at your app…',
  ],
  fulfilled: [
    "You're all set",
    'Our team has your order. We will be in touch shortly.',
  ],
  failed: [
    'We hit a snag',
    'Your payment is safe. Our team will sort this out.',
  ],
};

function Badge({
  s,
  status,
}: {
  s: ServicesPalette;
  status: CartOrder['status'] | undefined;
}) {
  const pop = useSharedValue(0.6);
  const done = status === 'fulfilled';
  const failed = status === 'failed';
  React.useEffect(() => {
    if (done) haptic.success();
    pop.value = withSpring(1, { damping: 9, stiffness: 300 });
  }, [done, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const color = failed ? s.error : done ? s.success : s.orange;
  return (
    <Animated.View
      style={[st.badge, { backgroundColor: tint(color, 0.12) }, style]}
    >
      {done || failed ? (
        <Ionicons name={done ? 'checkmark' : 'alert'} size={30} color={color} />
      ) : (
        <ActivityIndicator color={color} />
      )}
    </Animated.View>
  );
}

/** After paying: polls the order until fulfilled / failed. */
export function OrderSuccess({
  s,
  orderId,
}: {
  s: ServicesPalette;
  orderId: number;
}) {
  const router = useRouter();
  const { data: order } = useOrder(orderId);
  const [title, note] = COPY[order?.status ?? 'pending'];
  return (
    <View style={st.wrap}>
      <Badge s={s} status={order?.status} />
      <Text style={[st.title, { color: s.text }]}>{title}</Text>
      <Text style={[st.note, { color: s.sub }]}>{order?.error || note}</Text>
      {order ? (
        <View
          style={[
            st.lines,
            { backgroundColor: s.raised, borderColor: s.hairline },
          ]}
        >
          {order.lines.map((l) => (
            <View key={l.label} style={st.line}>
              <Text style={[st.lineLabel, { color: s.sub }]}>{l.label}</Text>
              <Text
                style={[
                  st.lineAmt,
                  { color: l.amount_inr < 0 ? s.success : s.text },
                ]}
              >
                {signedInr(l.amount_inr)}
              </Text>
            </View>
          ))}
          <View style={st.line}>
            <Text style={[st.total, { color: s.text }]}>Paid</Text>
            <Text style={[st.total, { color: s.text }]}>
              {inr(order.total_inr)}
            </Text>
          </View>
        </View>
      ) : null}
      {order?.domain_id ? (
        <PressableScale
          onPress={() => router.replace(`/domains/${order.domain_id}`)}
          style={[st.btn, { backgroundColor: s.orange }]}
        >
          <Text style={[st.btnText, { color: s.onOrange }]}>
            Set up domain →
          </Text>
        </PressableScale>
      ) : null}
      <PressableScale
        onPress={() => router.replace('/pricing')}
        style={st.link}
      >
        <Text style={[st.linkText, { color: s.text }]}>Back to Pricing</Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 10,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: F.display900,
    fontSize: 22,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  note: {
    fontFamily: F.sans400,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  lines: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginTop: 10,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lineLabel: { flex: 1, fontFamily: F.sans500, fontSize: 13 },
  lineAmt: { fontFamily: F.sans600, fontSize: 13 },
  total: { fontFamily: F.sans700, fontSize: 14 },
  btn: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnText: { fontFamily: F.sans700, fontSize: 15 },
  link: { paddingVertical: 10 },
  linkText: { fontFamily: F.sans600, fontSize: 13.5 },
});
