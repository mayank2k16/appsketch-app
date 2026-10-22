import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { openCategory } from '@/lib/category-route';
import { F } from '@/lib/fonts';

import { CARD_EDGE_W, cardEdge, RADIUS } from './geometry';
import { stageOf, useStudioActions } from './studio-context';

/**
 * The bento's non-template tiles, like the "Music" word and "+ Add Songs"
 * on an iOS widget stack:
 *  - TypeTile: a category as one big bold word on a pastel stage. Tapping it
 *    opens that category's screen (`/category/[name]`); the rail chips still
 *    filter Home in place.
 *  - ActionTile: "Create yours" — scrolls Home back to the prompt and
 *    focuses it.
 */

/** "Fashion & Apparel" → "Fashion"; "Resorts and homestays" → "Resorts". */
export const wordOf = (category: string) =>
  category.split(/\s*(?:&|\band\b|,)\s*/)[0] || category;

export const TypeTile = React.memo(function TypeTile({
  category,
  count,
}: {
  category: string;
  count: number;
}) {
  const { dark } = useStudioActions();
  const router = useRouter();
  const ink = dark ? '#F4F4F5' : '#0B0B0C';
  return (
    <PressableScale
      scaleTo={0.97}
      onPress={() => openCategory(router, category)}
      accessibilityRole="button"
      accessibilityLabel={`Show ${category} templates`}
      style={[s.card, s.fill]}
    >
      <LinearGradient
        colors={stageOf(category, dark)}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={[s.word, { color: ink }]}
      >
        {wordOf(category)}
      </Text>
      <View style={s.foot}>
        <Text style={[s.count, { color: ink }]} numberOfLines={1}>
          {count} {count === 1 ? 'template' : 'templates'}
        </Text>
        <Ionicons name="arrow-forward" size={13} color={ink} />
      </View>
    </PressableScale>
  );
});

export const ActionTile = React.memo(function ActionTile() {
  const { dark, create } = useStudioActions();
  const ink = dark ? '#F4F4F5' : '#0B0B0C';
  return (
    <PressableScale
      scaleTo={0.97}
      onPress={create}
      accessibilityRole="button"
      accessibilityLabel="Create your own app"
      style={[
        s.card,
        s.fill,
        s.action,
        {
          backgroundColor: dark ? '#111113' : '#FFFFFF',
          borderColor: cardEdge(dark),
        },
      ]}
    >
      <View style={[s.plus, { backgroundColor: ink }]}>
        <Ionicons name="add" size={18} color={dark ? '#0B0B0C' : '#FFFFFF'} />
      </View>
      <View>
        <Text style={[s.actionTitle, { color: ink }]}>Create yours</Text>
        <Text
          style={[
            s.actionSub,
            { color: dark ? 'rgba(244,244,245,0.6)' : '#5C5D63' },
          ]}
        >
          Describe it, we build it
        </Text>
      </View>
    </PressableScale>
  );
});

const s = StyleSheet.create({
  fill: { flex: 1 },
  card: {
    borderRadius: RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
    padding: 11,
    justifyContent: 'space-between',
  },
  word: {
    fontFamily: F.sans900,
    fontSize: 27,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontFamily: F.sans600, fontSize: 11, flexShrink: 1 },
  action: { borderWidth: CARD_EDGE_W },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontFamily: F.sans800, fontSize: 15, letterSpacing: -0.3 },
  actionSub: { fontFamily: F.sans500, fontSize: 10.5, marginTop: 2 },
});
