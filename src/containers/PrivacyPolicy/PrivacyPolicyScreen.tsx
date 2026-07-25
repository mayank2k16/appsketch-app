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

// ─── Content — kept identical to the web Privacy Policy page (Vite HomeV3/PrivacyPolicy) ──
const LAST_UPDATED = 'Last updated: 01/01/2026';
const CONTACT_EMAIL = 'akash@appsketch.ai';
const GRADIENT_TITLE_COLORS = ['#60A5FA', '#818CF8', '#A78BFA'];

export function PrivacyPolicyScreen() {
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
        <Text style={[st.headerTitle, { color: t.text }]}>Privacy Policy</Text>
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
            Privacy Policy
          </GradientText>

          <Text style={[st.heroDate, { color: t.textMuted }]}>{LAST_UPDATED}</Text>

          <Text style={[st.heroDesc, { color: t.textSub }]}>
            At AppSketch, your privacy matters to us. This Privacy Policy explains how we collect, use, and
            protect your information when you use our website, platform, and services (&ldquo;Services&rdquo;).
          </Text>
          <Text style={[st.heroDesc, { color: t.textSub }]}>
            By using AppSketch, you agree to the practices described in this policy.
          </Text>
        </View>

        {/* ── 1. Information We Collect ── */}
        <View style={st.section}>
          <PolicySection title="1. Information We Collect" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We collect information to provide and improve our Services.
            </Text>

            <Text style={[st.subheading, { color: t.text }]}>Information You Provide</Text>
            <BulletList
              t={t}
              items={[
                'Name, email address, and account details',
                'Billing information (processed securely by third-party providers)',
                'Content you create using AppSketch, including websites, pages, blogs, and ecommerce data',
                'Communications with our support or sales teams',
              ]}
            />

            <Text style={[st.subheading, { color: t.text, marginTop: 14 }]}>
              Information We Collect Automatically
            </Text>
            <BulletList
              t={t}
              items={[
                'IP address, device type, browser, and usage data',
                'Pages visited, features used, and performance metrics',
                'Cookies and similar tracking technologies',
              ]}
            />
          </PolicySection>
        </View>

        {/* ── 2. How We Use Your Information ── */}
        <View style={st.section}>
          <PolicySection title="2. How We Use Your Information" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>We use your information to:</Text>
            <BulletList
              t={t}
              items={[
                'Provide and operate the AppSketch platform',
                'Power our AI Website Builder and Ecommerce Builder features',
                'Improve performance, usability, and reliability',
                'Communicate with you about updates, support, or services',
                'Ensure security, prevent fraud, and comply with legal obligations',
              ]}
            />
            <Text style={[st.highlightText, { color: t.accent }]}>
              We do not sell your personal data.
            </Text>
          </PolicySection>
        </View>

        {/* ── 3. AI & User Content ── */}
        <View style={st.section}>
          <PolicySection title="3. AI & User Content" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              When you use AI-powered features, AppSketch may process your inputs (such as prompts, content, or
              design selections) to generate outputs.
            </Text>
            <BulletList
              t={t}
              items={[
                'Your content remains yours',
                'We do not use private user content to train public AI models',
                'AI processing is performed securely and only to deliver requested functionality',
              ]}
            />
          </PolicySection>
        </View>

        {/* ── 4. Cookies & Tracking ── */}
        <View style={st.section}>
          <PolicySection title="4. Cookies & Tracking" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>We use cookies to:</Text>
            <BulletList
              t={t}
              items={[
                'Remember your preferences',
                'Understand how users interact with AppSketch',
                'Improve site performance and experience',
              ]}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>
              You can control cookie preferences through your browser settings.
            </Text>
          </PolicySection>
        </View>

        {/* ── 5. Data Sharing ── */}
        <View style={st.section}>
          <PolicySection title="5. Data Sharing" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We may share data with trusted third parties only when necessary, including:
            </Text>
            <BulletList
              t={t}
              items={[
                'Hosting and infrastructure providers',
                'Payment processors',
                'Analytics and monitoring services',
                'Legal authorities, if required by law',
              ]}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>
              All partners are required to protect your data.
            </Text>
          </PolicySection>
        </View>

        {/* ── 6. Data Security ── */}
        <View style={st.section}>
          <PolicySection title="6. Data Security" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We take security seriously and use industry-standard measures to protect your information,
              including:
            </Text>
            <BulletList
              t={t}
              items={[
                'Secure servers and encrypted connections',
                'Access controls and monitoring',
                'Regular security reviews',
              ]}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>
              However, no system is 100% secure, and we cannot guarantee absolute security.
            </Text>
          </PolicySection>
        </View>

        {/* ── 7. Data Retention ── */}
        <View style={st.section}>
          <PolicySection title="7. Data Retention" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We retain your information only as long as necessary to:
            </Text>
            <BulletList
              t={t}
              items={['Provide our Services', 'Meet legal and operational requirements']}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>
              You may request deletion of your account and associated data at any time.
            </Text>
          </PolicySection>
        </View>

        {/* ── 8. Your Rights ── */}
        <View style={st.section}>
          <PolicySection title="8. Your Rights" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              Depending on your location, you may have rights to:
            </Text>
            <BulletList
              t={t}
              items={[
                'Access your personal data',
                'Request correction or deletion',
                'Object to or restrict certain processing',
              ]}
            />
            <Text style={[st.bodyText, { color: t.textSub, marginTop: 10 }]}>
              To exercise these rights, contact us at{' '}
              <Text onPress={openEmail} style={[st.emailLink, { color: t.accent }]}>
                {CONTACT_EMAIL}
              </Text>
              .
            </Text>
          </PolicySection>
        </View>

        {/* ── 9. International Users ── */}
        <View style={st.section}>
          <PolicySection title="9. International Users" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              AppSketch is used globally. By using our Services, you understand that your data may be processed
              in countries where data protection laws may differ from your local regulations.
            </Text>
          </PolicySection>
        </View>

        {/* ── 10. Changes to This Policy ── */}
        <View style={st.section}>
          <PolicySection title="10. Changes to This Policy" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated date.
            </Text>
          </PolicySection>
        </View>

        {/* ── 11. Contact Us ── */}
        <View style={st.section}>
          <PolicySection title="11. Contact Us" t={t}>
            <Text style={[st.bodyText, { color: t.textSub }]}>
              If you have questions about this Privacy Policy or your data, contact us at:
            </Text>

            <TouchableOpacity
              onPress={openEmail}
              activeOpacity={0.7}
              style={[st.contactBox, { backgroundColor: t.card, borderColor: t.border }]}
            >
              <View style={st.contactRow}>
                <Text style={[st.contactLabel, { color: t.textSub }]}>Email:</Text>
                <Text style={[st.emailLink, { color: t.accent }]}>{CONTACT_EMAIL}</Text>
              </View>
              <View style={st.contactRow}>
                <Text style={[st.contactLabel, { color: t.textSub }]}>Company:</Text>
                <Text style={[st.contactValue, { color: t.text }]}>AppSketch</Text>
              </View>
            </TouchableOpacity>
          </PolicySection>
        </View>

        {/* ── Closing ── */}
        <View style={[st.section, { paddingTop: 8 }]}>
          <Text style={[st.closingText, { color: t.textMuted }]}>
            Transparency and trust are core to how we build AppSketch.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

// Flat card — same treatment as the AgentV2 suggestion pills / About Us /
// Contact Us: solid `agentTabBg` fill, `agentTabBorder` border, no
// blur/gradient, so this reads as the same theme in both light and dark.
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

  section: { paddingHorizontal: 20, paddingTop: 24 },

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
  heroDate: { fontFamily: F.sans500, fontSize: 12.5, marginTop: 8, marginBottom: 18 },
  heroDesc: { fontFamily: F.sans400, fontSize: 14.5, lineHeight: 22, marginBottom: 12 },

  sectionCard: { padding: 18 },
  sectionHeading: { fontFamily: F.sans700, fontSize: 16.5, marginBottom: 10 },
  subheading: { fontFamily: F.sans600, fontSize: 13, marginBottom: 8 },
  bodyText: { fontFamily: F.sans400, fontSize: 13.5, lineHeight: 20 },
  highlightText: { fontFamily: F.sans700, fontSize: 13.5, lineHeight: 20, marginTop: 8 },

  list: { gap: 8, marginTop: 4, marginBottom: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { fontFamily: F.sans700, fontSize: 13.5, lineHeight: 20 },
  listText: { flex: 1, fontFamily: F.sans400, fontSize: 13.5, lineHeight: 20 },

  emailLink: { fontFamily: F.sans600, fontSize: 13.5, textDecorationLine: 'underline' },

  contactBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactLabel: { fontFamily: F.sans600, fontSize: 13 },
  contactValue: { fontFamily: F.sans500, fontSize: 13 },

  closingText: {
    fontFamily: F.sans500,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 19,
  },

  glassCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  glassContent: { position: 'relative' },
});

export default PrivacyPolicyScreen;
