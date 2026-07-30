import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Does building a premium website really cost $1,000?',
    answer:
      'Not necessarily. Traditional website development can easily cost $1,000–$5,000 when you factor in design, development, content, and maintenance. However, modern tools like an AI website builder drastically reduce this cost. With AppSketch, you can create a fully functional website using a powerful website builder without hiring designers or developers. You get templates, AI-generated content, customization tools, and hosting-ready output—all at a fraction of traditional website building costs.',
  },
  {
    question: 'How does AppSketch work as an AI website builder?',
    answer:
      'AppSketch works by turning simple prompts and selections into fully structured websites. As an AI website builder, it generates layouts, content sections, and branding elements automatically. You can start with a prompt, choose a template, and customize everything visually using the built-in Website Builder. For online stores, the platform also includes e-commerce-ready components, allowing users to switch seamlessly between website creation and selling without technical setup.',
  },
  {
    question: 'Do I need designers or developers if I use AppSketch?',
    answer:
      'No. AppSketch is designed to reduce dependency on designers and developers. Its AI Website Builder generates layouts, content, and branding automatically, while templates and components make customization easy. The Website Builder gives you control without complexity, helping businesses save time and money while still achieving professional-looking results.',
  },
  {
    question: 'Is an AI website builder reliable for real businesses?',
    answer:
      'Absolutely. Modern AI website builders can handle real-world business needs such as scalability, SEO, and performance. AppSketch is designed for startups, service providers, and e-commerce brands that need speed without compromising quality. Its website builder uses AI to assist with layout, content, and branding while still giving you full control. This balance makes it suitable for businesses that want professional results without long development cycles.',
  },
  {
    question: 'How long does it take to build a website?',
    answer:
      'Building a website traditionally can take anywhere from a few weeks to several months. The process often involves planning, design iterations, content writing, development, and revisions with multiple stakeholders. However, with AppSketch, you can generate a complete website in minutes using its AI Website Builder. Layouts, content sections and design elements are created instantly, allowing businesses to launch faster without long development cycles.',
  },
  {
    question: 'Can AppSketch help with marketing and branding?',
    answer:
      'Yes. AppSketch includes a built-in marketing dashboard that helps businesses manage branding and marketing from one place. You can create campaign assets like posters, banners, social creatives, reels, and promotional visuals using AI. The platform also allows you to write and publish blog articles through the built-in CMS, create SEO-friendly content, and manage website updates. Combined with the Website Builder and Ecommerce Builder, AppSketch supports brand consistency, content creation, and online visibility without needing multiple tools.',
  },
  {
    question:
      'Can AppSketch handle payments, products, and checkout for e-commerce?',
    answer:
      'Yes. AppSketch includes a full E-commerce Builder that supports product listings, pricing, and checkout-ready layouts. Using the AI Ecommerce Builder, you can create product grids, collections, and store pages designed for selling online. The platform is built to support common e-commerce needs, allowing businesses to launch online stores quickly without complex setup. This makes AppSketch suitable for startups, creators, and businesses looking for a streamlined way to sell products through a modern website builder.',
  },
  {
    question: 'Is AppSketch suitable for both websites and online stores?',
    answer:
      'AppSketch works for both. It functions as a flexible Website Builder for business sites, portfolios, and service pages, while also acting as a full Ecommerce Builder for online stores. With its AI Ecommerce Builder, you can sell products, manage layouts, and customize store pages easily. This dual capability makes AppSketch ideal for businesses that want one platform for content, commerce, and growth.',
  },
  {
    question: 'What makes AppSketch the best Website Builder tool?',
    answer:
      'AppSketch stands out by combining AI, templates, CMS, and marketing tools in one platform. Unlike many builders, it goes beyond basic page creation. As both a Website Builder and AI Ecommerce Builder, it supports businesses at every stage; from launch to growth. For users searching for the best website builder tool, AppSketch offers speed, flexibility, and an integrated workflow that simplifies website and e-commerce management.',
  },
  {
    question:
      'Is AppSketch good for beginners starting their first website or store?',
    answer:
      'Yes. AppSketch is beginner-friendly while still powerful enough for growing businesses. The AI Website Builder guides users through prompts, templates, and ready-made components, removing technical barriers. Beginners can start with a simple website and later expand into ecommerce using the Ecommerce Builder. This makes AppSketch an ideal platform for first-time founders, creators, and small businesses entering the online space.',
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
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[!isLast && s.rowBorder, { borderColor: t.border }]}
    >
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
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <Text style={[s.answer, { color: t.textSub }]}>{item.answer}</Text>
        </Animated.View>
      )}
    </Animated.View>
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
    paddingHorizontal: 8,
    paddingTop: 35,
    paddingBottom: 22,
  },

  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 15,
  },
  question: {
    flex: 1,
    fontFamily: F.sans700,
    fontSize: 14.5,
    lineHeight: 20,
  },
  answer: {
    fontFamily: F.sans400,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -8,
    paddingBottom: 20,
  },
});
