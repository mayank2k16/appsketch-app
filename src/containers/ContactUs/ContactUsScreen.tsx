import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useCreateContactTicket } from '@/api/contact';
import { GradientText } from '@/components/ui/GradientText';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { useAppTheme, type AppColors } from '@/lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Content — kept identical to the web Contact Us page (Vite HomeV3/ContactUs) ──
const WHATSAPP_NUMBER = '919611574548';
const WHATSAPP_MESSAGE =
  'Hi,\nI would like to know more about your product.\nPlease contact me!';
const EMAIL = 'care@appsketch.ai';
const PHONE_DISPLAY = '+91 9611574548';
const PHONE_DIAL = '+919611574548';
const DISCORD_URL = 'https://discord.com/invite/efndymmh';

const SUPPORT_OPTIONS: { icon: IoniconName; title: string; description: string; cta: string }[] = [
  {
    icon: 'cash-outline',
    title: 'Billing support',
    description: 'Fix account or billing issues.',
    cta: 'Start chat',
  },
  {
    icon: 'warning-outline',
    title: 'Emergency support',
    description: "Urgent help when your site's down.",
    cta: 'Emergency',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Talk to sales',
    description: 'Work with our team on enterprise solutions.',
    cta: 'Talk to sales',
  },
];

const GRADIENT_TITLE_COLORS = ['#A855F7', '#EC4899'];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ContactUsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const createTicket = useCreateContactTicket();

  function handleWhatsApp() {
    const text = encodeURIComponent(WHATSAPP_MESSAGE);
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`).catch(() => { });
  }

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.warning('Please fill all fields');
      return;
    }
    if (!isValidEmail(email)) {
      toast.warning('Please enter a valid email');
      return;
    }
    createTicket.mutate(
      { name: name.trim(), email: email.trim(), message: message.trim() },
      {
        onSuccess: () => {
          toast.success('Thank you for contacting us', 'We will get in touch with you soon.');
          setName('');
          setEmail('');
          setMessage('');
        },
        onError: () => {
          toast.error('Something went wrong', 'Please try again later.');
        },
      }
    );
  }

  const contactCards: { icon: IoniconName; title: string; value: string; onPress: () => void }[] = [
    { icon: 'mail-outline', title: 'Email Us', value: EMAIL, onPress: () => Linking.openURL(`mailto:${EMAIL}`).catch(() => { }) },
    { icon: 'call-outline', title: 'Call Us', value: PHONE_DISPLAY, onPress: () => Linking.openURL(`tel:${PHONE_DIAL}`).catch(() => { }) },
    { icon: 'logo-discord', title: 'Connect on Discord', value: DISCORD_URL, onPress: () => Linking.openURL(DISCORD_URL).catch(() => { }) },
  ];

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.backBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>Contact Us</Text>
        <View style={st.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          {/* ── Hero ── */}
          <View style={st.section}>
            <GradientText style={st.heroTitle} colors={GRADIENT_TITLE_COLORS}>
              Contact Us
            </GradientText>
            <Text style={[st.heroSubtitle, { color: t.textSub }]}>
              Get help from support, sales, or experts.
            </Text>
          </View>

          {/* ── Main support card ── */}
          <View style={st.section}>
            <GlassCard t={t} isDark={isDark} contentStyle={st.mainCard}>
              <View style={st.mainCardHeader}>
                <View style={[st.iconWrap, { backgroundColor: t.accentSoft }]}>
                  <Ionicons name="construct-outline" size={22} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.mainCardTitle, { color: t.text }]}>Product support</Text>
                  <Text style={[st.mainCardDesc, { color: t.textSub }]}>Get help from an expert.</Text>
                </View>
              </View>

              <View style={st.mainCardFooter}>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  activeOpacity={0.85}
                  style={[st.ctaBtn, { backgroundColor: t.heroCtaBg }]}
                >
                  <Text style={[st.ctaBtnText, { color: t.heroCtaText }]}>Start chat</Text>
                </TouchableOpacity>

                <View style={st.statusRow}>
                  <View style={st.statusDot} />
                  <Text style={[st.statusText, { color: t.textSub }]}>All systems operational</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* ── Support options ── */}
          <View style={[st.section, { gap: 12 }]}>
            {SUPPORT_OPTIONS.map((opt) => (
              <GlassCard key={opt.title} t={t} isDark={isDark} contentStyle={st.optionCard}>
                <View style={[st.iconWrap, { backgroundColor: t.accentSoft, marginBottom: 12 }]}>
                  <Ionicons name={opt.icon} size={18} color={t.accent} />
                </View>
                <Text style={[st.optionTitle, { color: t.text }]}>{opt.title}</Text>
                <Text style={[st.optionDesc, { color: t.textSub }]}>{opt.description}</Text>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  activeOpacity={0.85}
                  style={[st.outlineBtn, { borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,17,0.12)' }]}
                >
                  <Text style={[st.outlineBtnText, { color: t.text }]}>{opt.cta}</Text>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>

          {/* ── Get in touch ── */}
          <View style={[st.section, { alignItems: 'center' }]}>
            <Text style={[st.sectionTitle, { color: t.text, textAlign: 'center' }]}>Get in Touch</Text>
            <Text style={[st.sectionDesc, { color: t.textSub, textAlign: 'center' }]}>
              We'd love to hear from you! Reach out to us for any inquiries or collaborations.
            </Text>
          </View>

          <View style={[st.section, { gap: 12 }]}>
            {contactCards.map((card) => (
              <TouchableOpacity key={card.title} onPress={card.onPress} activeOpacity={0.85}>
                <GlassCard t={t} isDark={isDark} contentStyle={st.contactInfoCard}>
                  <View style={[st.iconWrap, { backgroundColor: t.accentSoft }]}>
                    <Ionicons name={card.icon} size={18} color={t.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.contactCardTitle, { color: t.text }]}>{card.title}</Text>
                    <Text style={[st.contactCardValue, { color: t.textSub }]} numberOfLines={1}>
                      {card.value}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Contact form ── */}
          <View style={st.section}>
            <GlassCard t={t} isDark={isDark} contentStyle={st.formCard}>
              <View style={st.inputGroup}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor={t.textMuted}
                  style={[st.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                />
              </View>
              <View style={st.inputGroup}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Your Email"
                  placeholderTextColor={t.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[st.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                />
              </View>
              <View style={st.inputGroup}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Your Message"
                  placeholderTextColor={t.textMuted}
                  multiline
                  numberOfLines={5}
                  style={[st.input, st.textarea, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={createTicket.isPending}
                style={[st.ctaBtn, { backgroundColor: t.heroCtaBg, alignSelf: 'stretch', justifyContent: 'center', opacity: createTicket.isPending ? 0.7 : 1 }]}
              >
                {createTicket.isPending ? (
                  <ActivityIndicator size="small" color={t.heroCtaText} />
                ) : (
                  <Text style={[st.ctaBtnText, { color: t.heroCtaText }]}>Send Message</Text>
                )}
              </TouchableOpacity>
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
// the highlight to make the glass legibly lighter than what's behind it. */
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
      <View style={[st.glassCard, { borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255, 255, 255, 0.05)' }]}>
        <View style={[st.glassContent, contentStyle]}>{children}</View>
      </View>
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

  section: { paddingHorizontal: 20, paddingTop: 32 },

  heroTitle: { fontFamily: F.display900, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  heroSubtitle: { fontFamily: F.sans400, fontSize: 15, lineHeight: 22, marginTop: 10 },

  mainCard: { padding: 22 },
  mainCardHeader: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mainCardTitle: { fontFamily: F.sans700, fontSize: 16, marginBottom: 3 },
  mainCardDesc: { fontFamily: F.sans400, fontSize: 13 },
  mainCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },

  ctaBtn: { alignSelf: 'flex-start', paddingHorizontal: 22, paddingVertical: 13, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontFamily: F.sans700, fontSize: 13.5 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  statusText: { fontFamily: F.sans500, fontSize: 12.5 },

  optionCard: { padding: 18 },
  optionTitle: { fontFamily: F.sans700, fontSize: 15, marginBottom: 5 },
  optionDesc: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 18, marginBottom: 16 },
  outlineBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontFamily: F.sans600, fontSize: 13 },

  sectionTitle: { fontFamily: F.display900, fontSize: 26, marginBottom: 10 },
  sectionDesc: { fontFamily: F.sans400, fontSize: 14, lineHeight: 21, maxWidth: 320 },

  contactInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  contactCardTitle: { fontFamily: F.sans600, fontSize: 13.5, marginBottom: 2 },
  contactCardValue: { fontFamily: F.sans400, fontSize: 12.5 },

  formCard: { padding: 20 },
  inputGroup: { marginBottom: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: F.sans400, fontSize: 14 },
  textarea: { height: 110, textAlignVertical: 'top' },

  glassShadow: {
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
      default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
    }),
  },
  glassCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  glassContent: { position: 'relative', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  glassHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '35%' },
});
