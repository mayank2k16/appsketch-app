import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';

/** One App Store-style block: a bold heading over a panel-coloured card,
 *  so text stays readable over the blurred backdrop. */
export function Section({
  title,
  aside,
  t,
  children,
}: {
  title?: string;
  aside?: string;
  t: PageTheme;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.card, { backgroundColor: t.panel, borderColor: t.edge }]}>
      {title ? (
        <View style={s.head}>
          <Text style={[s.title, { color: t.ink }]}>{title}</Text>
          {aside ? (
            <Text style={[s.aside, { color: t.muted }]}>{aside}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export const shortDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

const s = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 12,
    borderCurve: 'continuous',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontFamily: F.sans800, fontSize: 19 },
  aside: { fontFamily: F.sans600, fontSize: 13 },
});
