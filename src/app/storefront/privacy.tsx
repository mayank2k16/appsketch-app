import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/lib/fonts';

const RED              = '#C41230';
const DARK             = '#111111';
const MUTED            = '#555555';
const LAST_UPDATED     = 'May 1, 2025';
const CONTACT_EMAIL    = 'support@chinesecorner.co.in';
const SUPPORT_EMAIL    = 'support@chinesecorner.co.in';
const COMPANY          = 'Chinese Corner';
const WEBSITE          = 'www.chinesecorner.co.in';
const PHONE            = '+91 8971149666';
const GRIEVANCE_OFFICER = 'Rahul Sharma';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={st.section}>
      <Text style={st.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={st.para}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={st.bulletRow}>
      <Text style={st.bulletDot}>•</Text>
      <Text style={st.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={[st.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <View style={[st.hero, { paddingTop: Platform.OS === 'ios' ? 24 : 20 }]}>
        <Text style={st.heroEmoji}>🔒</Text>
        <Text style={st.heroTitle}>Privacy Policy</Text>
        <Text style={st.heroSub}>{COMPANY} · Last updated: {LAST_UPDATED}</Text>
      </View>

      <View style={st.body}>
        <P>
          At {COMPANY}, we are committed to protecting your personal information and your
          right to privacy. This Privacy Policy explains how we collect, use, store, and
          protect your data when you use our app and services.
        </P>

        <Section title="1. Introduction &amp; Scope">
          <P>
            This policy applies to all users of the {COMPANY} mobile application and website
            ({WEBSITE}). By using our services, you consent to the data practices described
            in this policy.
          </P>
          <P>
            This policy is published in compliance with the Information Technology Act, 2000
            and the Information Technology (Reasonable Security Practices and Procedures and
            Sensitive Personal Data or Information) Rules, 2011 of India.
          </P>
        </Section>

        <Section title="2. Information We Collect">
          <P>We collect the following categories of information:</P>
          <P><Text style={st.bold}>Personal Information</Text></P>
          <Bullet>Full name and display name</Bullet>
          <Bullet>Mobile number and/or email address</Bullet>
          <Bullet>Delivery addresses and landmarks</Bullet>
          <Bullet>Order history and preferences</Bullet>
          <P><Text style={st.bold}>Automatically Collected Information</Text></P>
          <Bullet>Device type, operating system, and app version</Bullet>
          <Bullet>IP address and approximate geographic location</Bullet>
          <Bullet>App usage patterns, screens visited, and session duration</Bullet>
          <Bullet>Crash reports and performance diagnostics</Bullet>
          <P><Text style={st.bold}>Payment Information</Text></P>
          <P>
            We do not store your card numbers, UPI credentials, or banking details. All
            payment transactions are processed by our PCI-DSS compliant payment gateway
            (Razorpay). We only receive a transaction reference ID and status.
          </P>
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use your information to:</P>
          <Bullet>Process and fulfil your food orders</Bullet>
          <Bullet>Send order confirmations, real-time delivery updates, and receipts</Bullet>
          <Bullet>Provide accurate delivery routing and estimated delivery times</Bullet>
          <Bullet>Offer personalised recommendations, deals, and loyalty rewards</Bullet>
          <Bullet>Respond to customer support enquiries and resolve complaints</Bullet>
          <Bullet>Detect and prevent fraud, unauthorized access, and abuse</Bullet>
          <Bullet>Improve our app, menu offerings, and delivery experience</Bullet>
          <Bullet>Send promotional communications (with your consent — opt out anytime)</Bullet>
          <Bullet>Comply with legal and regulatory obligations</Bullet>
        </Section>

        <Section title="4. Location Data">
          <P>
            {COMPANY} requests access to your device's location for the following purposes:
          </P>
          <Bullet>Auto-fill your delivery address for a faster checkout experience</Bullet>
          <Bullet>Show accurate delivery time estimates based on your location</Bullet>
          <Bullet>Enable real-time delivery tracking on the order tracking screen</Bullet>
          <Bullet>Determine if you are within our serviceable delivery zone</Bullet>
          <P>
            Location access is requested only when the app is in use ("foreground" access).
            You can revoke location permission at any time in your device settings — however,
            this will affect address auto-fill and delivery tracking features.
          </P>
          <P>
            We do not sell or share your location data with advertisers or third parties
            beyond what is required for delivery fulfillment.
          </P>
        </Section>

        <Section title="5. Sharing Your Information">
          <P>We share your information only in the following limited circumstances:</P>
          <Bullet>
            Delivery partners — We share your name, delivery address, and contact number
            with our delivery personnel solely for the purpose of delivering your order
          </Bullet>
          <Bullet>
            Payment processors — Transaction data is shared with our payment gateway (Razorpay)
            to process your payment securely
          </Bullet>
          <Bullet>
            Cloud service providers — We use secure cloud infrastructure (e.g. AWS, Firebase)
            for app hosting and data storage
          </Bullet>
          <Bullet>
            Legal authorities — We may disclose data if required by law, court order, or
            government regulation
          </Bullet>
          <P>
            We do NOT sell, rent, or trade your personal data to third parties for marketing
            or advertising purposes under any circumstances.
          </P>
        </Section>

        <Section title="6. Data Retention">
          <P>We retain your personal data for the following durations:</P>
          <Bullet>Active account data: retained for as long as your account is active</Bullet>
          <Bullet>Order history: retained for 3 years for accounting, tax, and legal compliance purposes</Bullet>
          <Bullet>Support communications: retained for 1 year after resolution</Bullet>
          <Bullet>Deleted account data: permanently erased within 30 days of an account deletion request, except where retention is required by law</Bullet>
          <P>
            To request deletion of your account and associated data, use the "Delete Account"
            option in the Profile section or email {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="7. Data Security">
          <P>
            We take your data security seriously and implement multiple layers of protection:
          </P>
          <Bullet>All data transmitted between your device and our servers is encrypted using TLS 1.2+</Bullet>
          <Bullet>Passwords are hashed using industry-standard algorithms and are never stored in plain text</Bullet>
          <Bullet>Payment processing is PCI-DSS Level 1 compliant via our payment gateway</Bullet>
          <Bullet>Access to user data is restricted to authorized personnel on a need-to-know basis</Bullet>
          <Bullet>Regular security audits and vulnerability assessments are conducted</Bullet>
          <P>
            While we employ industry-standard security measures, no method of transmission
            over the internet is 100% secure. We encourage you to use a strong, unique
            password and keep your device secure.
          </P>
        </Section>

        <Section title="8. Your Rights &amp; Choices">
          <P>You have the following rights regarding your personal data:</P>
          <Bullet>
            Access — Request a copy of the personal data we hold about you
          </Bullet>
          <Bullet>
            Correction — Request correction of inaccurate or incomplete data
          </Bullet>
          <Bullet>
            Deletion — Request deletion of your account and personal data
          </Bullet>
          <Bullet>
            Opt-out — Unsubscribe from promotional SMS/email at any time via app settings or by emailing {SUPPORT_EMAIL}
          </Bullet>
          <Bullet>
            Location — Withdraw location permission in your device settings at any time
          </Bullet>
          <P>
            To exercise any of these rights, contact us at {CONTACT_EMAIL}. We will respond
            to your request within 30 days.
          </P>
        </Section>

        <Section title="9. Cookies &amp; App Analytics">
          <P>
            Our app uses analytics tools to understand how users interact with the app and
            to improve our services:
          </P>
          <Bullet>
            Firebase Analytics — used for crash reporting, feature usage statistics, and
            app performance monitoring
          </Bullet>
          <Bullet>
            Firebase Crashlytics — collects anonymized crash reports to help us identify
            and fix technical issues
          </Bullet>
          <P>
            We do not engage in cross-site or cross-app tracking for advertising purposes.
            Analytics data is anonymised and used solely for internal product improvement.
            You can opt out of analytics via the app settings or your device's advertising
            settings.
          </P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>
            {COMPANY} is not intended for use by individuals under the age of 18. We do not
            knowingly collect personal information from children under 18.
          </P>
          <P>
            If we become aware that we have inadvertently collected personal information from
            a minor, we will delete such information promptly. If you believe we have
            collected information from a child, please contact us at {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="11. Third-Party Links &amp; Services">
          <P>
            Our app may contain links to third-party services such as payment gateways and
            map providers. {COMPANY} is not responsible for the privacy practices of these
            third parties.
          </P>
          <P>
            We encourage you to review the privacy policies of any third-party services you
            interact with through our app.
          </P>
        </Section>

        <Section title="12. Grievance Officer &amp; Contact">
          <P>
            In accordance with the Information Technology Act, 2000 and the rules made
            thereunder, the name and contact details of our Grievance Officer are provided below:
          </P>
          <Bullet>Name: {GRIEVANCE_OFFICER}</Bullet>
          <Bullet>Designation: Grievance Officer, {COMPANY}</Bullet>
          <Bullet>📞 Mobile: {PHONE}</Bullet>
          <Bullet>✉️ Email: {CONTACT_EMAIL}</Bullet>
          <Bullet>🌐 Website: {WEBSITE}</Bullet>
          <P>
            The Grievance Officer can be contacted for any grievance related to the processing
            of your personal data. We will address your grievance within 30 days of receiving it.
          </P>
          <P>
            For general privacy questions or to exercise your data rights, contact us at{' '}
            {CONTACT_EMAIL}. Our privacy team is available Monday – Saturday, 10 AM – 6 PM IST.
          </P>
        </Section>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1 },

  hero: {
    backgroundColor: RED,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  heroEmoji: { fontSize: 40, marginBottom: 10 },
  heroTitle: { fontSize: 26, fontFamily: F.sans800, color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 6, fontFamily: F.sans500, textAlign: 'center' },

  body: { paddingHorizontal: 20, paddingTop: 24 },

  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: { fontSize: 16, fontFamily: F.sans800, color: DARK, marginBottom: 10, letterSpacing: -0.2 },

  para:      { fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 10 },
  bold:      { fontFamily: F.sans700, color: DARK },
  bulletRow: { flexDirection: 'row', marginBottom: 7, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: RED, marginRight: 8, lineHeight: 22, fontFamily: F.sans800 },
  bulletText:{ flex: 1, fontSize: 14, color: MUTED, lineHeight: 22 },
});
