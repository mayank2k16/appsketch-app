import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

// Explicit pixel width for the 2-col grid — a plain '48%' width resolves to
// 0 here (same trap MockupCard's grid hit: no ancestor in this chain sets an
// explicit width for the percentage to resolve against).
const { width: SCREEN_W } = Dimensions.get('window');
const SECTION_PAD = 8;
const GRID_GAP = 9;
const CARD_W = (SCREEN_W - SECTION_PAD * 2 - GRID_GAP) / 2;

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

function FeatureCard({
  feature,
  t,
}: {
  feature: (typeof FEATURES)[number];
  t: HomeColors;
}) {
  return (
    <View
      style={[
        s.card,
        { width: CARD_W, backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder },
      ]}
    >
      <View style={[s.iconBadge, { backgroundColor: feature.iconBg }]}>
        <Ionicons name={feature.icon} size={19} color={feature.iconColor} />
      </View>
      <Text style={[s.cardTitle, { color: t.text }]}>{feature.title}</Text>
      <Text style={[s.cardDesc, { color: t.textSub }]}>{feature.desc}</Text>
    </View>
  );
}

function StatCell({
  stat,
  index,
  t,
  borderColor,
}: {
  stat: (typeof STATS)[number];
  index: number;
  t: HomeColors;
  borderColor: string;
}) {
  return (
    <View
      style={[
        s.statCell,
        index % 2 === 0 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: borderColor },
        index < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <Text style={[s.statValue, { color: t.text }]}>{stat.value}</Text>
      <Text style={[s.statLabel, { color: t.textSub }]}>{stat.label}</Text>
    </View>
  );
}

export function WhatsInsideSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as HowItWorks, so the shared
    // TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <SectionHeading
        eyebrow="WHAT'S INSIDE"
        lines={['AI speed, human', 'craft.']}
        t={t}
      />

      <View style={s.grid}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} feature={f} t={t} />
        ))}
      </View>

      <View
        style={[s.statsCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
      >
        {STATS.map((stat, i) => (
          <StatCell key={stat.label} stat={stat} index={i} t={t} borderColor={t.agentTabBorder} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    // Matches the shared 8px gutter used by every Home section below the
    // fold — cards carry their own inner padding on top of this.
    paddingHorizontal: SECTION_PAD,
    paddingTop: 20,
    paddingBottom: 30,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  cardTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 5,
  },
  cardDesc: {
    fontFamily: F.sans400,
    fontSize: 12.5,
    lineHeight: 17,
  },

  statsCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 22,
    overflow: 'hidden',
  },
  statCell: {
    width: '50%',
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  statValue: {
    fontFamily: F.display900,
    fontSize: 33,
    letterSpacing: -0.3,
    lineHeight: 38,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: F.sans400,
    fontSize: 13.5,
  },
});
