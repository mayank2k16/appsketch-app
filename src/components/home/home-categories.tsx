/**
 * HomeCategories — Premium Uniform Grid Edition
 *
 * Changes:
 * - Uniform 3-column grid (equal card heights, equal image areas) — no masonry
 * - Headline changed to "What are you craving today?"
 * - Animated black + blue decorative badge on the right of the headline
 * - Proxima Nova fonts throughout
 * - Orange accent subLabel, premium card info block
 * - Consistent padding, gap, and shadow across every card
 */

import * as React from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Image } from '@/components/ui';
import { F } from '@/lib/fonts';
import type { Category } from '@/api/home';

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED      = '#C41230';
const BLACK    = '#0C0C0C';
const GOLD     = '#FFD166';       // animated badge accent
const BG       = '#FFF5F7';       // section background
const CARD_BG  = '#FFFFFF';
const IMG_BG   = '#FFE4E8';
const GREY     = '#909090';
const BORDER   = 'rgba(0,0,0,0.07)';

// ─── Fixed card dimensions (uniform — no masonry) ─────────────────────────────
const CARD_RADIUS   = 12;
const CARD_PAD      = 6;          // padding around image inside card
const CARD_IMG_H    = 115;        // every image area is exactly this tall
const CARD_BODY_H   = 72;         // fixed info area height
const CARD_TOTAL_H  = CARD_PAD + CARD_IMG_H + CARD_BODY_H;  // uniform card height

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export type HomeCategoriesConfig = Partial<{
  background:   string;
  locationText: string;
  columnCount:  number;
  gap:          number;
  outerPad:     number;
}>;

// ─── PROPS ────────────────────────────────────────────────────────────────────
type HomeCategoriesProps = {
  categories?:   Category[];
  config?:       HomeCategoriesConfig;
  previewCount?: number;
  headline?:     string;
  subLabel?:     string;
  onViewAll?:    () => void;
  primaryColor?: string;   // accepted for API compatibility, unused (orange is baked in)
};

// ─── Shimmer hook (skeleton loading) ─────────────────────────────────────────
function useShimmer() {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.48] });
}

// ─── Animated right-side badge (black + blue) ─────────────────────────────────
function AnimatedCornerBadge() {
  const pulse  = React.useRef(new Animated.Value(1)).current;
  const shimX  = React.useRef(new Animated.Value(-80)).current;
  const dotAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Heartbeat pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    // Sweeping blue shimmer
    const runShim = () => {
      shimX.setValue(-80);
      Animated.timing(shimX, {
        toValue: 160, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
      }).start(({ finished }) => { if (finished) setTimeout(runShim, 2400); });
    };
    const t = setTimeout(runShim, 600);

    // Dot blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
      ]),
    ).start();

    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[hd.badge, { transform: [{ scale: pulse }] }]}>
      {/* Shimmer sweep */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimX }], overflow: 'hidden' }]}
      >
        <View style={hd.shimStripe} />
      </Animated.View>

      {/* Top row: live dot + "LIVE" */}
      <View style={hd.badgeLiveRow}>
        <Animated.View style={[hd.liveDot, { opacity: dotAnim }]} />
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="LIVE"
          style={hd.liveTxt}
        />
      </View>

      {/* Main number */}
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value="35+"
        style={hd.badgeNum}
      />
      <TextInput
        editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
        value="DISHES"
        style={hd.badgeSub}
      />
    </Animated.View>
  );
}

// ─── Category card (uniform height) ──────────────────────────────────────────
function CategoryCard({
  category,
  width,
  onPress,
}: {
  category: Category;
  width:    number;
  onPress:  () => void;
}) {
  const scale    = React.useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, speed: 50, bounciness: 2 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 50, bounciness: 2 }).start();

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], width },
        Platform.select({
          ios: {
            shadowColor: '#000', shadowOpacity: 0.09,
            shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
          },
          android: { elevation: 4 },
        }) as object,
      ]}
    >
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={[cs.card, { width, height: CARD_TOTAL_H }]}>

          {/* Image area — fixed height */}
          <View style={cs.imgWrap}>
            <Image
              source={{ uri: category.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            {/* Subtle gradient overlay at bottom of image */}
            <View style={cs.imgGrad} pointerEvents="none" />
          </View>

          {/* Info block — fixed height */}
          <View style={cs.info}>
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value={category.name}
              style={cs.title}
              numberOfLines={2}
            />
            <View style={cs.pill}>
              <TextInput
                editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                value="Order Now →"
                style={cs.pillTxt}
              />
            </View>
          </View>

        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({
  shimmer,
  width,
}: {
  shimmer: Animated.AnimatedInterpolation<number>;
  width:   number;
}) {
  return (
    <Animated.View
      style={{
        width, height: CARD_TOTAL_H,
        borderRadius: CARD_RADIUS,
        backgroundColor: '#DDD9D3',
        opacity: shimmer,
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
          android: { elevation: 2 },
        }),
      }}
    />
  );
}

// ─── Uniform grid ─────────────────────────────────────────────────────────────
function UniformGrid({
  items,
  cardWidth,
  gap,
  shimmer,
  onPress,
}: {
  items:     (Category | null)[];
  cardWidth: number;
  gap:       number;
  shimmer:   Animated.AnimatedInterpolation<number>;
  onPress:   (cat: Category) => void;
}) {
  // Split into rows of 3
  const rows: (Category | null)[][] = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <View style={{ gap }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
          {row.map((item, ci) =>
            item ? (
              <CategoryCard
                key={item.id}
                category={item}
                width={cardWidth}
                onPress={() => onPress(item)}
              />
            ) : (
              <SkeletonCard
                key={`sk-${ri}-${ci}`}
                shimmer={shimmer}
                width={cardWidth}
              />
            )
          )}
          {/* Fill empty slots in last row so the row doesn't stretch */}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, ei) => (
            <View key={`empty-${ei}`} style={{ width: cardWidth }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function HomeCategories({
  categories,
  config: userConfig = {},
  previewCount = 16,
  headline     = 'What are you\ncraving today?',
  subLabel     = 'EXPLORE CATEGORIES',
  onViewAll,
  primaryColor: _primaryColor,  // unused — orange baked in
}: HomeCategoriesProps) {
  const router  = useRouter();
  const shimmer = useShimmer();
  const { width: screenW } = useWindowDimensions();

  const gap       = userConfig.gap      ?? 8;
  const outerPad  = userConfig.outerPad ?? 10;
  const columns   = userConfig.columnCount ?? 3;
  const bgColor   = userConfig.background  ?? BG;

  const innerW    = screenW - outerPad * 2;
  const cardWidth = Math.floor((innerW - gap * (columns - 1)) / columns);

  const isLoading = !categories;
  const displayed = isLoading
    ? (Array(previewCount).fill(null) as null[])
    : categories.slice(0, previewCount);

    const handlePress = (cat: Category) => {
      console.log(cat.id);
      console.log(cat.name);
    
      router.push({
        pathname: 'storefront/categories',
        params: {
          categoryId: cat.id,
          categoryName: cat.name,
        },
      });
    };
    
  return (
    <ScrollView
      style={{ backgroundColor: bgColor }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {/* ── Premium header ──────────────────────────────────────────────── */}
      <View style={[hd.root, { paddingHorizontal: outerPad + 4, backgroundColor: bgColor }]}>

        {/* Left: label + headline */}
        <View style={hd.left}>
          {/* Orange eyebrow pill */}
          <View style={hd.eyebrowPill}>
            <TextInput
              editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
              value={subLabel}
              style={hd.eyebrowTxt}
            />
          </View>

          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value={headline}
            style={hd.headline}
            multiline
          />

          {/* Underline accent */}
          <View style={hd.underline} />
        </View>

        {/* Right: animated black+blue badge */}
        <AnimatedCornerBadge />
      </View>

      {/* ── Uniform 3-column grid ──────────────────────────────────────── */}
      <View style={{ paddingHorizontal: outerPad, paddingTop: 6 }}>
        <UniformGrid
          items={displayed}
          cardWidth={cardWidth}
          gap={gap}
          shimmer={shimmer}
          onPress={handlePress}
        />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const hd = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    paddingTop:     24,
    paddingBottom:  16,
    gap:            12,
  },
  left: { flex: 1, gap: 6 },

  // Orange eyebrow pill
  eyebrowPill: {
    alignSelf:        'flex-start',
    backgroundColor:  `${RED}18`,
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      `${RED}55`,
    paddingHorizontal: 10,
    paddingVertical:  4,
  },
  eyebrowTxt: {
    fontSize:    9, fontFamily: F.sans800,
    color:       RED, letterSpacing: 2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 13,
  },

  // Main headline
  headline: {
    fontSize:    22, fontFamily: F.display900,
    color:       BLACK, letterSpacing: -0.5,
    lineHeight:  29,
    padding: 0, margin: 0, backgroundColor: 'transparent',
  },

  // Short orange underline accent
  underline: {
    width: 40, height: 3,
    borderRadius: 2,
    backgroundColor: RED,
    marginTop: 2,
  },

  // ── Animated badge ──────────────────────────────────────────────────────────
  badge: {
    width:           78, height: 78,
    borderRadius:    16,
    backgroundColor: BLACK,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    gap:             1,
    marginTop:       16,
    borderWidth:     1.5,
    borderColor:     `${GOLD}55`,
    ...Platform.select({
      ios: {
        shadowColor:   GOLD,
        shadowOpacity: 0.45,
        shadowRadius:  12,
        shadowOffset:  { width: 0, height: 0 },
      },
      android: { elevation: 8 },
    }),
  },
  shimStripe: {
    position: 'absolute', top: 0, bottom: 0,
    width: 40,
    backgroundColor: `${GOLD}40`,
    transform: [{ skewX: '-20deg' }],
  },
  badgeLiveRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            3,
  },
  liveDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: GOLD,
  },
  liveTxt: {
    fontSize:    7.5, fontFamily: F.sans900,
    color:       GOLD, letterSpacing: 1.5,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 11,
  },
  badgeNum: {
    fontSize:    26, fontFamily: F.display900,
    color:       '#FFFFFF', letterSpacing: -1,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 30,
  },
  badgeSub: {
    fontSize:    8, fontFamily: F.sans800,
    color:       `${GOLD}CC`, letterSpacing: 2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 12,
  },
});

const cs = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius:    CARD_RADIUS,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     BORDER,
  },

  // Image area — exactly CARD_PAD + CARD_IMG_H tall
  imgWrap: {
    margin:          CARD_PAD,
    marginBottom:    0,
    height:          CARD_IMG_H,
    borderRadius:    8,
    overflow:        'hidden',
    backgroundColor: IMG_BG,
  },
  imgGrad: {
    position:        'absolute',
    bottom:          0, left: 0, right: 0,
    height:          28,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },

  // Info block — fixed height
  info: {
    height:           CARD_BODY_H,
    paddingHorizontal: 8,
    paddingTop:        9,
    paddingBottom:     8,
    justifyContent:   'space-between',
  },
  title: {
    fontSize:    11.5, fontFamily: F.sans700,
    color:       BLACK, letterSpacing: -0.1, lineHeight: 15.5,
    padding: 0, margin: 0, backgroundColor: 'transparent',
  },
  pill: {
    alignSelf:        'flex-start',
    backgroundColor:  `${RED}15`,
    borderRadius:     6,
    paddingHorizontal: 7,
    paddingVertical:  3,
    borderWidth:      1,
    borderColor:      `${RED}40`,
  },
  pillTxt: {
    fontSize:    8.5, fontFamily: F.sans700,
    color:       RED, letterSpacing: 0.3,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 12,
  },
});
