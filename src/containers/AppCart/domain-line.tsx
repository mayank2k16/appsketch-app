import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMoney } from '@/api/app-cart';
import { useUserTenants } from '@/api/studio';
import { appKind, AppSheet, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { type CartDomain, useAppCart } from '@/lib/store/app-cart-store';

function Years({ s, d }: { s: ServicesPalette; d: CartDomain }) {
  const patch = useAppCart((c) => c.patchDomain);
  if (d.options.length < 2) return null;
  return (
    <View style={st.chips}>
      {d.options.slice(0, 5).map((o) => {
        const on = o.years === d.years;
        return (
          <PressableScale
            key={o.years}
            haptic={on ? false : 'select'}
            onPress={() => patch({ years: o.years, price_inr: o.price_inr })}
            style={[st.chip, { backgroundColor: on ? s.ink : s.inset }]}
          >
            <Text style={[st.chipText, { color: on ? s.onInk : s.text }]}>
              {o.years} yr
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** "Use it for": the app this domain will serve (optional; attach later). */
function UseFor({ s, d }: { s: ServicesPalette; d: CartDomain }) {
  const [open, setOpen] = React.useState(false);
  const patch = useAppCart((c) => c.patchDomain);
  const apps = useUserTenants();
  const app = apps.data?.find((a) => String(a.id) === String(d.tenant_id));
  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
        scaleTo={0.98}
        style={[st.forRow, { backgroundColor: s.inset }]}
      >
        <Text style={[st.forLabel, { color: s.muted }]}>Use it for</Text>
        <Text
          style={[st.forValue, { color: app ? s.text : s.sub }]}
          numberOfLines={1}
        >
          {app ? `${app.title} · ${appKind(app)}` : 'Choose an app (optional)'}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={s.muted} />
      </PressableScale>
      <AppSheet
        s={s}
        open={open}
        title="Use this domain for"
        value={d.tenant_id}
        onClose={() => setOpen(false)}
        onPick={(a) => {
          patch({ tenant_id: a.id });
          setOpen(false);
        }}
      />
    </>
  );
}

/** The domain in the cart: name, years, price, app, remove. */
export function DomainLine({ s, d }: { s: ServicesPalette; d: CartDomain }) {
  const setDomain = useAppCart((c) => c.setDomain);
  const { money } = useMoney();
  return (
    <View style={st.wrap}>
      <View style={st.row}>
        <View style={st.body}>
          <Text style={[st.name, { color: s.text }]} numberOfLines={1}>
            {d.name}
          </Text>
          <Text style={[st.kind, { color: s.muted }]}>
            Domain · {d.years} yr · HTTPS + setup included
          </Text>
        </View>
        <Text style={[st.price, { color: s.text }]}>{money(d.price_inr)}</Text>
        <PressableScale
          onPress={() => setDomain(null)}
          hitSlop={8}
          accessibilityLabel={`Remove ${d.name}`}
          style={[st.remove, { backgroundColor: s.inset }]}
        >
          <Ionicons name="close" size={14} color={s.sub} />
        </PressableScale>
      </View>
      <Years s={s} d={d} />
      <UseFor s={s} d={d} />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 8, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { flex: 1 },
  name: { fontFamily: F.sans700, fontSize: 14.5 },
  kind: { fontFamily: F.sans500, fontSize: 11.5, marginTop: 1 },
  price: { fontFamily: F.sans600, fontSize: 14 },
  remove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 9,
    height: 28,
    justifyContent: 'center',
  },
  chipText: { fontFamily: F.sans600, fontSize: 11.5 },
  forRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  forLabel: { fontFamily: F.sans600, fontSize: 11.5 },
  forValue: {
    flex: 1,
    fontFamily: F.sans600,
    fontSize: 13,
    textAlign: 'right',
  },
});
