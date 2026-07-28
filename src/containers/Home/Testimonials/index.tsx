import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 14;
const CARD_W = SCREEN_W * 0.72;

const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
  avatarGradient: [string, string];
}[] = [
    {
      quote:
        'AppSketch drafted our booking platform overnight and their engineers had it production-ready by the weekend — for a tenth of the agency quote.',
      name: 'Maya Okafor',
      role: 'Salon group owner',
      avatarGradient: ['#8B5CF6', '#6C5CE7'],
    },
    {
      quote:
        'The proprietary LLM nailed our data model, then a real developer tuned it to our compliance rules. Live in 48 hours.',
      name: 'Diego Ramos',
      role: 'Clinic operations',
      avatarGradient: ['#3B82F6', '#8B5CF6'],
    },
    {
      quote:
        'We shipped an internal logistics app agencies quoted six figures for. Real engineers, a fraction of the cost.',
      name: 'Sana Kapoor',
      role: 'Logistics founder',
      avatarGradient: ['#22D3EE', '#3B82F6'],
    },
  ];

// Same fade recipe as Hero's heading / HowItWorks / WhatsInside.
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

function TestimonialCard({
  item,
  t,
}: {
  item: (typeof TESTIMONIALS)[number];
  t: HomeColors;
}) {
  return (
    <View
      style={[
        s.card,
        { width: CARD_W, backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder },
      ]}
    >
      <View style={s.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons key={i} name="star" size={14} color={item.avatarGradient[0]} />
        ))}
      </View>

      <Text style={[s.quote, { color: t.text }]}>"{item.quote}"</Text>

      <View style={s.authorRow}>
        <LinearGradient
          colors={item.avatarGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.avatar}
        />
        <View>
          <Text style={[s.authorName, { color: t.text }]}>{item.name}</Text>
          <Text style={[s.authorRole, { color: t.textSub }]}>{item.role}</Text>
        </View>
      </View>
    </View>
  );
}

export function TestimonialsSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as the other new sections, so the
    // shared TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <View style={[s.eyebrowRow, s.inset]}>
        <View style={[s.eyebrowDot, { backgroundColor: t.accent }]} />
        <Text style={[s.eyebrow, { color: t.tagText }]}>LOVED BY BUILDERS</Text>
      </View>

      <View style={[s.headingWrap, s.inset]}>
        <HeadingLine text="Shipped by real" t={t} />
        <HeadingLine text="makers." t={t} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={s.carousel}
      >
        {TESTIMONIALS.map((item) => (
          <TestimonialCard key={item.name} item={item} t={t} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  inset: {
    paddingHorizontal: 22,
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
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 38,
  },

  carousel: {
    paddingHorizontal: 22,
    gap: CARD_GAP,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 14,
  },
  quote: {
    fontFamily: F.sans500,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 30,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: "auto"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontFamily: F.sans700,
    fontSize: 14,
  },
  authorRole: {
    fontFamily: F.sans400,
    fontSize: 12,
    marginTop: 1,
  },
});
