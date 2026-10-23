import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  inr,
  type ServicesPalette,
  signedInr,
  tint,
} from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';

import { OffersRow } from './offers-row';
import { useCartDiscount, useCartTotals } from './use-cart-totals';

/** Chip wording per `applies_to`: "on your build|domain|order". */
const ON: Record<string, string> = {
  build: 'on your build',
  domain: 'on your domain',
  order: 'on your order',
};

/** Totals wording: "BUILD20 · 20% off team builds". */
const OFF: Record<string, string> = {
  build: 'team builds',
  domain: 'domain',
  order: 'order',
};

function Applied({ s }: { s: ServicesPalette }) {
  const setCode = useAppCart((c) => c.setDiscountCode);
  const { code, result, checking, failed, retry, amount } = useCartDiscount();
  const ok = !!result?.valid;
  const message = failed
    ? "Couldn't check this code."
    : result && !ok
      ? result.message || 'This code is not valid.'
      : null;
  return (
    <View style={st.applied}>
      <View
        style={[
          st.chip,
          {
            backgroundColor: ok ? tint(s.success, 0.1) : s.inset,
            borderColor: ok ? tint(s.success, 0.35) : s.hairline,
          },
        ]}
      >
        <Ionicons name="pricetag" size={13} color={ok ? s.success : s.muted} />
        <Text
          style={[st.chipText, { color: ok ? s.success : s.text }]}
          numberOfLines={1}
        >
          {code}
          {ok
            ? ` · −${inr(amount)} ${ON[result?.applies_to ?? ''] ?? 'off'}`
            : ''}
        </Text>
        {checking ? <ActivityIndicator size="small" color={s.muted} /> : null}
        <PressableScale
          onPress={() => setCode(null)}
          hitSlop={8}
          accessibilityLabel={`Remove code ${code}`}
        >
          <Ionicons name="close" size={15} color={ok ? s.success : s.sub} />
        </PressableScale>
      </View>
      {message ? (
        <View style={st.msgRow}>
          <Text style={[st.msg, { color: s.error }]}>{message}</Text>
          {failed ? (
            <PressableScale onPress={retry} hitSlop={6}>
              <Text style={[st.msgAction, { color: s.text }]}>Retry</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Entry({ s, onDone }: { s: ServicesPalette; onDone: () => void }) {
  const setCode = useAppCart((c) => c.setDiscountCode);
  const [text, setText] = React.useState('');
  const apply = () => {
    if (!text.trim()) return;
    haptic.select();
    setCode(text);
    onDone();
  };
  return (
    <View style={[st.entry, { backgroundColor: s.inset }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Discount code"
        placeholderTextColor={s.muted}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={apply}
        style={[st.field, { color: s.text }]}
      />
      <PressableScale
        onPress={apply}
        disabled={!text.trim()}
        style={[st.apply, { backgroundColor: s.ink }]}
      >
        <Text style={[st.applyText, { color: s.onInk }]}>Apply</Text>
      </PressableScale>
    </View>
  );
}

function CodeControl({ s }: { s: ServicesPalette }) {
  const code = useAppCart((c) => c.discountCode);
  const [open, setOpen] = React.useState(false);
  if (code) return <Applied s={s} />;
  if (open) return <Entry s={s} onDone={() => setOpen(false)} />;
  return (
    <PressableScale onPress={() => setOpen(true)} style={st.ask} hitSlop={6}>
      <Ionicons name="pricetag-outline" size={14} color={s.sub} />
      <Text style={[st.askText, { color: s.text }]}>Have a discount code?</Text>
    </PressableScale>
  );
}

/** "Offers for you" chips (tap to apply), then "Have a discount code?" →
 *  input + Apply → a removable chip ("BUILD20 · −₹3,000 on your build") or
 *  the server's reason inline. Works for any cart (builds, extras, domain). */
export function DiscountRow({ s }: { s: ServicesPalette }) {
  // Build/extra lines end with their own hairline; the domain line does not.
  const divider = useAppCart((c) => !!c.domain);
  return (
    <View style={[st.row, divider && st.divider, { borderColor: s.hairline }]}>
      <OffersRow s={s} />
      <CodeControl s={s} />
    </View>
  );
}

/** Subtotal, the green discount line and the total — only with a discount
 *  (otherwise the pay bar's total says it all). */
export function Totals({ s }: { s: ServicesPalette }) {
  const { subtotal, discount, total } = useCartTotals();
  const { result } = useCartDiscount();
  if (!discount) return null;
  const what = OFF[result?.applies_to ?? ''] ?? 'order';
  const pct = result?.percent
    ? `${result.percent}% off ${what}`
    : `off ${what}`;
  return (
    <View style={[st.totals, { borderColor: s.hairline }]}>
      <View style={st.tRow}>
        <Text style={[st.tLabel, { color: s.sub }]}>Subtotal</Text>
        <Text style={[st.tAmt, { color: s.text }]}>{inr(subtotal)}</Text>
      </View>
      <View style={st.tRow}>
        <Text style={[st.tLabel, { color: s.success }]}>
          {result?.code} · {pct}
        </Text>
        <Text style={[st.tAmt, { color: s.success }]}>
          {signedInr(-discount)}
        </Text>
      </View>
      <View style={st.tRow}>
        <Text style={[st.tTotal, { color: s.text }]}>Total</Text>
        <Text style={[st.tTotal, { color: s.text }]}>{inr(total)}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  row: { marginTop: 10 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  askText: { fontFamily: F.sans600, fontSize: 13 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    height: 44,
    marginTop: 4,
  },
  field: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 14,
    letterSpacing: 0.6,
    paddingVertical: 0,
  },
  apply: {
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { fontFamily: F.sans700, fontSize: 13 },
  applied: { gap: 6, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 9,
    height: 32,
  },
  chipText: { fontFamily: F.sans700, fontSize: 12.5, flexShrink: 1 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msg: { fontFamily: F.sans500, fontSize: 12, flexShrink: 1 },
  msgAction: { fontFamily: F.sans700, fontSize: 12 },
  totals: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingTop: 10,
    gap: 6,
  },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  tLabel: { fontFamily: F.sans500, fontSize: 12.5, flexShrink: 1 },
  tAmt: { fontFamily: F.sans600, fontSize: 13 },
  tTotal: { fontFamily: F.sans700, fontSize: 14 },
});
