import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CodeTemplateDetail, MarketTemplate } from '@/api/templates';
import { thumbOf } from '@/containers/Home/TemplateReel/layout';
import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';
import { Section } from './section';

type Stat = { top: string; big: string; small: string; icon?: string };

function statsOf(t: MarketTemplate, d?: CodeTemplateDetail): Stat[] {
  const code = t.kind === 'code' ? t : null;
  const r = d?.ratings;
  return [
    {
      top: r?.count ? `${r.count} RATINGS` : 'RATINGS',
      big: r?.count ? r.average.toFixed(1) : 'New',
      small: r?.count
        ? '★★★★★'.slice(0, Math.round(r.average))
        : 'No ratings yet',
    },
    {
      top: 'LIKES',
      big: String(d?.likes ?? 0),
      small: 'people',
      icon: 'heart',
    },
    {
      top: 'SCREENS',
      big: String(code?.screenshots?.length ?? 0),
      small: 'captured',
    },
    { top: 'CATEGORY', big: '', small: code?.category || 'App', icon: 'grid' },
  ];
}

/** Icon, name, category, then the App Store's row of quick stats. */
export function DetailsHeader({
  template,
  detail,
  t,
}: {
  template: MarketTemplate;
  detail?: CodeTemplateDetail;
  t: PageTheme;
}) {
  const title = template.kind === 'code' ? template.title : template.name;
  const icon = thumbOf(template);
  return (
    <Section t={t}>
      <View style={s.row}>
        {icon ? <Image source={{ uri: icon }} style={s.icon} /> : null}
        <View style={s.names}>
          <Text style={[s.title, { color: t.ink }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[s.sub, { color: t.muted }]} numberOfLines={1}>
            {(template.kind === 'code' && template.category) || 'Mobile app'}
          </Text>
        </View>
      </View>
      <View style={[s.stats, { borderTopColor: t.edge }]}>
        {statsOf(template, detail).map((x, i) => (
          <View
            key={x.top}
            style={[
              s.stat,
              i > 0 && { borderLeftColor: t.edge, borderLeftWidth: 1 },
            ]}
          >
            <Text style={[s.statTop, { color: t.muted }]}>{x.top}</Text>
            {x.icon ? (
              <Ionicons name={x.icon as never} size={18} color={t.ink} />
            ) : null}
            {x.big ? (
              <Text style={[s.statBig, { color: t.ink }]}>{x.big}</Text>
            ) : null}
            <Text style={[s.statSmall, { color: t.muted }]} numberOfLines={1}>
              {x.small}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 72, height: 72, borderRadius: 18 },
  names: { flex: 1, gap: 4 },
  title: { fontFamily: F.sans800, fontSize: 20, lineHeight: 24 },
  sub: { fontFamily: F.sans500, fontSize: 13 },
  stats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  statTop: { fontFamily: F.sans700, fontSize: 9.5, letterSpacing: 0.6 },
  statBig: { fontFamily: F.sans800, fontSize: 18 },
  statSmall: { fontFamily: F.sans500, fontSize: 10.5 },
});
