import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { type CatColors, EDGE_W } from './theme';

/**
 * A friendly stop with a way out — never a dead end: no search matches
 * ("Clear search", and "Search all categories" when inside one), an unknown
 * or empty category ("See all templates"), or a failed load ("Try again").
 */

export type EmptyAction = { label: string; onPress: () => void };

type Props = {
  c: CatColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  primary: EmptyAction;
  secondary?: EmptyAction;
};

export const EmptyState = React.memo(function EmptyState({
  c,
  icon,
  title,
  body,
  primary,
  secondary,
}: Props) {
  return (
    <View style={s.root}>
      <View
        style={[s.badge, { backgroundColor: c.surface, borderColor: c.edge }]}
      >
        <Ionicons name={icon} size={22} color={c.ink} />
      </View>
      <Text style={[s.title, { color: c.ink }]}>{title}</Text>
      <Text style={[s.body, { color: c.sub }]}>{body}</Text>
      <View style={s.actions}>
        <PressableScale
          onPress={primary.onPress}
          style={[s.btn, { backgroundColor: c.ink, borderColor: c.ink }]}
        >
          <Text style={[s.btnText, { color: c.onInk }]}>{primary.label}</Text>
        </PressableScale>
        {secondary ? (
          <PressableScale
            onPress={secondary.onPress}
            style={[s.btn, { backgroundColor: c.surface, borderColor: c.edge }]}
          >
            <Text style={[s.btnText, { color: c.ink }]}>{secondary.label}</Text>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: EDGE_W,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: F.sans700,
    fontSize: 18,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  body: {
    fontFamily: F.sans500,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },
  actions: { marginTop: 20, gap: 8, alignItems: 'center' },
  btn: {
    height: 42,
    minWidth: 180,
    paddingHorizontal: 20,
    borderRadius: 21,
    borderWidth: EDGE_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.sans600, fontSize: 14.5, letterSpacing: -0.1 },
});
