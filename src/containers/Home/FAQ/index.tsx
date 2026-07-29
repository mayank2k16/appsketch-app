import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

// Answer copy isn't visible in the source design (every row renders
// collapsed there) — written to match the product's existing tone
// (human-reviewed, no lock-in, fraction-of-agency-cost) rather than lifted
// from the artifact like the rest of this section's text.
const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Is my app really production-ready?',
    answer:
      'Yes — every build is reviewed and tested by our engineers before it ships, not just generated and left as-is.',
  },
  {
    question: 'Who owns the code?',
    answer:
      'You do. The moment your app ships, the full codebase is yours — no lock-in, no licensing fees.',
  },
  {
    question: 'How is it cheaper than an agency?',
    answer:
      'Our proprietary LLM drafts the bulk of the build in minutes, so our engineers spend their time tailoring it — not starting from scratch.',
  },
  {
    question: 'Can it fit our existing systems?',
    answer:
      'Yes. Our engineers integrate with your existing stack, APIs, and workflows during the human-review pass.',
  },
];

function FAQRow({
  item,
  isLast,
  t,
}: {
  item: (typeof FAQS)[number];
  isLast: boolean;
  t: HomeColors;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <View style={[!isLast && s.rowBorder, { borderColor: t.border }]}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
        style={s.row}
      >
        <Text style={[s.question, { color: t.text }]}>{item.question}</Text>
        <Ionicons
          name={open ? 'remove' : 'add'}
          size={20}
          color={t.accent}
        />
      </TouchableOpacity>
      {open && (
        <Text style={[s.answer, { color: t.textSub }]}>{item.answer}</Text>
      )}
    </View>
  );
}

export function FAQSection() {
  const { colorScheme } = useColorScheme();
  const t = homeTheme[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    // No section backgroundColor — same as the other new sections, so the
    // shared TwinkleDots backdrop keeps showing through here too.
    <View style={s.section}>
      <SectionHeading
        eyebrow="QUESTIONS"
        lines={['Good to know.']}
        t={t}
      />

      <View style={{ transform: [{ translateY: -15 }] }}>
        {FAQS.map((item, i) => (
          <FAQRow key={item.question} item={item} isLast={i === FAQS.length - 1} t={t} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 56,
  },

  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 15,
  },
  question: {
    flex: 1,
    fontFamily: F.sans700,
    fontSize: 16,
  },
  answer: {
    fontFamily: F.sans400,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
    paddingBottom: 20,
  },
});
