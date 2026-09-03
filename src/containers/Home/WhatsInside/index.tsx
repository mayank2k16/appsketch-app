import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import {
  HOME_BRAND_RAMP,
  homeTheme,
  type HomeColors,
} from '../theme/HomeTheme';

const [ORANGE, MAGENTA, VIOLET] = HOME_BRAND_RAMP;

/** Icon tile colouring: the glyph at full strength over a 16% wash of itself.
 *  These six tiles used to carry six unrelated hues (violet, indigo, cyan,
 *  blue…), which is what left this grid reading blue next to a warm headline.
 *  They now cycle the three brand stops so the grid stays varied without
 *  introducing a colour the rest of Home does not use. The alpha rides on the
 *  hex itself (`RRGGBBAA`) rather than a hand-written rgba(), so a stop can
 *  only ever be changed in one place — the ramp. */
const tint = (fg: string) => ({ iconBg: `${fg}29`, iconColor: fg });

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
      ...tint(ORANGE),
      title: 'Agentic code gen',
      desc: 'Writes fast-moving code and scaffolds your app in minutes.',
    },
    {
      icon: 'flash-outline',
      ...tint(VIOLET),
      title: 'Proprietary LLM',
      desc: "Your app's structure, built from our own model.",
    },
    {
      icon: 'layers-outline',
      ...tint(MAGENTA),
      title: 'Any platform',
      desc: 'Web, mobile and internal tools from one brief.',
    },
    {
      icon: 'add-circle-outline',
      ...tint(ORANGE),
      title: 'Human in the loop',
      desc: 'Real engineers refine every build to spec.',
    },
    {
      icon: 'create-outline',
      ...tint(VIOLET),
      title: 'Production-ready',
      desc: 'Tested, integrated and deployed to launch.',
    },
    {
      icon: 'sync-outline',
      ...tint(MAGENTA),
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
