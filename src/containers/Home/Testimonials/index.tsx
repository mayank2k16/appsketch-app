import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = 14;
const CARD_W = SCREEN_W * 0.72;

const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  companyName: string;
}[] = [
    {
      quote: 'Appsketch gives us everything we need to move fast. We don\'t wait on dev. We don\'t compromise on design.',
      name: 'Nitin Kshatriya',
      role: 'Head of Design at Vijaya Eats',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      companyName: 'Vijaya Eats'
    },
    {
      quote: 'Launching on Appsketch was seamless. Live in no time, no friction.',
      name: 'Sudhanshu Verma',
      role: 'Product Lead at Rebuild Clinic',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      companyName: 'Rebuild Clinic'
    },
    {
      quote: 'Appsketch gave us full creative freedom. No code limits, no handoffs.',
      name: 'Ashish Dabariya',
      role: 'Design Director at Prodigy Pawns',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      companyName: 'Prodigy Pawns'
    },

    {
      quote: 'The speed of iteration with Appsketch is unmatched. It feels like designing in the future.',
      name: 'Himanshi Verma',
      role: 'Co-founder at Incito India',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      companyName: 'Incito India'

    },
    {
      quote: 'Finally a tool that understands designers. The output is exactly what I envisioned.',
      name: 'Rashmi Singhal',
      role: 'Design Systems Lead at RealValue Mart',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      companyName: 'RealValue Mart'
    },
    {
      quote: 'The performance is incredible. Lighthouse scores are all green without any extra effort.',
      name: 'Sarah Johnson',
      role: 'Engineering Manager at EatCake',
      avatar: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=100&h=100&fit=crop',
      companyName: 'EatCake'
    }
  ];

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
          <Ionicons key={i} name="star" size={14} color={t.accent} />
        ))}
      </View>

      <Text style={[s.quote, { color: t.text }]}>"{item.quote}"</Text>

      <View style={s.authorRow}>
        <View style={s.authorLeft}>
          <ExpoImage
            source={{ uri: item.avatar }}
            style={s.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <View style={s.authorInfo}>
            <Text style={[s.authorName, { color: t.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[s.authorRole, { color: t.textSub }]} numberOfLines={1}>
              {item.role}
            </Text>
          </View>
        </View>

        <View style={[s.companyTag, { backgroundColor: t.border }]}>
          <Text style={[s.companyText, { color: t.textSub }]} numberOfLines={1}>
            {item.companyName}
          </Text>
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
      <SectionHeading
        eyebrow="LOVED BY BUILDERS"
        lines={['Shipped by real', 'makers.']}
        t={t}
        style={s.inset}
      />

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
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: "auto"
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  authorInfo: {
    flexShrink: 1,
    gap: 0
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontFamily: F.sans700,
    fontSize: 14.5,
  },
  authorRole: {
    fontFamily: F.sans400,
    fontSize: 12,
    marginTop: 1,
  },
  companyTag: {
    flexShrink: 1,
    flexGrow: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 5,
    width: 100,
    marginLeft: 45
  },
  companyText: {
    fontFamily: F.sans600,
    fontSize: 10.5,
  },
});
