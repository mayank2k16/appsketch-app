import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { useAppTheme, type AppColors } from '@/lib/theme';

// ─── Content — kept identical to the web Terms & Conditions page (Vite HomeV3/Tnc) ──
const LAST_UPDATED = 'Last updated: June 22, 2025';
const CONTACT_EMAIL = 'care@appsketch.com';
const GRADIENT_TITLE_COLORS = ['#C084FC', '#F9A8D4', '#60A5FA'];

export function TermsAndConditionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  function openEmail() {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => { });
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>Terms & Conditions</Text>
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
            <Ionicons name="document-text-outline" size={13} color={t.accent} />
            <Text style={[st.badgeText, { color: t.accent }]}>AppSketch Legal</Text>
          </View>

          <GradientText style={st.heroTitle} colors={GRADIENT_TITLE_COLORS}>
            Terms & Conditions
          </GradientText>

          <Text style={[st.heroDate, { color: t.textMuted }]}>{LAST_UPDATED}</Text>
        </View>

        {/* ── 1. What We Do ── */}
        <View style={st.section}>
          <PolicySection title="1. What We Do" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We help you build websites, apps, and backends using AI. Just describe what you want in a simple
              sentence—our AI generates it for you.
            </Text>
          </PolicySection>
        </View>

        {/* ── 2. Use It Fairly ── */}
        <View style={st.section}>
          <PolicySection title="2. Use It Fairly" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>By using our platform, you agree not to:</Text>
            <BulletList
              t={t}
              items={['Break any laws', 'Steal content', 'Harm others or spam', 'Hack or mess with the system']}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>Just be cool and fair.</Text>
          </PolicySection>
        </View>

        {/* ── 3. Accounts & Payments ── */}
        <View style={st.section}>
          <PolicySection title="3. Accounts & Payments" t={t}>
            <BulletList
              t={t}
              items={[
                'You’re responsible for your account.',
                'Some features are free, others are paid.',
                'No surprise charges — we’ll always be transparent about pricing.',
              ]}
            />
          </PolicySection>
        </View>

        {/* ── 4. Contact ── */}
        <View style={st.section}>
          <PolicySection title="4. Contact" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              If you have questions about these terms, reach out at{' '}
              <Text onPress={openEmail} style={[st.emailLink, { color: t.accent }]}>
                {CONTACT_EMAIL}
              </Text>
              .
            </Text>
          </PolicySection>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

// Flat card — same treatment as the AgentV2 suggestion pills / About Us /
// Contact Us / Privacy Policy: solid `agentTabBg` fill, `agentTabBorder`
// border, no blur/gradient, so this reads as the same theme in both light
// and dark.
function GlassCard({
  t,
  contentStyle,
  children,
}: {
  t: AppColors;
  contentStyle?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[st.glassCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
      <View style={[st.glassContent, contentStyle]}>{children}</View>
    </View>
  );
}

function PolicySection({
  title,
  t,
  children,
}: {
  title: string;
  t: AppColors;
  children: React.ReactNode;
}) {
  return (
    <GlassCard t={t} contentStyle={st.sectionCard}>
      <Text style={[st.sectionHeading, { color: t.text }]}>{title}</Text>
      {children}
    </GlassCard>
  );
}

function BulletList({ items, t }: { items: string[]; t: AppColors }) {
  return (
    <View style={st.list}>
      {items.map((item) => (
        <View key={item} style={st.listItem}>
          <Text style={[st.bullet, { color: t.accent }]}>•</Text>
          <Text style={[st.listText, { color: t.textSub }]}>{item}</Text>
        </View>
      ))}
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

  section: { paddingHorizontal: 8, paddingTop: 24 },

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

  heroTitle: { fontFamily: F.display900, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  heroDate: { fontFamily: F.sans500, fontSize: 12.5, marginTop: 8 },

  sectionCard: { padding: 18 },
  sectionHeading: { fontFamily: F.sans700, fontSize: 16.5, marginBottom: 10 },
  bodyText: { fontFamily: F.sans400, fontSize: 13.5, lineHeight: 20 },

  list: { gap: 8, marginTop: 4, marginBottom: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { fontFamily: F.sans700, fontSize: 13.5, lineHeight: 20 },
  listText: { flex: 1, fontFamily: F.sans400, fontSize: 13.5, lineHeight: 20 },

  emailLink: { fontFamily: F.sans600, fontSize: 13.5, textDecorationLine: 'underline' },

  glassCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  glassContent: { position: 'relative' },
});

export default TermsAndConditionsScreen;
