import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { ALL_CATEGORIES } from '@/lib/category-route';
import { F } from '@/lib/fonts';

import { Shot } from '../Home/TemplateReel/shot';
import { type CatColors, EDGE_W } from './theme';
import type { CategoryInfo } from './use-category-data';

/** One category in the browse panel: three tiny screenshots (top-left
 *  anchored), its name and count; the active one sits on an inset fill
 *  with an ink edge and a check. */

const THUMB_W = 26;
const THUMB_H = 36;

const Thumbs = React.memo(function Thumbs({
  uris,
  c,
}: {
  uris: string[];
  c: CatColors;
}) {
  return (
    <View style={s.thumbs}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[s.thumb, { borderColor: c.edge, backgroundColor: c.inset }]}
        >
          {uris[i] ? <Shot uri={uris[i]} bg={c.inset} /> : null}
        </View>
      ))}
    </View>
  );
});

type Props = {
  cat: CategoryInfo;
  active: boolean;
  c: CatColors;
  onPick: (name: string) => void;
};

export const PanelRow = React.memo(function PanelRow({
  cat,
  active,
  c,
  onPick,
}: Props) {
  const label = cat.name === ALL_CATEGORIES ? 'All templates' : cat.name;
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => onPick(cat.name)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${cat.count} templates`}
      style={[
        s.row,
        {
          backgroundColor: active ? c.inset : 'transparent',
          borderColor: active ? c.ink : 'transparent',
        },
      ]}
    >
      <Thumbs uris={cat.thumbs} c={c} />
      <View style={s.text}>
        <Text numberOfLines={1} style={[s.name, { color: c.ink }]}>
          {label}
        </Text>
        <Text style={[s.count, { color: c.sub }]}>
          {cat.count} {cat.count === 1 ? 'template' : 'templates'}
        </Text>
      </View>
      {active ? (
        <Ionicons name="checkmark" size={18} color={c.ink} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={c.muted} />
      )}
    </PressableScale>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: EDGE_W,
  },
  thumbs: { flexDirection: 'row', gap: 3 },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 6,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: F.sans600, fontSize: 15, letterSpacing: -0.2 },
  count: { fontFamily: F.sans500, fontSize: 12 },
});
