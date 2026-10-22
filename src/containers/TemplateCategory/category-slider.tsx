import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { W } from '../Home/Studio/geometry';
import { type CatColors, EDGE_W } from './theme';
import type { CategoryInfo } from './use-category-data';

/**
 * The second row: every category as a chip with its count ("All" first),
 * the active one an ink pill. The active chip is scrolled to the middle of
 * the rail whenever the category changes (chip, panel or type tile).
 */

const Chip = React.memo(function Chip({
  cat,
  active,
  c,
  onPress,
}: {
  cat: CategoryInfo;
  active: boolean;
  c: CatColors;
  onPress: (name: string) => void;
}) {
  const bg = active ? c.ink : c.surface;
  const fg = active ? c.onInk : c.ink;
  return (
    <PressableScale
      onPress={() => onPress(cat.name)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${cat.name}, ${cat.count} templates`}
      style={[
        s.chip,
        { backgroundColor: bg, borderColor: active ? c.ink : c.edge },
      ]}
    >
      <Text style={[s.chipText, { color: fg }]}>{cat.name}</Text>
      <Text style={[s.chipCount, { color: active ? fg : c.muted }]}>
        {cat.count}
      </Text>
    </PressableScale>
  );
});

type Props = {
  c: CatColors;
  categories: CategoryInfo[];
  category: string;
  onPick: (name: string) => void;
};

export const CategorySlider = React.memo(function CategorySlider({
  c,
  categories,
  category,
  onPick,
}: Props) {
  const rail = React.useRef<ScrollView>(null);
  const spots = React.useRef(new Map<string, { x: number; w: number }>());
  const first = React.useRef(true);
  const center = React.useCallback((name: string, animated: boolean) => {
    const at = spots.current.get(name);
    if (!at) return;
    const x = Math.max(0, at.x - (W - at.w) / 2);
    rail.current?.scrollTo({ x, animated });
  }, []);
  React.useEffect(() => {
    center(category, !first.current);
    first.current = false;
  }, [category, center]);
  return (
    <ScrollView
      ref={rail}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.rail}
      keyboardShouldPersistTaps="handled"
    >
      {categories.map((cat) => (
        <View
          key={cat.name}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            spots.current.set(cat.name, { x, w: width });
            // The route's category lands before the chips have laid out.
            if (cat.name === category) center(category, false);
          }}
        >
          <Chip
            cat={cat}
            active={cat.name === category}
            c={c}
            onPress={onPick}
          />
        </View>
      ))}
    </ScrollView>
  );
});

const s = StyleSheet.create({
  rail: { paddingHorizontal: 8, gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: EDGE_W,
  },
  chipText: { fontFamily: F.sans600, fontSize: 13, letterSpacing: -0.1 },
  chipCount: { fontFamily: F.sans500, fontSize: 11.5 },
});
