import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';

import { SectionHeading } from '../components/SectionHeading';
import { homeTheme } from '../theme/HomeTheme';
import { MockupCard } from './MockupCard';

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'globe-outline',
    title: 'Describe it, watch it build',
    desc: 'Say what you want in plain English. The agent writes the pages, wires up the content and ships a working site — no templates to fight with, no code to touch.',
  },
  {
    icon: 'create-outline',
    title: 'Edit anything, any time',
    desc: 'Change the copy, swap an image, restyle a section — just ask. Every edit previews before it goes live, so nothing ships until you say so.',
  },
];

export function Showcase() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — lets Home's shared TwinkleDots backdrop
    // show through here too, instead of only behind Hero/AgentV2.
    <View style={s.section}>
      <SectionHeading
        eyebrow="THE BUILDER"
        lines={['A single place to', 'build and edit your app']}
        t={t}
      />
      <View style={s.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={s.featureRow}>
            <View style={[s.iconBadge, { backgroundColor: t.accentSoft }]}>
              <Ionicons name={f.icon} size={18} color={t.accent} />
            </View>
            <View style={s.featureText}>
              <Text style={[s.featureTitle, { color: t.text }]}>{f.title}</Text>
              <Text style={[s.featureDesc, { color: t.textSub }]}>
                {f.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <MockupCard t={t} />
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 8,
    paddingTop: 44,
    paddingBottom: 56,
  },

  features: {
    gap: 18,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: F.sans400,
    fontSize: 13,
    lineHeight: 19,
  },
});
