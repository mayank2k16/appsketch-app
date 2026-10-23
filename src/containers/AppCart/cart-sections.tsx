import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCatalogue } from '@/api/app-cart';
import { type ServicesPalette, StateNote } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { getUserSubscription, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { useAppCart } from '@/lib/store/app-cart-store';

import { DiscountRow, Totals } from './discount-row';
import { DomainLine } from './domain-line';
import { LineItems } from './line-items';

export function Card({
  s,
  title,
  sub,
  children,
}: {
  s: ServicesPalette;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Text style={[st.title, { color: s.text }]}>{title}</Text>
      {sub ? <Text style={[st.sub, { color: s.sub }]}>{sub}</Text> : null}
      {children}
    </View>
  );
}

/** Builds/extras (from the live catalogue) and the domain line. */
export function OrderCard({ s }: { s: ServicesPalette }) {
  const cat = useCatalogue();
  const ids = useAppCart((c) => c.addonIds);
  const domain = useAppCart((c) => c.domain);
  return (
    <Card s={s} title="Your order">
      {ids.length ? (
        cat.data ? (
          <LineItems s={s} cat={cat.data} />
        ) : (
          <StateNote
            s={s}
            loading={cat.isLoading}
            title="Couldn't load prices"
            action="Retry"
            onAction={() => void cat.refetch()}
          />
        )
      ) : null}
      {domain ? (
        <>
          <DomainLine s={s} d={domain} />
          <DiscountRow s={s} />
          <Totals s={s} />
        </>
      ) : null}
    </Card>
  );
}

/** Builds run on a platform plan, which is an App Store subscription and
 *  never sold here — point at Pricing and show the current one. */
export function PlanNote({ s }: { s: ServicesPalette }) {
  const router = useRouter();
  const sub = getUserSubscription(useAuth.use.user());
  const name = sub?.active ? sub.plan?.display_name || sub.plan?.tier : null;
  return (
    <View style={[st.note, { backgroundColor: s.inset }]}>
      <View style={st.noteBody}>
        <Text style={[st.noteTitle, { color: s.text }]}>
          Builds run on a platform plan — choose it in Pricing
        </Text>
        <Text style={[st.noteSub, { color: s.sub }]}>
          {name ? `Your plan: ${name}` : 'You are not on a plan yet.'}
        </Text>
      </View>
      <PressableScale
        onPress={() => router.navigate('/pricing')}
        style={[
          st.pill,
          { borderColor: s.hairline, backgroundColor: s.raised },
        ]}
      >
        <Text style={[st.pillText, { color: s.text }]}>Plans</Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14 },
  title: { fontFamily: F.sans700, fontSize: 15 },
  sub: {
    fontFamily: F.sans400,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 8,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
  },
  noteBody: { flex: 1 },
  noteTitle: { fontFamily: F.sans600, fontSize: 12.5, lineHeight: 17 },
  noteSub: { fontFamily: F.sans500, fontSize: 11.5, marginTop: 2 },
  pill: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: F.sans600, fontSize: 12.5 },
});
