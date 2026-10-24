import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MarketTemplate } from '@/api/templates';
import {
  categoryOf,
  kindOf,
  titleOf,
} from '@/containers/Home/TemplateReel/layout';
import { pillTone } from '@/containers/Home/TemplateReel/pills';
import { F } from '@/lib/fonts';

import type { PageTheme } from './theme';

/**
 * What the details say — only the template's own fields: title,
 * category + kind pills, description, tags and (for an ecosystem) the apps
 * it contains. No invented marketing copy.
 */

export function Pill({ label, dark }: { label: string; dark: boolean }) {
  const tone = pillTone(label, dark);
  return (
    <View
      style={[s.pill, { backgroundColor: tone.bg, borderColor: tone.edge }]}
    >
      <Text style={[s.pillText, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

function Chips({ tags, t }: { tags: string[]; t: PageTheme }) {
  if (tags.length === 0) return null;
  return (
    <View style={s.chips}>
      {tags.map((tag) => (
        <View
          key={tag}
          style={[s.chip, { backgroundColor: t.chip, borderColor: t.chipEdge }]}
        >
          <Text style={[s.chipText, { color: t.ink }]}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

type EcoApp = { id: number; title: string; label?: string; app_type?: string };

function EcosystemApps({ apps, t }: { apps: EcoApp[]; t: PageTheme }) {
  if (apps.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={[s.heading, { color: t.muted }]}>
        {`IN THIS ECOSYSTEM · ${apps.length}`}
      </Text>
      {apps.map((app) => (
        <View key={app.id} style={[s.row, { borderColor: t.edge }]}>
          <Text numberOfLines={1} style={[s.rowTitle, { color: t.ink }]}>
            {app.title}
          </Text>
          <Text style={[s.rowMeta, { color: t.muted }]}>
            {app.label || (app.app_type === 'mobile' ? 'App' : 'Website')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function pillsOf(template: MarketTemplate) {
  const category = categoryOf(template);
  const kind = kindOf(template);
  const out = category ? [category, kind] : [kind];
  if (template.kind === 'code' && template.featured) out.push('Featured');
  return out;
}

/** The details box's highlight chips: what kind of template this is —
 *  its category, then its own tags ("E-commerce", "Fashion"…), then
 *  App / Website. Deduplicated, case-insensitively; the row clips what
 *  does not fit. */
export function highlightsOf(template: MarketTemplate) {
  const category = categoryOf(template);
  const tags = template.kind === 'code' ? (template.tags ?? []) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [category, ...tags, kindOf(template)]) {
    const label = (raw || '').trim();
    const k = label.toLowerCase();
    if (!label || seen.has(k)) continue;
    seen.add(k);
    // Tags are often lower-case ("food"); chips read as titles.
    out.push(label[0].toUpperCase() + label.slice(1));
  }
  return out;
}

function tagsOf(template: MarketTemplate, pills: string[]) {
  const seen = new Set(pills.map((x) => x.toLowerCase()));
  return (template.tags ?? []).filter((x) => {
    const k = x.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

type Props = { template: MarketTemplate; t: PageTheme; dark: boolean };

export const TemplateInfo = React.memo(function TemplateInfo({
  template,
  t,
  dark,
}: Props) {
  const pills = pillsOf(template);
  const tags = tagsOf(template, pills);
  const apps = (template.kind === 'code' && template.ecosystem?.apps) || [];
  return (
    <View>
      <Text style={[s.title, { color: t.ink }]}>{titleOf(template)}</Text>
      <View style={s.pills}>
        {pills.map((p) => (
          <Pill key={p} label={p} dark={dark} />
        ))}
      </View>
      {template.description ? (
        <Text style={[s.body, { color: t.muted }]}>{template.description}</Text>
      ) : null}
      <Chips tags={tags} t={t} />
      <EcosystemApps apps={apps} t={t} />
    </View>
  );
});

const s = StyleSheet.create({
  title: {
    fontFamily: F.display900,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.8,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  pill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  pillText: { fontFamily: F.sans600, fontSize: 11.5 },
  body: {
    fontFamily: F.sans400,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  chipText: { fontFamily: F.sans500, fontSize: 12.5 },
  section: { marginTop: 26 },
  heading: { fontFamily: F.sans600, fontSize: 11, letterSpacing: 1.1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { flex: 1, fontFamily: F.sans600, fontSize: 15 },
  rowMeta: { fontFamily: F.sans500, fontSize: 13 },
});
