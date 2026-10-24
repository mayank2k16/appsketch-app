import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import type { CatalogueItem } from '@/api/app-cart';
import { inr, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { iconOf, toneOf } from './icons';

function Extra({
  s,
  item,
  on,
  onPress,
}: {
  s: ServicesPalette;
  item: CatalogueItem;
  on: boolean;
  onPress: () => void;
}) {
  const [bg, fg] = toneOf(item.code, s.dark);
  return (
    <PressableScale
      onPress={onPress}
      style={[
        st.extra,
        {
          backgroundColor: s.tile,
          borderColor: on ? s.ink : s.hairline,
          borderWidth: on ? 2 : 1,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${item.name}, add ${inr(item.price_inr)}`}
    >
      <View style={[st.icon, { backgroundColor: bg }]}>
        <Ionicons name={iconOf(item.code)} size={13} color={fg} />
      </View>
      <View style={st.text}>
        <Text style={[st.name, { color: s.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[st.price, { color: s.sub }]}>
          + {inr(item.price_inr)}
        </Text>
      </View>
      <View style={[st.toggle, { backgroundColor: on ? s.ink : s.inset }]}>
        <Ionicons
          name={on ? 'checkmark' : 'add'}
          size={13}
          color={on ? s.onInk : s.text}
        />
      </View>
    </PressableScale>
  );
}

/** Step 2: extras, locked (55%) until a build is picked; unlock eases in. */
export function ExtrasGrid({
  s,
  items,
  picked,
  unlocked,
  onToggle,
}: {
  s: ServicesPalette;
  items: CatalogueItem[];
  picked: number[];
  unlocked: boolean;
  onToggle: (id: number) => void;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(unlocked ? 1 : 0.55, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    }),
  }));
  return (
    <Animated.View style={[st.grid, fade]}>
      {items.map((item) => (
        <View key={item.id} style={st.cell}>
          <Extra
            s={s}
            item={item}
            on={picked.includes(item.id)}
            onPress={() => onToggle(item.id)}
          />
        </View>
      ))}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '50%', padding: 4 },
  // flex: tiles in a row share the tallest one's height.
  extra: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  name: { fontFamily: F.sans600, fontSize: 12.5, lineHeight: 15 },
  price: { fontFamily: F.sans600, fontSize: 11.5, marginTop: 1 },
  toggle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
