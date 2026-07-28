import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

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

// Same fade recipe as Hero's heading / HowItWorks — one GradientText per line.
function HeadingLine({ text, t }: { text: string; t: HomeColors }) {
  return (
    <GradientText
      style={s.heading}
      colors={[t.text, t.text, t.heroHeadingFade]}
      locations={[0, 0.52, 1]}
    >
      {text}
    </GradientText>
  );
}

export function WhatsInsideSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as HowItWorks, so the shared
    // TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <View style={s.eyebrowRow}>
        <View style={[s.eyebrowDot, { backgroundColor: t.accent }]} />
        <Text style={[s.eyebrow, { color: t.tagText }]}>WHAT'S INSIDE</Text>
      </View>

      <View style={s.headingWrap}>
        <HeadingLine text="AI speed," t={t} />
        <HeadingLine text="human craft." t={t} />
      </View>

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
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 56,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: F.sans700,
    fontSize: 12,
    letterSpacing: 1.6,
  },

  headingWrap: {
    marginBottom: 26,
  },
  heading: {
    fontFamily: F.display900,
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 36,
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
});
