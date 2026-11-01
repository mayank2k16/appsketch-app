import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TemplateRatings, TemplateReview } from '@/api/templates';
import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';
import { Section, shortDate } from './section';

const STARS = ['5', '4', '3', '2', '1'] as const;
const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

function Bars({ r, t }: { r: TemplateRatings; t: PageTheme }) {
  const max = Math.max(1, ...STARS.map((k) => r.histogram[k] ?? 0));
  return (
    <View style={s.bars}>
      {STARS.map((k) => (
        <View key={k} style={s.barRow}>
          <Text style={[s.barLabel, { color: t.muted }]}>{k}</Text>
          <View style={[s.track, { backgroundColor: t.chip }]}>
            <View
              style={[
                s.fill,
                {
                  backgroundColor: t.ink,
                  width: `${((r.histogram[k] ?? 0) / max) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/** The big average, the 5→1 histogram, then review cards. */
export function Ratings({
  ratings,
  reviews,
  t,
}: {
  ratings?: TemplateRatings;
  reviews: TemplateReview[];
  t: PageTheme;
}) {
  const count = ratings?.count ?? 0;
  return (
    <Section
      title="Ratings & Reviews"
      aside={count ? `${count}` : undefined}
      t={t}
    >
      <View style={s.summary}>
        <View style={s.avg}>
          <Text
            style={[s.avgBig, !count && s.avgNew, { color: t.ink }]}
            numberOfLines={1}
          >
            {count ? ratings!.average.toFixed(1) : 'New'}
          </Text>
          <Text style={[s.avgSmall, { color: t.muted }]}>
            {count ? 'out of 5' : 'no ratings yet'}
          </Text>
        </View>
        {ratings ? <Bars r={ratings} t={t} /> : null}
      </View>
      {reviews.length === 0 ? (
        <Text style={[s.empty, { color: t.muted }]}>
          No reviews yet. Be the first to try it and tell others.
        </Text>
      ) : (
        reviews.slice(0, 5).map((r) => (
          <View key={r.id} style={[s.review, { backgroundColor: t.chip }]}>
            <View style={s.reviewTop}>
              <Text style={[s.reviewTitle, { color: t.ink }]} numberOfLines={1}>
                {r.title || r.author}
              </Text>
              <Text style={[s.meta, { color: t.muted }]}>
                {shortDate(r.created_on)}
              </Text>
            </View>
            <Text style={[s.stars, { color: '#F2600C' }]}>
              {stars(r.rating)}
            </Text>
            {r.body ? (
              <Text style={[s.reviewBody, { color: t.ink }]}>{r.body}</Text>
            ) : null}
            {r.title ? (
              <Text style={[s.meta, { color: t.muted }]}>{r.author}</Text>
            ) : null}
          </View>
        ))
      )}
    </Section>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avg: { alignItems: 'center', width: 92 },
  avgBig: { fontFamily: F.sans900, fontSize: 40, lineHeight: 46 },
  avgNew: { fontSize: 30, lineHeight: 40 },
  avgSmall: { fontFamily: F.sans600, fontSize: 12 },
  bars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { fontFamily: F.sans600, fontSize: 10, width: 8 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  empty: { fontFamily: F.sans500, fontSize: 13.5, marginTop: 14 },
  review: { borderRadius: 16, padding: 14, marginTop: 12, gap: 4 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  reviewTitle: { flex: 1, fontFamily: F.sans700, fontSize: 14.5 },
  stars: { fontSize: 13, letterSpacing: 1 },
  reviewBody: { fontFamily: F.sans400, fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: F.sans500, fontSize: 12 },
});
