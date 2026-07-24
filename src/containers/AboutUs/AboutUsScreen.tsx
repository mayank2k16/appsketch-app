import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { useAppTheme, type AppColors } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Content — kept identical to the web About Us page (Vite HomeV3/AboutUs) ──
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1739298061707-cefee19941b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800';
const HERO_CARDS: { image: string; title: string; subtitle: string }[] = [
  {
    image: 'https://images.unsplash.com/photo-1688413709025-5f085266935a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    title: 'Innovation',
    subtitle: 'Pushing boundaries',
  },
  {
    image: 'https://images.unsplash.com/photo-1722192147824-945d76814972?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    title: 'Technology',
    subtitle: 'AI-powered future',
  },
  {
    image: 'https://images.unsplash.com/photo-1662504519593-a618bcacd3c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
    title: 'Design',
    subtitle: 'Crafted to perfection',
  },
];

const STATS: { value: string; label: string }[] = [
  { value: '50K+', label: 'Websites Generated' },
  { value: '550K+', label: 'AI-Generated Pages & Sections' },
  { value: '2K+', label: 'Pre-Built Components' },
  { value: '1', label: 'Platform Design, CMS, & Marketing' },
];

const VALUES: { icon: IoniconName; title: string; description: string }[] = [
  {
    icon: 'hardware-chip-outline',
    title: 'AI-Driven by Design',
    description:
      'We build with AI to remove friction from website and ecommerce creation. From layouts and content to marketing assets, AI helps users move faster without sacrificing control or quality.',
  },
  {
    icon: 'people-outline',
    title: 'Creator-First',
    description:
      'Everything we design starts with the people building on AppSketch. We focus on simplicity, flexibility, and freedom—so creators and businesses can build websites their way, without technical barriers.',
  },
  {
    icon: 'flash-outline',
    title: 'Speed Matters',
    description:
      'Launching online shouldn’t take weeks. We obsess over speed—helping users go from an idea or prompt to a live website in minutes.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Built to Scale',
    description:
      'AppSketch is designed to grow with your business. From small websites to large ecommerce stores, our platform supports scale, reliability, and performance from day one.',
  },
  {
    icon: 'globe-outline',
    title: 'Global by Design',
    description:
      'We build for businesses everywhere. AppSketch supports creators across regions, industries, and use cases—making website and ecommerce creation accessible worldwide.',
  },
  {
    icon: 'heart-outline',
    title: 'Crafted with Care',
    description:
      'We care deeply about the details. From templates and components to user experience and performance, every part of AppSketch is thoughtfully designed to feel intuitive and reliable.',
  },
];

const MILESTONES: { year: string; title: string; description: string }[] = [
  {
    year: '2023',
    title: 'Founded',
    description:
      'AppSketch was founded with a clear goal—to simplify how businesses build and scale websites and online stores using AI.',
  },
  {
    year: '2024',
    title: 'First Investment',
    description:
      'We secured our first investment to accelerate product development and strengthen our AI Website Builder and Ecommerce Builder capabilities.',
  },
  {
    year: '2025',
    title: 'Growing Globally',
    description:
      'AppSketch helped create 50K+ websites and expanded to 20+ countries, supporting businesses across regions with a unified website and marketing platform.',
  },
];

const GRADIENT_TITLE_COLORS = ['#C084FC', '#F9A8D4', '#60A5FA'];

export function AboutUsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  function handleSchedule() {
    Linking.openURL('https://calendly.com/care-appsketch/30min').catch(() => { });
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>About Us</Text>
        <View style={st.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── Hero ── */}
        <View style={st.section}>
          <View style={[st.badge, { backgroundColor: t.accentSoft, borderColor: `${t.accent}40` }]}>
            <Ionicons name="sparkles-outline" size={13} color={t.accent} />
            <Text style={[st.badgeText, { color: t.accent }]}>About AppSketch</Text>
          </View>

          <Text style={[st.heroTitle, { color: t.text }]}>Empowering Businesses</Text>
          <GradientText
            style={st.heroTitle}
            colors={GRADIENT_TITLE_COLORS}
          >
            to Build and Scale Online
          </GradientText>

          <Text style={[st.heroDesc, { color: t.textSub }]}>
            We believe building online should be fast, flexible, and accessible. With AI at the core, we help
            businesses design, launch, and scale websites with no limits.
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/home')}
            activeOpacity={0.85}
            style={[st.ctaBtn, { backgroundColor: t.heroCtaBg }]}
          >
            <Text style={[st.ctaBtnText, { color: t.heroCtaText }]}>Explore Appsketch</Text>
            <Ionicons name="arrow-forward" size={15} color={t.heroCtaText} />
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={st.section}>
          <View style={st.statsGrid}>
            {STATS.map((stat) => (
              <GlassCard key={stat.label} t={t} isDark={isDark} style={st.statCard} contentStyle={st.statCardContent}>
                <Text style={[st.statValue, { color: t.text }]}>{stat.value}</Text>
                <Text style={[st.statLabel, { color: t.textSub }]}>{stat.label}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* ── Mission ── */}
        <View style={st.section}>
          <View style={st.missionImageWrap}>
            <View style={[st.missionGlow, { backgroundColor: `${t.accent}30` }]} />
            <GlassCard t={t} isDark={isDark} contentStyle={st.missionImageCard}>
              <Image source={{ uri: HERO_IMAGE }} style={st.missionImage} contentFit="cover" />
            </GlassCard>
          </View>

          <SectionBadge label="Our Mission" color="#C084FC" t={t} />
          <Text style={[st.sectionTitle, { color: t.text }]}>
            Removing friction from building and scaling online
          </Text>
          <Text style={[st.bodyText, { color: t.textSub }]}>
            We believe great ideas shouldn’t be slowed down by technical complexity. AppSketch was built to
            solve a simple but persistent problem—businesses and creators were spending too much time and money
            navigating tools, developers, and fragmented workflows just to get online.
          </Text>
          <Text style={[st.bodyText, { color: t.textSub }]}>
            By combining AI with an intuitive, no-code experience, we’ve built a platform that helps anyone
            design, launch, and grow websites and online stores faster. Our AI Website Builder and Ecommerce
            Builder remove barriers at every stage—from layout and content to publishing, blogging, and
            marketing—so creators can focus on building businesses, not managing tech.
          </Text>

          <View style={st.missionBadges}>
            <View style={[st.infoBadge, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[st.badgeDot, { backgroundColor: '#10B981' }]} />
              <Text style={[st.infoBadgeText, { color: t.text }]}>50K+ Websites Generated</Text>
            </View>
            <View style={[st.infoBadge, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[st.badgeDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={[st.infoBadgeText, { color: t.text }]}>550K+ AI-Generated Pages & Sections</Text>
            </View>
          </View>
        </View>

        {/* ── Values ── */}
        <View style={st.section}>
          <SectionBadge label="Our Values" color="#60A5FA" t={t} />
          <Text style={[st.sectionTitle, { color: t.text }]}>What drives everything we build</Text>
          <Text style={[st.sectionDesc, { color: t.textSub }]}>
            These principles guide how we design AppSketch—from how our AI Website Builder works to how businesses
            create, launch, and scale online using our platform.
          </Text>

          <View style={{ gap: 12, marginTop: 24 }}>
            {VALUES.map((value) => (
              <GlassCard key={value.title} t={t} isDark={isDark} contentStyle={st.valueCard}>
                <View style={[st.valueIconWrap, { backgroundColor: t.accentSoft }]}>
                  <Ionicons name={value.icon} size={20} color={t.accent} />
                </View>
                <Text style={[st.valueTitle, { color: t.text }]}>{value.title}</Text>
                <Text style={[st.valueDesc, { color: t.textSub }]}>{value.description}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* ── Timeline ── */}
        <View style={st.section}>
          <SectionBadge label="Our Journey" color="#F9A8D4" t={t} />
          <Text style={[st.sectionTitle, { color: t.text }]}>Building AppSketch, one step at a time</Text>

          <View style={{ gap: 12, marginTop: 24 }}>
            {MILESTONES.map((m) => (
              <GlassCard key={m.year} t={t} isDark={isDark} contentStyle={st.milestoneCard}>
                <GradientText style={st.milestoneYear} colors={['#C084FC', '#60A5FA']}>
                  {m.year}
                </GradientText>
                <Text style={[st.milestoneTitle, { color: t.text }]}>{m.title}</Text>
                <Text style={[st.milestoneDesc, { color: t.textSub }]}>{m.description}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* ── CTA ── */}
        <View style={st.section}>
          <View style={st.ctaWrap}>
            <View style={[st.ctaGlow, { backgroundColor: `${t.accent}25` }]} />
            <GlassCard t={t} isDark={isDark} contentStyle={st.ctaCard}>
              <Text style={[st.ctaTitle, { color: t.text }]}>Ready to build something amazing?</Text>
              <Text style={[st.ctaDesc, { color: t.textSub }]}>
                Join thousands of creators who are already using AppSketch.ai to bring their ideas to life.
              </Text>
              <View style={{ gap: 10, marginTop: 22 }}>
                <TouchableOpacity
                  onPress={() => router.push('/home')}
                  activeOpacity={0.85}
                  style={[st.ctaBtn, { backgroundColor: t.heroCtaBg, alignSelf: 'stretch', justifyContent: 'center' }]}
                >
                  <Text style={[st.ctaBtnText, { color: t.heroCtaText }]}>Start Your Free Trial</Text>
                  <Ionicons name="arrow-forward" size={15} color={t.heroCtaText} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSchedule}
                  activeOpacity={0.85}
                  style={[
                    st.ctaBtnSecondary,
                    { backgroundColor: t.heroSecondaryBg, borderColor: t.heroSecondaryBorder },
                  ]}
                >
                  <Text style={[st.ctaBtnText, { color: t.heroSecondaryText }]}>Schedule a Demo</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Shared glass surface — BlurView + tint overlay + lift wash + top
// highlight, wrapped in a shadow layer that sits outside the clipped
// (overflow: hidden) card so the elevation isn't cut off. `style` sizes/
// positions the card itself (grid width, margins); `contentStyle` is applied
// to the actual content wrapper — layout props like flexDirection/padding
// belong there, not on `style`, since the card's own children (Blur/tint/
// highlight) are absolutely positioned and only the content wrapper is a
// real flex participant. The dark tint alone reads almost as dark as the
// page background, so a faint white "lift" wash sits between the tint and
// the highlight to make the glass legibly lighter than what's behind it.
function GlassCard({
  t,
  isDark,
  style,
  contentStyle,
  children,
}: {
  t: AppColors;
  isDark: boolean;
  style?: object;
  contentStyle?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[st.glassShadow, style]}>
      <View style={[st.glassCard, { borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,17,0.12)' }]}>
        <BlurView intensity={Platform.OS === 'android' ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.card, opacity: isDark ? 0.85 : 0.65 }]} />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)' }]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={isDark ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
          style={st.glassHighlight}
        />
        <View style={[st.glassContent, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

function SectionBadge({ label, color, t }: { label: string; color: string; t: AppColors }) {
  return (
    <View style={[st.sectionBadge, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
      <Text style={[st.sectionBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: F.sans700, fontSize: 15 },

  section: { paddingHorizontal: 20, paddingTop: 40 },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 18,
  },
  badgeText: { fontFamily: F.sans600, fontSize: 12 },

  heroTitle: { fontFamily: F.display900, fontSize: 29, lineHeight: 35, letterSpacing: -0.5 },
  heroDesc: { fontFamily: F.sans400, fontSize: 15, lineHeight: 22, marginTop: 16, marginBottom: 24 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
  },
  ctaBtnText: { fontFamily: F.sans700, fontSize: 13.5 },
  ctaBtnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },

  heroCard: { width: 210, height: 150, borderRadius: 16, overflow: 'hidden' },
  heroCardContent: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  heroCardTitle: { fontFamily: F.sans700, fontSize: 15, color: '#FFFFFF', marginBottom: 2 },
  heroCardSubtitle: { fontFamily: F.sans400, fontSize: 11.5, color: 'rgba(255,255,255,0.75)' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%' },
  statCardContent: { paddingHorizontal: 12, paddingVertical: 16 },
  statValue: { fontFamily: F.display900, fontSize: 28, marginBottom: 4 },
  statLabel: { fontFamily: F.sans500, fontSize: 11.5, lineHeight: 15 },

  missionImageWrap: { marginBottom: 28 },
  missionGlow: { position: 'absolute', top: -12, left: -12, right: -12, bottom: -12, borderRadius: 28 },
  missionImageCard: { padding: 10 },
  missionImage: { width: '100%', height: 200, borderRadius: 12 },

  sectionBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, marginBottom: 14 },
  sectionBadgeText: { fontFamily: F.sans600, fontSize: 12 },
  sectionTitle: { fontFamily: F.display900, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, marginBottom: 14 },
  sectionDesc: { fontFamily: F.sans400, fontSize: 14, lineHeight: 21 },
  bodyText: { fontFamily: F.sans400, fontSize: 14, lineHeight: 22, marginBottom: 14 },

  missionBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  infoBadgeText: { fontFamily: F.sans600, fontSize: 12 },

  valueCard: { padding: 18 },
  valueIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  valueTitle: { fontFamily: F.sans700, fontSize: 15.5, marginBottom: 6 },
  valueDesc: { fontFamily: F.sans400, fontSize: 13, lineHeight: 19 },

  milestoneCard: { padding: 18 },
  milestoneYear: { fontFamily: F.display900, fontSize: 30, marginBottom: 8 },
  milestoneTitle: { fontFamily: F.sans700, fontSize: 16, marginBottom: 6 },
  milestoneDesc: { fontFamily: F.sans400, fontSize: 13, lineHeight: 19 },

  ctaWrap: { position: 'relative' },
  ctaGlow: { position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, borderRadius: 32 },
  ctaCard: { padding: 26 },
  ctaTitle: { fontFamily: F.display900, fontSize: 24, lineHeight: 30, marginBottom: 12, textAlign: 'center' },
  ctaDesc: { fontFamily: F.sans400, fontSize: 14, lineHeight: 21, textAlign: 'center' },

  glassShadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    }),
  },
  glassCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  glassContent: { position: 'relative' },
  glassHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '35%' },
});
