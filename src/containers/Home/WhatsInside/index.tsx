import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme } from '../theme/HomeTheme';

// Explicit pixel width for the 2-col grid — a plain '48%' width resolves to
// 0 here (same trap MockupCard's grid hit: no ancestor in this chain sets an
// explicit width for the percentage to resolve against).
const { width: SCREEN_W } = Dimensions.get('window');
const SECTION_PAD_H = 22 * 2;
const GRID_GAP = 12;
const CARD_W = (SCREEN_W - SECTION_PAD_H - GRID_GAP) / 2;

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}[] = [
    {
      icon: 'sparkles-outline',
      iconBg: 'rgba(139,92,246,0.16)',
      iconColor: '#8B5CF6',
      title: 'Agentic code gen',
      desc: 'Writes fast-moving code and scaffolds your app in minutes.',
    },
    {
      icon: 'flash-outline',
      iconBg: 'rgba(108,92,231,0.16)',
      iconColor: '#6C5CE7',
      title: 'Proprietary LLM',
      desc: "Your app's structure, built from our own model.",
    },
    {
      icon: 'layers-outline',
      iconBg: 'rgba(34,211,238,0.16)',
      iconColor: '#22D3EE',
      title: 'Any platform',
      desc: 'Web, mobile and internal tools from one brief.',
    },
    {
      icon: 'add-circle-outline',
      iconBg: 'rgba(139,92,246,0.16)',
      iconColor: '#8B5CF6',
      title: 'Human in the loop',
      desc: 'Real engineers refine every build to spec.',
    },
    {
      icon: 'create-outline',
      iconBg: 'rgba(59,130,246,0.16)',
      iconColor: '#3B82F6',
      title: 'Production-ready',
      desc: 'Tested, integrated and deployed to launch.',
    },
    {
      icon: 'sync-outline',
      iconBg: 'rgba(34,211,238,0.16)',
      iconColor: '#22D3EE',
      title: 'Fraction of the cost',
      desc: 'Enterprise-grade apps without agency pricing.',
    },
  ];

const STATS: { value: string; label: string }[] = [
  { value: '10×', label: 'lower cost' },
  { value: '48h', label: 'to production' },
  { value: '500+', label: 'businesses shipped' },
  { value: '100%', label: 'human-reviewed' },
];

export function WhatsInsideSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as HowItWorks, so the shared
    // TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <SectionHeading
        eyebrow="WHAT'S INSIDE"
        lines={['AI speed,', 'human craft.']}
        t={t}
      />

      <View style={s.grid}>
        {FEATURES.map((f) => (
          <View
            key={f.title}
            style={[s.card, { width: CARD_W, backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
          >
            <View style={[s.iconBadge, { backgroundColor: f.iconBg }]}>
              <Ionicons name={f.icon} size={20} color={f.iconColor} />
            </View>
            <Text style={[s.cardTitle, { color: t.text }]}>{f.title}</Text>
            <Text style={[s.cardDesc, { color: t.textSub }]}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <View style={[s.statsCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
        {STATS.map((stat, i) => (
          <View
            key={stat.label}
            style={[
              s.statCell,
              i % 2 === 0 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.agentTabBorder },
              i < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.agentTabBorder },
            ]}
          >
            <Text style={[s.statValue, { color: t.text }]}>{stat.value}</Text>
            <Text style={[s.statLabel, { color: t.textSub }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: F.sans700,
    fontSize: 15.5,
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    lineHeight: 18,
  },

  statsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 30,
    overflow: 'hidden',
  },
  statCell: {
    width: '50%',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  statValue: {
    fontFamily: F.display900,
    fontSize: 35,
    letterSpacing: -0.3,
    marginBottom: 4,
    lineHeight: 40
  },
  statLabel: {
    fontFamily: F.sans400,
    fontSize: 14,
  },
});
