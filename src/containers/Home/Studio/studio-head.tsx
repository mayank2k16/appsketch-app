import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { ReelHeader } from '../TemplateReel/reel-header';
import type { HomeColors } from '../theme/HomeTheme';
import type { StudioCategory } from './use-studio';

/** "Made with AppSketch" and the category rail (All + each, with counts). */

const Chip = React.memo(function Chip({
  cat,
  active,
  dark,
  onPress,
}: {
  cat: StudioCategory;
  active: boolean;
  dark: boolean;
  onPress: (name: string) => void;
}) {
  const ink = dark ? '#F4F4F5' : '#0B0B0C';
  const bg = active ? ink : dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const fg = active ? (dark ? '#0B0B0C' : '#FFFFFF') : ink;
  const edge = active ? ink : dark ? 'rgba(255,255,255,0.12)' : '#E2E2DE';
  return (
    <PressableScale
      haptic={active ? false : 'select'}
      onPress={() => onPress(cat.name)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[s.chip, { backgroundColor: bg, borderColor: edge }]}
    >
      <Text style={[s.chipText, { color: fg }]}>{cat.name}</Text>
      <Text style={[s.chipCount, { color: fg, opacity: 0.55 }]}>
        {cat.count}
      </Text>
    </PressableScale>
  );
});

type Props = {
  t: HomeColors;
  dark: boolean;
  categories: StudioCategory[];
  category: string;
  onPick: (name: string) => void;
};

export const StudioHead = React.memo(function StudioHead({
  t,
  dark,
  categories,
  category,
  onPick,
}: Props) {
  const rail = React.useRef<ScrollView>(null);
  // Keep the active chip in view when a type tile switches category.
  const xs = React.useRef(new Map<string, number>()).current;
  React.useEffect(() => {
    const x = xs.get(category);
    if (x !== undefined) rail.current?.scrollTo({ x: Math.max(0, x - 12) });
  }, [category, xs]);
  return (
    <View style={s.root}>
      <ReelHeader t={t} />
      <ScrollView
        ref={rail}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.rail}
      >
        {categories.map((c) => (
          <View
            key={c.name}
            onLayout={(e) => xs.set(c.name, e.nativeEvent.layout.x)}
          >
            <Chip
              cat={c}
              active={c.name === category}
              dark={dark}
              onPress={onPick}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  root: { gap: 10, paddingBottom: 12 },
  rail: { paddingHorizontal: 8, gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontFamily: F.sans600, fontSize: 13, letterSpacing: -0.1 },
  chipCount: { fontFamily: F.sans500, fontSize: 11 },
});
