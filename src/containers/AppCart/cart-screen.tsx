import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalogue } from '@/api/app-cart';
import {
  AnimatedTotal,
  inr,
  ScreenHeader,
  type ServicesPalette,
  StateNote,
  useServicesTheme,
} from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { cartCount, useAppCart } from '@/lib/store/app-cart-store';

import { Card, OrderCard, PlanNote } from './cart-sections';
import { ContactForm } from './contact-form';
import { OrderSuccess } from './order-success';
import { useCheckout } from './use-checkout';

function useTotal() {
  const cat = useCatalogue();
  const ids = useAppCart((c) => c.addonIds);
  const domain = useAppCart((c) => c.domain);
  const items = [...(cat.data?.builds ?? []), ...(cat.data?.extras ?? [])];
  const addons = items.filter((x) => ids.includes(x.id));
  const ready = !ids.length || !!cat.data;
  const total =
    addons.reduce((n, x) => n + x.price_inr, 0) + (domain?.price_inr ?? 0);
  return {
    total,
    ready,
    hasBuild: (cat.data?.builds ?? []).some((b) => ids.includes(b.id)),
  };
}

function PayBar({
  s,
  onPaid,
}: {
  s: ServicesPalette;
  onPaid: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { total, ready } = useTotal();
  const { busy, start } = useCheckout(onPaid);
  return (
    <View
      style={[
        st.pay,
        {
          paddingBottom: insets.bottom + 10,
          backgroundColor: s.canvas,
          borderColor: s.hairline,
        },
      ]}
    >
      <View style={st.payText}>
        <Text style={[st.payLabel, { color: s.sub }]}>Total · one-time</Text>
        <AnimatedTotal value={total} style={[st.payTotal, { color: s.text }]} />
      </View>
      <PressableScale
        onPress={() => void start()}
        disabled={busy || !ready || total <= 0}
        disabledOpacity={busy ? 1 : 0.5}
        style={[st.payBtn, { backgroundColor: s.orange }]}
        accessibilityLabel="Pay"
      >
        {busy ? (
          <ActivityIndicator color={s.onOrange} />
        ) : (
          <Text style={[st.payBtnText, { color: s.onOrange }]}>
            Pay {inr(total)}
          </Text>
        )}
      </PressableScale>
    </View>
  );
}

function Body({ s }: { s: ServicesPalette }) {
  const domain = useAppCart((c) => c.domain);
  const { hasBuild } = useTotal();
  return (
    <>
      <OrderCard s={s} />
      {hasBuild ? <PlanNote s={s} /> : null}
      {domain ? (
        <Card
          s={s}
          title="Domain owner"
          sub="The registry needs these details. Your info stays private (WHOIS privacy is on)."
        >
          <ContactForm s={s} />
        </Card>
      ) : null}
      <Text style={[st.legal, { color: s.muted }]}>
        Paid securely with Razorpay (card or UPI). Team builds and domains are
        services; platform plans are billed separately by the App Store.
      </Text>
    </>
  );
}

/** /cart — team builds, extras and a domain, paid with Razorpay. */
export function AppCartScreen() {
  const { t, s } = useServicesTheme();
  const n = useAppCart(cartCount);
  const [orderId, setOrderId] = React.useState<number | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[st.root, { backgroundColor: s.canvas }]}>
      <StatusBar barStyle={t.statusBar} />
      <ScreenHeader s={s} title={orderId ? 'Order' : 'Cart'} />
      {orderId ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        >
          <OrderSuccess s={s} orderId={orderId} />
        </ScrollView>
      ) : n ? (
        <>
          <KeyboardAwareScrollView
            bottomOffset={90}
            contentContainerStyle={st.body}
            keyboardShouldPersistTaps="handled"
          >
            <Body s={s} />
          </KeyboardAwareScrollView>
          <PayBar s={s} onPaid={setOrderId} />
        </>
      ) : (
        <View style={st.body}>
          <StateNote
            s={s}
            title="Your cart is empty"
            note="Pick a team build or search for a domain in Pricing."
            action="Browse Pricing"
            onAction={() => router.navigate('/pricing')}
          />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 12, gap: 12, paddingBottom: 30 },
  legal: {
    fontFamily: F.sans400,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  pay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payText: { flex: 1 },
  payLabel: { fontFamily: F.sans500, fontSize: 11.5 },
  payTotal: { fontFamily: F.sans700, fontSize: 20, letterSpacing: -0.3 },
  payBtn: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  payBtnText: { fontFamily: F.sans700, fontSize: 15 },
});
