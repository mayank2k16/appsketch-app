import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TemplateComment } from '@/api/templates';
import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';
import { Section, shortDate } from './section';

const initialOf = (name: string) => (name.trim()[0] || '?').toUpperCase();

/** What people said about the template (newest first, up to 8). */
export function Comments({
  comments,
  total,
  t,
}: {
  comments: TemplateComment[];
  total: number;
  t: PageTheme;
}) {
  const count = Math.max(total, comments.length);
  return (
    <Section title="Comments" aside={count ? `${count}` : undefined} t={t}>
      {comments.length === 0 ? (
        <Text style={[s.empty, { color: t.muted }]}>No comments yet.</Text>
      ) : (
        comments.slice(0, 8).map((c, i) => (
          <View
            key={c.id}
            style={[
              s.row,
              i > 0 && { borderTopColor: t.edge, borderTopWidth: 1 },
            ]}
          >
            <View style={[s.avatar, { backgroundColor: t.chip }]}>
              <Text style={[s.initial, { color: t.ink }]}>
                {initialOf(c.author)}
              </Text>
            </View>
            <View style={s.text}>
              <Text style={[s.author, { color: t.ink }]}>
                {c.author}
                <Text style={[s.date, { color: t.muted }]}>
                  {'  '}
                  {shortDate(c.created_on)}
                </Text>
              </Text>
              <Text style={[s.body, { color: t.ink }]}>{c.body}</Text>
            </View>
          </View>
        ))
      )}
    </Section>
  );
}

const s = StyleSheet.create({
  empty: { fontFamily: F.sans500, fontSize: 13.5 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: F.sans800, fontSize: 14 },
  text: { flex: 1, gap: 2 },
  author: { fontFamily: F.sans700, fontSize: 13.5 },
  date: { fontFamily: F.sans500, fontSize: 12 },
  body: { fontFamily: F.sans400, fontSize: 14, lineHeight: 20 },
});
