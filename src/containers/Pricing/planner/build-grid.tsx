import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import type { CatalogueItem } from '@/api/app-cart';
import { buildName, inr, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { iconOf, toneOf } from './icons';

type TileProps = {
  s: ServicesPalette;
  item: CatalogueItem;
  on: boolean;
  nudge: SharedValue<number>;
  onPress: () => void;
};

function Tile({ s, item, on, nudge, onPress }: TileProps) {
  const [bg, fg] = toneOf(item.code, s.dark);
  const ring = useAnimatedStyle(() => ({
    borderColor: on
      ? s.ink
      : interpolateColor(nudge.value, [0, 1], [s.hairline, s.orange]),
    transform: [{ translateY: -3 * nudge.value }],
  }));
  return (
    <PressableScale
      onPress={onPress}
      style={st.cell}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${buildName(item.name)}, from ${inr(item.price_inr)}`}
    >
      <Animated.View
        style={[
          st.tile,
          { backgroundColor: s.tile, borderWidth: on ? 2 : 1 },
          ring,
        ]}
      >
        <View style={st.top}>
          <View style={[st.icon, { backgroundColor: bg }]}>
            <Ionicons name={iconOf(item.code)} size={15} color={fg} />
          </View>
          <View
            style={[
              st.tick,
              on
                ? { backgroundColor: s.ink, borderColor: s.ink }
                : { borderColor: s.hairline },
            ]}
          >
            {on ? (
              <Ionicons name="checkmark" size={11} color={s.onInk} />
            ) : null}
          </View>
        </View>
        <Text style={[st.name, { color: s.text }]} numberOfLines={1}>
          {buildName(item.name)}
        </Text>
        <Text style={[st.price, { color: s.text }]} numberOfLines={1}>
          <Text style={[st.from, { color: s.muted }]}>from </Text>
          {inr(item.price_inr)}
        </Text>
        <Text style={[st.desc, { color: s.sub }]} numberOfLines={3}>
          {item.description}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

/** Step 1: the one-time builds (Android / iOS / Web), pick one or more. */
export function BuildGrid({
  s,
  items,
  picked,
  nudge,
  onToggle,
}: {
  s: ServicesPalette;
  items: CatalogueItem[];
  picked: number[];
  nudge: SharedValue<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <View style={st.grid}>
      {items.map((item) => (
        <Tile
          key={item.id}
          s={s}
          item={item}
          on={picked.includes(item.id)}
          nudge={nudge}
          onPress={() => onToggle(item.id)}
        />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  tile: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 11,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: F.sans700, fontSize: 14.5, letterSpacing: -0.2 },
  price: { fontFamily: F.sans600, fontSize: 12.5, marginTop: 2 },
  from: { fontFamily: F.sans500, fontSize: 11 },
  desc: { fontFamily: F.sans400, fontSize: 11, lineHeight: 14.5, marginTop: 5 },
});
