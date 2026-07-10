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

const RED           = '#C41230';
const DARK          = '#111111';
const MUTED         = '#555555';
const LAST_UPDATED  = 'May 1, 2025';
const CONTACT_EMAIL = 'support@chinesecorner.co.in';
const COMPANY       = 'Chinese Corner';
const WEBSITE       = 'www.chinesecorner.co.in';
const PHONE         = '+91 8971149666';
const ESTABLISHED   = '2025';

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

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={[st.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner */}
      <View style={[st.hero, { paddingTop: Platform.OS === 'ios' ? 24 : 20 }]}>
        <Text style={st.heroEmoji}>📋</Text>
        <Text style={st.heroTitle}>Terms &amp; Conditions</Text>
        <Text style={st.heroSub}>{COMPANY} · Last updated: {LAST_UPDATED}</Text>
      </View>

      <View style={st.body}>
        <P>
          Welcome to {COMPANY}. By downloading, accessing, or using our mobile application
          and related services, you agree to be bound by these Terms &amp; Conditions. Please
          read them carefully before placing any order.
        </P>

        <Section title="1. Acceptance of Terms">
          <P>
            By creating an account or placing an order on the {COMPANY} app, you confirm that
            you have read, understood, and agree to these Terms. If you do not agree, please
            discontinue use of the app immediately.
          </P>
          <P>
            These Terms constitute a legally binding agreement between you ("User") and{' '}
            {COMPANY} ("we", "us", "our"). We reserve the right to update these Terms at any
            time, and continued use of the app after changes constitutes acceptance of the
            revised Terms.
          </P>
        </Section>

        <Section title="2. Eligibility &amp; Account Registration">
          <P>To use {COMPANY}, you must:</P>
          <Bullet>Be at least 18 years of age, or have parental/guardian consent</Bullet>
          <Bullet>Provide accurate, current, and complete information during registration</Bullet>
          <Bullet>Maintain the security of your account credentials</Bullet>
          <Bullet>Promptly update your account details if they change</Bullet>
          <P>
            You are responsible for all activities that occur under your account. If you
            suspect unauthorized access, notify us immediately at {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="3. Food Ordering &amp; Menu">
          <P>
            Our menu is updated regularly to reflect seasonal specials, item availability,
            and pricing changes. All menu items are freshly prepared upon order confirmation.
          </P>
          <Bullet>Menu items, prices, and availability are subject to change without prior notice</Bullet>
          <Bullet>Customizations (extra spice, no onion, sauce on the side) are accommodated where possible but not guaranteed</Bullet>
          <Bullet>Images on the app are for illustrative purposes; actual presentation may vary</Bullet>
          <Bullet>Order modifications are accepted only before the order is sent to the kitchen (typically within 2 minutes of placement)</Bullet>
          <P>
            We reserve the right to decline orders at our discretion — including during peak
            hours or when ingredients are unavailable. In such cases, a full refund will be issued.
          </P>
        </Section>

        <Section title="4. Pricing &amp; Payment">
          <P>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
            unless stated otherwise. Delivery charges, if any, are displayed separately at
            checkout before order confirmation.
          </P>
          <P>We accept the following payment methods:</P>
          <Bullet>UPI (Google Pay, PhonePe, Paytm, BHIM)</Bullet>
          <Bullet>Credit / Debit cards (Visa, Mastercard, RuPay)</Bullet>
          <Bullet>Net banking</Bullet>
          <Bullet>Cash on Delivery (COD) — available at select locations</Bullet>
          <P>
            Payments are processed securely through our payment gateway. {COMPANY} does not
            store your card or banking credentials. In case of a payment failure, if your
            account was debited in error, the amount will be refunded within 5–7 business days.
          </P>
        </Section>

        <Section title="5. Order Processing &amp; Confirmation">
          <P>
            Once you place an order, you will receive an in-app confirmation along with an
            estimated preparation and delivery time. Order confirmation is subject to
            availability of items and our operational capacity.
          </P>
          <Bullet>Orders placed during peak hours may take longer to prepare</Bullet>
          <Bullet>Real-time status updates will be shown: Accepted → Preparing → Out for Delivery → Delivered</Bullet>
          <Bullet>If we are unable to fulfil your order, you will be notified and refunded in full</Bullet>
        </Section>

        <Section title="6. Delivery Policy">
          <P>
            We deliver within a defined radius from our kitchen locations. The delivery zone
            and applicable charges are displayed on the app based on your delivery address.
          </P>
          <Bullet>Delivery times are estimates and may vary due to traffic, weather, or high demand</Bullet>
          <Bullet>We are not liable for delays caused by circumstances beyond our control</Bullet>
          <Bullet>You must be available at the delivery address at the time of delivery</Bullet>
          <Bullet>Undelivered orders due to customer unavailability are non-refundable</Bullet>
          <P>
            Our delivery partners will attempt to contact you before marking an order as
            undeliverable. Orders unclaimed after two contact attempts may be cancelled
            without refund.
          </P>
        </Section>

        <Section title="7. Cancellation &amp; Refund Policy">
          <P>
            Cancellations are accepted only before the order enters the preparation stage.
            Once cooking has begun, cancellations are not possible.
          </P>
          <Bullet>Pre-preparation cancellations: full refund within 3–5 business days</Bullet>
          <Bullet>No refunds for orders cancelled after preparation has started</Bullet>
          <Bullet>Refunds for quality issues (wrong item, spoiled food) are processed after review within 48 hours</Bullet>
          <Bullet>To raise a refund request, contact us within 30 minutes of delivery with supporting photos</Bullet>
          <P>
            Refunds are credited to the original payment method or as {COMPANY} wallet credits
            at our discretion.
          </P>
        </Section>

        <Section title="8. Food Safety &amp; Allergen Information">
          <P>
            {COMPANY} takes food safety seriously. All our kitchens maintain hygiene standards
            in compliance with FSSAI regulations.
          </P>
          <P>Our Chinese cuisine commonly contains the following allergens:</P>
          <Bullet>Peanuts and tree nuts — used in sauces and garnishes</Bullet>
          <Bullet>Soy and soy derivatives — present in most sauces including soy sauce and oyster sauce</Bullet>
          <Bullet>Gluten — present in noodles, dumplings, and batter coatings</Bullet>
          <Bullet>Shellfish — used in some dim sum and seafood preparations</Bullet>
          <Bullet>Eggs — present in fried rice, noodles, and coatings</Bullet>
          <P>
            We cannot guarantee that any dish is completely free of allergens due to shared
            kitchen equipment. Users with severe allergies should exercise caution. {COMPANY}
            is not liable for allergic reactions when allergen information has been disclosed.
          </P>
        </Section>

        <Section title="9. Promotions &amp; Discounts">
          <P>
            Promotional offers, discount codes, and cashbacks are subject to specific terms
            stated at the time of the offer.
          </P>
          <Bullet>Promo codes are non-transferable and valid for single use per account unless stated otherwise</Bullet>
          <Bullet>Offers cannot be combined with other discounts unless explicitly permitted</Bullet>
          <Bullet>We reserve the right to withdraw or modify any promotion at any time</Bullet>
          <Bullet>Misuse or fraudulent redemption of offers may result in account suspension</Bullet>
        </Section>

        <Section title="10. User Conduct &amp; Prohibited Activities">
          <P>You agree not to use {COMPANY} to:</P>
          <Bullet>Place fraudulent, fake, or prank orders</Bullet>
          <Bullet>Abuse, harass, or threaten our delivery partners or support staff</Bullet>
          <Bullet>Attempt to gain unauthorized access to our systems or data</Bullet>
          <Bullet>Use automated tools, bots, or scrapers on our platform</Bullet>
          <Bullet>Provide false information or impersonate another person</Bullet>
          <P>
            Violation of these terms may result in immediate account suspension and potential
            legal action.
          </P>
        </Section>

        <Section title="11. Intellectual Property">
          <P>
            All content on the {COMPANY} app — including logos, images, menu descriptions,
            and branding — is the exclusive property of {COMPANY} or its licensors, protected
            under applicable intellectual property laws.
          </P>
          <P>
            You may not reproduce, distribute, or use any content from our app without prior
            written permission from {COMPANY}.
          </P>
        </Section>

        <Section title="12. Limitation of Liability">
          <P>
            To the fullest extent permitted by law, {COMPANY} shall not be liable for any
            indirect, incidental, special, or consequential damages arising from:
          </P>
          <Bullet>Use or inability to use our services</Bullet>
          <Bullet>Delays in delivery beyond our reasonable control</Bullet>
          <Bullet>Allergic reactions when allergens have been disclosed</Bullet>
          <Bullet>Third-party payment processing errors</Bullet>
          <P>Our total liability in any case shall not exceed the value of the order in question.</P>
        </Section>

        <Section title="13. Indemnification">
          <P>
            You agree to indemnify and hold harmless {COMPANY}, its officers, employees, and
            agents from any claims, damages, or expenses (including legal fees) arising from
            your violation of these Terms or misuse of the app.
          </P>
        </Section>

        <Section title="14. Governing Law &amp; Dispute Resolution">
          <P>
            These Terms are governed by the laws of India. Any disputes arising from your
            use of {COMPANY} shall first be attempted to be resolved amicably through our
            customer support team at {CONTACT_EMAIL}.
          </P>
          <P>
            If unresolved, disputes shall be subject to the exclusive jurisdiction of the
            courts located in Uttarakhand, India.
          </P>
        </Section>

        <Section title="15. Modifications &amp; Contact Us">
          <P>
            We reserve the right to modify these Terms at any time. Changes take effect
            immediately upon posting in the app. Your continued use of {COMPANY} after
            changes constitutes acceptance.
          </P>
          <P>For questions or feedback regarding these Terms, reach us at:</P>
          <Bullet>📞 Mobile: {PHONE}</Bullet>
          <Bullet>✉️ Email: {CONTACT_EMAIL}</Bullet>
          <Bullet>🌐 Website: {WEBSITE}</Bullet>
          <Bullet>🕐 Support hours: Monday – Saturday, 10 AM – 8 PM IST</Bullet>
          <Bullet>📅 Established: {ESTABLISHED}</Bullet>
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
  bulletRow: { flexDirection: 'row', marginBottom: 7, paddingLeft: 4 },
  bulletDot: { fontSize: 14, color: RED, marginRight: 8, lineHeight: 22, fontFamily: F.sans800 },
  bulletText:{ flex: 1, fontSize: 14, color: MUTED, lineHeight: 22 },
});
