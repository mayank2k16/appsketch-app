import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

// Same trap as WhatsInside's grid — an explicit pixel width, not '48%'.
const { width: SCREEN_W } = Dimensions.get('window');
const SECTION_PAD_H = 22 * 2;
const COL_GAP = 12;
const COL_W = (SCREEN_W - SECTION_PAD_H - COL_GAP) / 2;

// Same CDN + placeholder pattern as Gallery/MockupCard — reused screenshots
// standing in for real "shipped" business screenshots for now.
const CDN = 'https://cdn.appsketch.ai/phurti-cloudfront/builder/layouts/';

// `aspect` drives the staggered/masonry look — the design's cards are not a
// uniform grid, each screenshot keeps its own height. Rendered as two
// independent vertical columns (see `COLUMNS` below) rather than a wrapping
// row, because flexWrap aligns every item in a row to the tallest one and
// would flatten the stagger back out.
const SHIPPED: { image: string; name: string; aspect: number }[] = [
  {
    image: `${CDN}a-premium-and-elegant-beauty-store.webp`,
    name: 'Bloom & Co.',
    aspect: 3 / 4,
  },
  {
    image: `${CDN}a-website-for-healthcare-brands.webp`,
    name: 'Clearview Clinic',
    aspect: 4 / 3,
  },
  {
    image: `${CDN}a-modern-and-elegant-looking-grocery-store.webp`,
    name: 'FreshRoute Logistics',
    aspect: 4 / 3,
  },
  {
    image: `${CDN}a-portfolio-website-for-sports-academy.webp`,
    name: 'Apex Sports Academy',
    aspect: 3 / 4,
  },
  {
    image: `${CDN}a-modern-sleek-and-elegant-real-estate-website.webp`,
    name: 'Marbre & Stone Realty',
    aspect: 4 / 3,
  },
  {
    image: `${CDN}a-luxury-and-premium-wellness-brand-website.webp`,
    name: 'Lumen Wellness Spa',
    aspect: 3 / 4,
  },
  {
    image: `${CDN}an-elegant-and-sleek-layout-for-chinese-restaurants.webp`,
    name: 'Golden Dragon Kitchen',
    aspect: 4 / 3,
  },
  {
    image: `${CDN}a-premium-jewellery-website-for-enquiry-purposes.webp`,
    name: 'Aurum Jewellers',
    aspect: 3 / 4,
  },
];

// Two vertical stacks — index 0,2,4,6 left / 1,3,5,7 right.
const COLUMNS = [
  SHIPPED.filter((_, i) => i % 2 === 0),
  SHIPPED.filter((_, i) => i % 2 === 1),
];

const LLM_CHIPS: { name: string; gradient: [string, string]; core?: boolean }[] = [
  { name: 'AppSketch LLM', gradient: ['#8B5CF6', '#6C5CE7'], core: true },
  { name: 'Claude', gradient: ['#3B82F6', '#22D3EE'] },
  { name: 'GPT-5', gradient: ['#EC4899', '#F97316'] },
  { name: 'Gemini', gradient: ['#22D3EE', '#8B5CF6'] },
];

// Same fade recipe as Hero's heading / the other new Home sections.
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

function ShippedCard({
  item,
  t,
}: {
  item: (typeof SHIPPED)[number];
  t: HomeColors;
}) {
  return (
    <View
      style={[s.card, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
    >
      {/* No fill colour behind the image — the card's own border/bg is the
          only chrome, the screenshot fills the rest. */}
      <View style={[s.imageWrap, { aspectRatio: item.aspect }]}>
        <ExpoImage
          source={item.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={s.liveBadge}>
          <View style={[s.liveDot, { backgroundColor: t.toastSuccess }]} />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={s.cardFooter}>
        <Text style={[s.cardName, { color: t.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={[s.prodTag, { backgroundColor: t.border }]}>
          <Text style={[s.prodText, { color: t.textSub }]}>prod</Text>
        </View>
      </View>
    </View>
  );
}

export function ShippedSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as the other new sections, so the
    // shared TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <View style={[s.eyebrowRow, s.inset]}>
        <View style={[s.eyebrowDot, { backgroundColor: t.accent }]} />
        <Text style={[s.eyebrow, { color: t.tagText }]}>SHIPPED TO PRODUCTION</Text>
      </View>

      <View style={[s.headingWrap, s.inset]}>
        <HeadingLine text="Real apps, running" t={t} />
        <HeadingLine text="live." t={t} />
      </View>

      <View style={[s.masonry, s.inset]}>
        {COLUMNS.map((column, ci) => (
          <View key={ci} style={s.column}>
            {column.map((item) => (
              <ShippedCard key={item.name} item={item} t={t} />
            ))}
          </View>
        ))}
      </View>

      {/* ── Model strip ── */}
      <Text style={[s.stripLabel, s.inset, { color: t.textMuted }]}>
        STRUCTURED BY OUR PROPRIETARY LLM
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.strip}
      >
        {LLM_CHIPS.map((chip) => (
          <View
            key={chip.name}
            style={[s.chip, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}
          >
            <LinearGradient
              colors={chip.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.chipIcon}
            />
            <Text style={[s.chipName, { color: t.text }]}>{chip.name}</Text>
            {chip.core && (
              <View style={[s.coreBadge, { backgroundColor: t.templatesTagBg }]}>
                <Text style={[s.coreText, { color: t.templatesTagText }]}>core</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingTop: 20,
    paddingBottom: 30,
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

  masonry: {
    flexDirection: 'row',
    gap: COL_GAP,
  },
  column: {
    width: COL_W,
    gap: COL_GAP,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    // Fixed dark scrim rather than a theme token — this sits on top of a
    // photo, so it needs to stay readable regardless of the app's theme.
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: F.sans700,
    fontSize: 9,
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cardName: {
    flex: 1,
    fontFamily: F.sans700,
    fontSize: 13.5,
  },
  prodTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prodText: {
    fontFamily: F.sans600,
    fontSize: 9.5,
    letterSpacing: 0.2,
  },

  stripLabel: {
    fontFamily: F.sans700,
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 34,
    marginBottom: 14,
  },
  strip: {
    paddingHorizontal: 22,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
  },
  chipName: {
    fontFamily: F.sans700,
    fontSize: 15,
  },
  coreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  coreText: {
    fontFamily: F.sans600,
    fontSize: 10.5,
  },
});
