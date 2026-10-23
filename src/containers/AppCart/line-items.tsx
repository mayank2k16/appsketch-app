import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Catalogue, CatalogueItem } from '@/api/app-cart';
import { buildName, inr, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import { useAppCart } from '@/lib/store/app-cart-store';

function Row({
  s,
  item,
  kind,
  onRemove,
}: {
  s: ServicesPalette;
  item: CatalogueItem;
  kind: string;
  onRemove: () => void;
}) {
  return (
    <View style={[st.row, { borderColor: s.hairline }]}>
      <View style={st.body}>
        <Text style={[st.name, { color: s.text }]}>
          {kind === 'Build' ? `${buildName(item.name)} app` : item.name}
        </Text>
        <Text style={[st.kind, { color: s.muted }]}>{kind} · one-time</Text>
      </View>
      <Text style={[st.price, { color: s.text }]}>{inr(item.price_inr)}</Text>
      <PressableScale
        onPress={onRemove}
        hitSlop={8}
        accessibilityLabel={`Remove ${item.name}`}
        style={[st.remove, { backgroundColor: s.inset }]}
      >
        <Ionicons name="close" size={14} color={s.sub} />
      </PressableScale>
    </View>
  );
}

/** Builds and extras in the cart, each removable. Removing the last build
 *  drops the extras too (they run on a build). */
export function LineItems({ s, cat }: { s: ServicesPalette; cat: Catalogue }) {
  const ids = useAppCart((c) => c.addonIds);
  const removeAddon = useAppCart((c) => c.removeAddon);
  const buildIds = cat.builds.map((b) => b.id);
  const rows = [
    ...cat.builds
      .filter((b) => ids.includes(b.id))
      .map((item) => ({ item, kind: 'Build' })),
    ...cat.extras
      .filter((e) => ids.includes(e.id))
      .map((item) => ({ item, kind: 'Extra' })),
  ];
  if (!rows.length) return null;
  return (
    <View>
      {rows.map(({ item, kind }) => (
        <Row
          key={item.id}
          s={s}
          item={item}
          kind={kind}
          onRemove={() => {
            haptic.select();
            removeAddon(item.id, buildIds);
          }}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1 },
  name: { fontFamily: F.sans600, fontSize: 14 },
  kind: { fontFamily: F.sans500, fontSize: 11.5, marginTop: 1 },
  price: { fontFamily: F.sans600, fontSize: 14 },
  remove: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
