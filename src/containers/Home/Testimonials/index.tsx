import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { F } from '@/lib/fonts';
import { SectionHeading } from '../components/SectionHeading';
import { homeTheme, type HomeColors } from '../theme/HomeTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_PADDING = 8;
// Floor, not divide evenly — an odd screen width rounding up half a pixel
// past the container's content box was enough to push the 2nd column onto
// its own row, collapsing the grid into a single column.
const GRID_CARD_W = Math.floor((SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2);

const NAV_BTN_W = 40;
const MODAL_PREVIEW_H = Math.round(SCREEN_H * 0.34);

const TESTIMONIALS: {
  id: number,
  quote: string;
  name: string;
  role: string;
  avatar: string;
  preview: string;
  companyName: string;
}[] = [
    {
      id: 1,
      quote: 'Appsketch gives us everything we need to move fast. We don\'t wait on dev. We don\'t compromise on design.',
      name: 'Nitin Kshatriya',
      role: 'Head of Design at Vijaya Eats',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ezgif.com-optimize_4.gif',
      companyName: 'Vijaya Eats'
    },
    {
      id: 2,
      quote: 'Launching on Appsketch was seamless. Live in no time, no friction.',
      name: 'Sudhanshu Verma',
      role: 'Product Lead at Rebuild Clinic',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ezgif.com-optimize_5.gif',
      companyName: 'Rebuild Clinic'
    },
    {
      id: 3,
      quote: 'Appsketch gave us full creative freedom. No code limits, no handoffs.',
      name: 'Ashish Dabariya',
      role: 'Design Director at Prodigy Pawns',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ezgif.com-optimize_6.gif',
      companyName: 'Prodigy Pawns'
    },

    {
      id: 4,
      quote: 'The speed of iteration with Appsketch is unmatched. It feels like designing in the future.',
      name: 'Himanshi Verma',
      role: 'Co-founder at Incito India',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ScreenRecording2026-01-13at7.17.03PM-ezgif.com-optimize.gif',
      companyName: 'Incito India'

    },
    {
      id: 5,
      quote: 'Finally a tool that understands designers. The output is exactly what I envisioned.',
      name: 'Rashmi Singhal',
      role: 'Design Systems Lead at RealValue Mart',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ezgif.com-optimize_1.gif',
      companyName: 'RealValue Mart'
    },
    {
      id: 6,
      quote: 'The performance is incredible. Lighthouse scores are all green without any extra effort.',
      name: 'Sarah Johnson',
      role: 'Engineering Manager at EatCake',
      avatar: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=100&h=100&fit=crop',
      preview: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/ezgif.com-optimize_2.gif',
      companyName: 'EatCake'
    }
  ];


const TestimonialGridCard = React.memo(function TestimonialGridCard({
  item,
  t,
  lastInRow,
  onPress,
}: {
  item: (typeof TESTIMONIALS)[number];
  t: HomeColors;
  /** Right-hand column: no trailing margin, so the row ends flush at the
   *  section's 8px inset. Column spacing is done with margins rather than
   *  `gap` — the gap shorthand plus flexWrap was rounding the pair a
   *  fraction of a pixel past the content box and wrapping every card onto
   *  its own row. */
  lastInRow: boolean;
  onPress: () => void;
}) {
  return (
    // Layout and skin live on plain Views, never on the Pressable. NativeWind's
    // JSX transform (jsxImportSource) wraps every element, and a `style`
    // callback on Pressable gets dropped on the way through — which silently
    // cost this card its width, border and padding. Pressable stays style-less
    // here and is purely the touch target.
    <View style={[s.cardOuter, !lastInRow && s.cardSpacer]}>
      <Pressable onPress={onPress}>
        <View style={[s.card, { borderColor: t.agentTabBorder }]}>
      <ExpoImage
        source={{ uri: item.preview }}
        style={s.preview}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
      />

      <View style={s.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Ionicons key={i} name="star" size={11} color={t.accent} />
        ))}
      </View>

      <Text style={[s.quote, { color: t.text }]} numberOfLines={3}>
        "{item.quote}"
      </Text>

      <View style={s.authorRow}>
        <ExpoImage
          source={{ uri: item.avatar }}
          style={s.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
        <View style={s.authorInfo}>
          <Text style={[s.authorName, { color: t.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[s.authorRole, { color: t.textSub }]} numberOfLines={2}>
            {item.role}
          </Text>
        </View>
      </View>
        </View>
      </Pressable>
    </View>
  );
});

function TestimonialModal({
  index,
  t,
  isDark,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  t: HomeColors;
  isDark: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = TESTIMONIALS[index];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.modalRoot}>
        <BlurView
          intensity={Platform.OS === 'android' ? 90 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.modalScrim]} />

        {/* Tap anywhere outside the card to dismiss */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* Arrows and card sit in one flow row — left arrow, card, right
            arrow — rather than absolutely-positioned overlays, so they stay
            pinned to the card's sides at any screen size. */}
        <View style={s.modalRow} pointerEvents="box-none">
          <Pressable onPress={onPrev} hitSlop={10}>
            <View style={s.navBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </View>
          </Pressable>

          <View style={s.modalColumn} pointerEvents="box-none">
            <Pressable onPress={onClose} hitSlop={10} style={s.closeAlign}>
              <View style={s.modalClose}>
                <Ionicons name="close" size={17} color="#fff" />
              </View>
            </Pressable>

            <View style={[s.modalCard, { backgroundColor: t.sheetBg, borderColor: t.agentTabBorder }]}>
              <ExpoImage
                // Remounts on index change so the GIF restarts from frame 1
                // instead of resuming mid-loop from the previous testimonial.
                key={item.id}
                source={{ uri: item.preview }}
                style={s.modalPreview}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />

              <View style={s.modalBody}>
                <View style={s.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name="star" size={15} color={t.accent} />
                  ))}
                </View>

                <Text style={[s.modalQuote, { color: t.text }]}>"{item.quote}"</Text>

                <View style={s.authorRow}>
                  <ExpoImage
                    source={{ uri: item.avatar }}
                    style={s.modalAvatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={0}
                  />
                  <View style={s.authorInfo}>
                    <Text style={[s.modalAuthorName, { color: t.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[s.modalAuthorRole, { color: t.textSub }]} numberOfLines={1}>
                      {item.role}
                    </Text>
                  </View>
                  <Text style={[s.companyText, { color: t.accent }]} numberOfLines={1}>
                    {item.companyName}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable onPress={onNext} hitSlop={10}>
            <View style={s.navBtn}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function TestimonialsSection() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = homeTheme[isDark ? 'dark' : 'light'];

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const closeModal = React.useCallback(() => setOpenIndex(null), []);
  const showPrev = React.useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)),
    []
  );
  const showNext = React.useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % TESTIMONIALS.length)),
    []
  );

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

      <View style={s.grid}>
        {TESTIMONIALS.map((item, i) => (
          <TestimonialGridCard
            key={item.id}
            item={item}
            t={t}
            lastInRow={i % 2 === 1}
            onPress={() => setOpenIndex(i)}
          />
        ))}
      </View>

      {openIndex !== null && (
        <TestimonialModal
          index={openIndex}
          t={t}
          isDark={isDark}
          onClose={closeModal}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  inset: {
    paddingHorizontal: GRID_PADDING,
  },

  // ── 2-up grid ─────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardOuter: {
    width: GRID_CARD_W,
    marginBottom: GRID_GAP,
  },
  cardSpacer: {
    marginRight: GRID_GAP,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  preview: {
    width: GRID_CARD_W,
    height: 120,
    marginLeft: -12,
    marginTop: -12,
    marginBottom: 12,
    backgroundColor: '#00000010',
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 10,
  },
  quote: {
    fontFamily: F.sans500,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  authorInfo: {
    flex: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  authorName: {
    fontFamily: F.sans700,
    fontSize: 12,
  },
  authorRole: {
    fontFamily: F.sans400,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  companyText: {
    fontFamily: F.sans600,
    fontSize: 13,
  },

  // ── Detail modal ──────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
  },
  modalScrim: {
    backgroundColor: '#00000066',
  },
  modalRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  modalColumn: {
    flex: 1,
    maxWidth: 460,
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  closeAlign: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginRight: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPreview: {
    width: '100%',
    height: MODAL_PREVIEW_H,
    backgroundColor: '#00000010',
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalQuote: {
    fontFamily: F.sans500,
    fontSize: 15.5,
    lineHeight: 24,
    marginBottom: 18,
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  modalAuthorName: {
    fontFamily: F.sans700,
    fontSize: 14,
  },
  modalAuthorRole: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    marginTop: 1,
  },
  navBtn: {
    width: NAV_BTN_W,
    height: NAV_BTN_W,
    borderRadius: NAV_BTN_W / 2,
    backgroundColor: '#00000080',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
