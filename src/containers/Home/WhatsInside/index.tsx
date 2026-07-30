import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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

// One card at a time is spotlit; the highlight walks the grid so the section
// never sits still, without six cards all animating at once.
const CARD_CYCLE_MS = 1500;
const STAT_CYCLE_MS = 1700;
const SHEEN_MS = 3600;

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  glow: [string, string];
  title: string;
  desc: string;
}[] = [
    {
      icon: 'sparkles-outline',
      iconBg: 'rgba(139,92,246,0.16)',
      iconColor: '#8B5CF6',
      glow: ['rgba(139,92,246,0.22)', 'rgba(139,92,246,0)'],
      title: 'Agentic code gen',
      desc: 'Writes fast-moving code and scaffolds your app in minutes.',
    },
    {
      icon: 'flash-outline',
      iconBg: 'rgba(108,92,231,0.16)',
      iconColor: '#6C5CE7',
      glow: ['rgba(108,92,231,0.22)', 'rgba(108,92,231,0)'],
      title: 'Proprietary LLM',
      desc: "Your app's structure, built from our own model.",
    },
    {
      icon: 'layers-outline',
      iconBg: 'rgba(34,211,238,0.16)',
      iconColor: '#22D3EE',
      glow: ['rgba(34,211,238,0.20)', 'rgba(34,211,238,0)'],
      title: 'Any platform',
      desc: 'Web, mobile and internal tools from one brief.',
    },
    {
      icon: 'add-circle-outline',
      iconBg: 'rgba(139,92,246,0.16)',
      iconColor: '#8B5CF6',
      glow: ['rgba(139,92,246,0.22)', 'rgba(139,92,246,0)'],
      title: 'Human in the loop',
      desc: 'Real engineers refine every build to spec.',
    },
    {
      icon: 'create-outline',
      iconBg: 'rgba(59,130,246,0.16)',
      iconColor: '#3B82F6',
      glow: ['rgba(59,130,246,0.22)', 'rgba(59,130,246,0)'],
      title: 'Production-ready',
      desc: 'Tested, integrated and deployed to launch.',
    },
    {
      icon: 'sync-outline',
      iconBg: 'rgba(34,211,238,0.16)',
      iconColor: '#22D3EE',
      glow: ['rgba(34,211,238,0.20)', 'rgba(34,211,238,0)'],
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

function useCycle(count: number, ms: number): number {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms]);
  return i;
}

function FeatureCard({
  feature,
  index,
  t,
  active,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  t: HomeColors;
  active: boolean;
}) {
  const a = useSharedValue(0);
  const float = useSharedValue(0);

  // Always-on ambient drift on the icon, staggered per card so the grid
  // breathes as a whole instead of pulsing in lockstep.
  React.useEffect(() => {
    float.value = withDelay(
      index * 320,
      withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    return () => cancelAnimation(float);
  }, [index, float]);

  React.useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: 420 });
  }, [active, a]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(a.value, [0, 1], [1, 1.03]) },
      { translateY: interpolate(a.value, [0, 1], [0, -3]) },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: a.value }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [1.5, -1.5]) },
      { scale: interpolate(a.value, [0, 1], [1, 1.08]) },
    ],
  }));

  return (
    <Reanimated.View
      style={[
        s.card,
        {
          width: CARD_W,
          backgroundColor: t.agentTabBg,
          borderColor: active ? feature.iconColor : t.agentTabBorder,
        },
        cardStyle,
      ]}
    >
      {/* Colour wash bleeding down from the icon while the card is spotlit */}
      <Reanimated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
        <LinearGradient
          colors={feature.glow}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>

      <Reanimated.View style={[s.iconBadge, { backgroundColor: feature.iconBg }, iconStyle]}>
        <Ionicons name={feature.icon} size={19} color={feature.iconColor} />
      </Reanimated.View>
      <Text style={[s.cardTitle, { color: t.text }]}>{feature.title}</Text>
      <Text style={[s.cardDesc, { color: t.textSub }]}>{feature.desc}</Text>
    </Reanimated.View>
  );
}

function StatCell({
  stat,
  index,
  t,
  active,
  borderColor,
}: {
  stat: (typeof STATS)[number];
  index: number;
  t: HomeColors;
  active: boolean;
  borderColor: string;
}) {
  const a = useSharedValue(0);
  React.useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: 400 });
  }, [active, a]);

  const valueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(a.value, [0, 1], [1, 1.09]) }],
    opacity: interpolate(a.value, [0, 1], [0.78, 1]),
  }));
  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: a.value }],
    opacity: a.value,
  }));

  return (
    <View
      style={[
        s.statCell,
        index % 2 === 0 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: borderColor },
        index < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
      ]}
    >
      <Reanimated.View style={[s.statValueWrap, valueStyle]}>
        <Text style={[s.statValue, { color: t.text }]}>{stat.value}</Text>
      </Reanimated.View>
      <Reanimated.View style={[s.statUnderline, underlineStyle]}>
        <LinearGradient
          colors={['#8B5CF6', '#22D3EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>
      <Text style={[s.statLabel, { color: t.textSub }]}>{stat.label}</Text>
    </View>
  );
}

// A wide, low-opacity band of light drifting across the stats block — the
// same translate-driven sheen used on AgentV2's send button, sized up.
function StatsSheen({ width }: { width: number }) {
  const p = useSharedValue(0);
  const band = width * 0.45;

  React.useEffect(() => {
    if (!width) return;
    p.value = 0;
    p.value = withRepeat(
      withTiming(1, { duration: SHEEN_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
    return () => cancelAnimation(p);
  }, [width, p]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(p.value, [0, 1], [-band, width]) }],
    opacity: interpolate(p.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
  }));

  if (!width) return null;

  return (
    <Reanimated.View
      style={[s.sheen, { width: band }, style]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['transparent', 'rgba(139,92,246,0.16)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Reanimated.View>
  );
}

export function WhatsInsideSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  const activeCard = useCycle(FEATURES.length, CARD_CYCLE_MS);
  const activeStat = useCycle(STATS.length, STAT_CYCLE_MS);
  const [statsW, setStatsW] = React.useState(0);

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
        {FEATURES.map((f, i) => (
          <FeatureCard
            key={f.title}
            feature={f}
            index={i}
            t={t}
            active={activeCard === i}
          />
        ))}
      </View>

      <View
        style={[s.statsCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
        onLayout={(e) => setStatsW(e.nativeEvent.layout.width)}
      >
        {STATS.map((stat, i) => (
          <StatCell
            key={stat.label}
            stat={stat}
            index={i}
            t={t}
            active={activeStat === i}
            borderColor={t.agentTabBorder}
          />
        ))}
        <StatsSheen width={statsW} />
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
    overflow: 'hidden',
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
  statValueWrap: {
    alignSelf: 'flex-start',
  },
  statValue: {
    fontFamily: F.display900,
    fontSize: 33,
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  statUnderline: {
    height: 2,
    width: 34,
    borderRadius: 1,
    marginTop: 3,
    marginBottom: 3,
    overflow: 'hidden',
    transformOrigin: 'left',
  },
  statLabel: {
    fontFamily: F.sans400,
    fontSize: 13.5,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
