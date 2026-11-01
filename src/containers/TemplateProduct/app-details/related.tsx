import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CodeTemplate, MarketTemplate } from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { openTemplate } from '@/lib/template-transition';

import type { PageTheme } from '../theme';
import { Section } from './section';

/** "You might also like": the backend's related templates, as rows like
 *  the App Store's lists. A tap opens that template's own page. */
export function Related({ items, t }: { items: CodeTemplate[]; t: PageTheme }) {
  const router = useRouter();
  if (!items.length) return null;
  return (
    <Section title="You might also like" t={t}>
      {items.slice(0, 6).map((r, i) => (
        <PressableScale
          key={r.id}
          onPress={() =>
            openTemplate(router, {
              template: {
                ...r,
                kind: 'code',
                key: `code-${r.id}`,
              } as MarketTemplate,
              rect: null,
              frame: r.app_type === 'mobile' ? 'phone' : 'browser',
            })
          }
        >
          <View
            style={[
              s.row,
              i > 0 && { borderTopColor: t.edge, borderTopWidth: 1 },
            ]}
          >
            <Image
              source={{ uri: r.thumbnail_url || r.screenshots?.[0]?.url }}
              style={[s.icon, { backgroundColor: t.chip }]}
              contentFit="cover"
              contentPosition="top"
            />
            <View style={s.text}>
              <Text style={[s.title, { color: t.ink }]} numberOfLines={1}>
                {r.title}
              </Text>
              <Text style={[s.sub, { color: t.muted }]} numberOfLines={2}>
                {r.category || (r.app_type === 'mobile' ? 'App' : 'Website')}
                {r.description ? ` · ${r.description}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.muted} />
          </View>
        </PressableScale>
      ))}
    </Section>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  icon: { width: 56, height: 56, borderRadius: 14 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: F.sans700, fontSize: 14.5 },
  sub: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17 },
});
