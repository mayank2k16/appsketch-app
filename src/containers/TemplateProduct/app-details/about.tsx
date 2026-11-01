import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';

import type { PageTheme } from '../theme';
import { Section } from './section';

/** The description (collapsed to 4 lines with More), the feature list,
 *  and the tags. */
export function About({
  text,
  features,
  tags,
  t,
}: {
  text: string;
  features: string[];
  tags: string[];
  t: PageTheme;
}) {
  const [open, setOpen] = React.useState(false);
  if (!text && !features.length && !tags.length) return null;
  return (
    <Section title="About this app" t={t}>
      {text ? (
        <Pressable onPress={() => setOpen((o) => !o)}>
          <Text
            style={[s.body, { color: t.ink }]}
            numberOfLines={open ? undefined : 4}
          >
            {text}
          </Text>
          {!open && text.length > 180 ? (
            <Text style={[s.more, { color: t.frame }]}>More</Text>
          ) : null}
        </Pressable>
      ) : null}
      {features.map((f) => (
        <View key={f} style={s.feature}>
          <View style={[s.dot, { backgroundColor: t.frame }]} />
          <Text style={[s.featureText, { color: t.ink }]}>{f}</Text>
        </View>
      ))}
      {tags.length ? (
        <View style={s.tags}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[
                s.tag,
                { backgroundColor: t.chip, borderColor: t.chipEdge },
              ]}
            >
              <Text style={[s.tagText, { color: t.ink }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );
}

const s = StyleSheet.create({
  body: { fontFamily: F.sans400, fontSize: 14.5, lineHeight: 21 },
  more: { fontFamily: F.sans700, fontSize: 14, marginTop: 4 },
  feature: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  featureText: { flex: 1, fontFamily: F.sans500, fontSize: 14, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontFamily: F.sans600, fontSize: 12 },
});
