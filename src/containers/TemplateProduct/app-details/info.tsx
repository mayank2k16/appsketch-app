import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CodeTemplateDetail } from '@/api/templates';
import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';
import { Section, shortDate } from './section';

/** The App Store's "Information" table. */
export function Info({
  detail,
  screens,
  t,
}: {
  detail?: CodeTemplateDetail;
  screens: number;
  t: PageTheme;
}) {
  const eco = detail?.ecosystem;
  const rows = [
    ['Category', detail?.category || '—'],
    ['Type', detail?.app_type === 'mobile' ? 'Mobile app' : 'Website'],
    ['Updated', shortDate(detail?.updated_on) || '—'],
    ['Screens', String(screens)],
    eco?.name
      ? ['Ecosystem', `${eco.name} · ${eco.apps?.length ?? 0} apps`]
      : null,
    ['Made with', 'AppSketch'],
  ].filter(Boolean) as [string, string][];
  return (
    <Section title="Information" t={t}>
      {rows.map(([k, v], i) => (
        <View
          key={k}
          style={[
            s.row,
            i > 0 && { borderTopColor: t.edge, borderTopWidth: 1 },
          ]}
        >
          <Text style={[s.k, { color: t.muted }]}>{k}</Text>
          <Text style={[s.v, { color: t.ink }]} numberOfLines={1}>
            {v}
          </Text>
        </View>
      ))}
    </Section>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
  },
  k: { fontFamily: F.sans500, fontSize: 14 },
  v: { flexShrink: 1, fontFamily: F.sans600, fontSize: 14, textAlign: 'right' },
});
