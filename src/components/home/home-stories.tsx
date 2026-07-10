/**
 * HomeStories — v4
 *
 * Fixes:
 *  1. Left image stretches full card height — no gap at bottom
 *  2. 4 inner cards live inside a white rounded card with shadow (HomeProductRail style)
 *     image-only, no text, equal padding on all sides
 *  3. Right panel has proper left padding (never touches the divider)
 *  4. Premium font stack throughout
 *  5. Card height derived mathematically — nothing overflows
 */

import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter }         from 'expo-router';
import { Image, Text }       from '@/components/ui';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  white:      '#FFFFFF',
  bg:         '#E8F5E9',   // light green page bg
  black:      '#0F2318',   // forest green dark
  blackSoft:  '#1A3822',
  grey:       '#4B7A55',
  greyLight:  '#D4EDDA',
  greyBorder: '#C8E6C9',
  orange:     '#A3E635',   // lime (accent)
  cardRadius: 18,
  innerRadius: 11,
} as const;

const FONT = {
  black:   Platform.select({ ios: 'SF Pro Display',   android: 'sans-serif-black'  }),
  bold:    Platform.select({ ios: 'SF Pro Text',      android: 'sans-serif-medium' }),
  regular: Platform.select({ ios: 'SF Pro Text',      android: 'sans-serif'        }),
};

// ─── Layout constants ────────────────────────────────────────────────────────
const OUTER_MX    = 16;   // screen-edge margin each side
const LEFT_FRAC   = 0.44; // left panel = 44% of card
const R_PAD_L     = 14;   // right panel left padding
const R_PAD_R     = 12;   // right panel right padding
const R_PAD_T     = 14;   // right panel top padding
const R_PAD_B     = 12;   // right panel bottom padding
const GRID_GAP    = 6;    // gap between inner cards
const GRID_WRAP_P = 8;    // padding inside the white grid wrapper card

// Fixed text-row heights (for math)
const H_CAT       = 22;   // category badge row
const H_NAME      = 44;   // product name (2 lines)
const H_DESC      = 34;   // description
const H_NAME_GAP  = 4;
const H_DESC_GAP  = 6;
const H_GRID_GAP  = 10;   // gap above grid card

// ─── Types ───────────────────────────────────────────────────────────────────
export type LiveMediaType = 'image' | 'video' | 'gif';
export type LiveThumb     = { uri: string };

export type LiveCard = {
  id:           string;
  mediaType:    LiveMediaType;
  mediaUri:     string;
  category:     string;
  productName:  string;
  description:  string;
  ctaLabel:     string;
  ctaHref:      string;
  thumbs:       LiveThumb[];
  cardBg?:      string;
  accentColor?: string;
};

// ─── Default config — 2 grocery cards ───────────────────────────────────────
export const LIVE_CONFIG: LiveCard[] = [
  {
    id:          'g1',
    mediaType:   'image',
    mediaUri:    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80',
    category:    '🥦 Farm Fresh',
    productName: 'Vegetables & Greens',
    description: 'Handpicked daily from local farms',
    ctaLabel:    'Shop Now',
    ctaHref:     '/storefront/categories',
    cardBg:      '#EDF7EE',
    accentColor: '#16A34A',
    thumbs: [
      { uri: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80' },
      { uri: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=300&q=80' },
      { uri: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=300&q=80' },
      { uri: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=300&q=80' },
    ],
  }
];


// ─────────────────────────────────────────────────────────────────────────────
// WHITE GRID WRAPPER CARD  — houses the 2×2 inner product images
// ─────────────────────────────────────────────────────────────────────────────
function GridCard({ thumbs, innerW }: { thumbs: LiveThumb[]; innerW: number }) {
  // Available width inside the white card (after its own padding on both sides)
  const availW   = innerW - GRID_WRAP_P * 2;
  const tileSize = Math.floor((availW - GRID_GAP) / 2);

  const show     = thumbs.slice(0, 4);
  const overflow = thumbs.length > 4 ? thumbs.length - 3 : 0;

  // White card total height: padding top + row1 + gap + row2 + padding bottom
  const cardH = GRID_WRAP_P + tileSize + GRID_GAP + tileSize + GRID_WRAP_P;

  return (
    <View style={[gc.card, { height: cardH }]}>
      <View style={gc.grid}>
        {show.map((th, i) => {
          const isOverflow = overflow > 0 && i === 3;
          return (
            <View
              key={i}
              style={[
  gc.tile,
  {
    flexBasis: '48%',          // 👈 ensures 2 items per row
    aspectRatio: 1,            // 👈 keeps square shape
    marginBottom: GRID_GAP,    // vertical gap
  },
]}
            >
              <Image
                source={{ uri: th.uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              {isOverflow && (
                <View style={gc.overflowLayer}>
                  <Text style={gc.overflowTxt}>+{overflow}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const gc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius:    T.innerRadius,
    borderWidth:     1,
    borderColor:     T.greyBorder,
    padding:         GRID_WRAP_P,
    ...Platform.select({
      ios:     { shadowColor: '#0F2318', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    borderRadius: 7,
    overflow:     'hidden',
    backgroundColor: T.greyLight,
  },
  overflowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  overflowTxt: {
    color:         T.white,
    fontSize:      17,
    fontWeight:    '900',
    letterSpacing: -0.4,
    fontFamily:    FONT.black,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA PANEL
// ─────────────────────────────────────────────────────────────────────────────
function MediaPanel({ card, w, h }: { card: LiveCard; w: number; h: number }) {
  if (card.mediaType === 'video') {
    return (
      <Video
        source={{ uri: card.mediaUri }}
        style={{ width: w, height: h }}
        resizeMode={ResizeMode.COVER}
        shouldPlay isLooping isMuted
      />
    );
  }
  return (
    <Image
      source={{ uri: card.mediaUri }}
      style={{ width: w, height: h }}
      contentFit="cover"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CARD ROW
//
// Height math (all explicit, no flex surprises):
//   rightInnerW = rightW - R_PAD_L - R_PAD_R
//   tileSize    = (rightInnerW - GRID_WRAP_P*2 - GRID_GAP) / 2
//   gridCardH   = GRID_WRAP_P + tileSize + GRID_GAP + tileSize + GRID_WRAP_P
//   cardH       = R_PAD_T + H_FROM + H_NAME_GAP + H_NAME + H_TIMER_GAP
//               + H_TIMER + H_GRID_GAP + gridCardH + R_PAD_B
// ─────────────────────────────────────────────────────────────────────────────
function LiveCardRow({ card }: { card: LiveCard }) {
  const router          = useRouter();
  const { width: scrW } = useWindowDimensions();

  const accent   = card.accentColor ?? T.orange;
  const bg       = card.cardBg      ?? T.white;

  const cardW       = scrW - OUTER_MX * 2;
  const leftW       = Math.floor(cardW * LEFT_FRAC);
  const rightW      = cardW - leftW;                       // includes the 1px divider
  const rightInnerW = rightW - R_PAD_L - R_PAD_R;

  // Grid tile math
  const tileSize  = Math.floor((rightInnerW - GRID_WRAP_P * 2 - GRID_GAP) / 2);
  const gridCardH = GRID_WRAP_P + tileSize + GRID_GAP + tileSize + GRID_WRAP_P;

  // Total card height — driven by right panel content
  const cardH =
    R_PAD_T +
    H_CAT +
    H_NAME_GAP +
    H_NAME +
    H_DESC_GAP +
    H_DESC +
    H_GRID_GAP +
    gridCardH +
    R_PAD_B;

  const pressScale = React.useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(pressScale, { toValue: 0.985, useNativeDriver: true, speed: 60, bounciness: 2 }).start();
  const onOut = () => Animated.spring(pressScale, { toValue: 1,     useNativeDriver: true, speed: 60, bounciness: 2 }).start();

  return (
    <Animated.View
      style={[
        { transform: [{ scale: pressScale }] },
        Platform.select({
          ios:     { shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
          android: { elevation: 5 },
        }) as object,
      ]}
    >
      <Pressable
        onPressIn={onIn}
        onPressOut={onOut}
        onPress={() => router.push(card.ctaHref as any)}
        style={[lc.card, { backgroundColor: bg, width: cardW, height: cardH }]}
      >
        {/* ── LEFT: full-height media ── */}
        <View style={[lc.left, { width: leftW, height: cardH }]}>
          {/* Image fills entire left panel height */}
          <MediaPanel card={card} w={leftW} h={cardH} />

          {/* CTA button pinned to bottom inside image */}
          <View style={lc.ctaWrap}>
            <View style={lc.ctaBtn}>
              <Text style={lc.ctaTxt}>{card.ctaLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── RIGHT: text + grid card ── */}
        <View
          style={[
            lc.right,
            {
              width:          rightW,
              height:         cardH,
              paddingLeft:    R_PAD_L,
              paddingRight:   R_PAD_R,
              paddingTop:     R_PAD_T,
              paddingBottom:  R_PAD_B,
            },
          ]}
        >
          {/* Category badge */}
          <View style={{ height: H_CAT, justifyContent: 'center' }}>
            <Text style={lc.category}>{card.category}</Text>
          </View>

          {/* Product name */}
          <View style={{ height: H_NAME_GAP + H_NAME }}>
            <Text style={lc.name} numberOfLines={2}>{card.productName}</Text>
          </View>

          {/* Description */}
          <View style={{ height: H_DESC_GAP + H_DESC, justifyContent: 'flex-end' }}>
            <Text style={lc.description} numberOfLines={2}>{card.description}</Text>
          </View>

          {/* Gap above grid card */}
          <View style={{ height: H_GRID_GAP }} />

          {/* White grid card */}
          <GridCard thumbs={card.thumbs} innerW={rightInnerW} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const lc = StyleSheet.create({
  card: {
    flexDirection:  'row',
    borderRadius:   T.cardRadius,
    overflow:       'hidden',
    borderWidth:    1,
    borderColor:    T.greyBorder,
  },
  left: {
    flexShrink: 0,
    position:   'relative',
    overflow:   'hidden',
  },
  ctaWrap: {
    position: 'absolute',
    bottom:   10,
    left:     8,
    right:    8,
  },
  ctaBtn: {
    backgroundColor:   'rgba(10,28,16,0.82)',
    borderRadius:      10,
    paddingVertical:   9,
    alignItems:        'center',
    borderWidth:       1,
    borderColor:       'rgba(163,230,53,0.20)',
  },
  ctaTxt: {
    color:         T.white,
    fontSize:      13,
    fontWeight:    '800',
    letterSpacing: 0.1,
    fontFamily:    FONT.bold,
  },
  right: {
    overflow: 'hidden',
  },
  category: {
    fontSize:      12,
    color:         T.grey,
    fontWeight:    '700',
    fontFamily:    FONT.bold,
    lineHeight:    22,
  },
  name: {
    fontSize:      16,
    fontWeight:    '900',
    color:         T.black,
    lineHeight:    22,
    letterSpacing: -0.4,
    fontFamily:    FONT.black,
    marginTop:     4,
  },
  description: {
    fontSize:   12,
    fontWeight: '500',
    color:      T.grey,
    lineHeight: 17,
    fontFamily: FONT.regular,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ onSeeAll }: { onSeeAll?: () => void }) {
  const router = useRouter();
  return (
    <View style={hdr.row}>
      <View>
        <Text style={hdr.title}>Featured Deals</Text>
        <Text style={hdr.sub}>Handpicked for you today</Text>
      </View>
      <Pressable
        onPress={onSeeAll ?? (() => router.push('/storefront/categories' as any))}
        style={hdr.btn}
        hitSlop={8}
      >
        <Text style={hdr.arrow}>→</Text>
      </Pressable>
    </View>
  );
}

const hdr = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: OUTER_MX,
    marginBottom:      14,
  },
  title: {
    flex:          1,
    fontSize:      18,
    fontWeight:    '900',
    color:         T.black,
    letterSpacing: -0.4,
    lineHeight:    24,
    fontFamily:    FONT.black,
  },
  sub: {
    fontSize:   12,
    color:      T.grey,
    fontWeight: '500',
    marginTop:  2,
  },
  btn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: T.white,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     T.greyBorder,
    marginLeft:      10,
    flexShrink:      0,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  arrow: {
    fontSize:   16,
    fontWeight: '700',
    color:      T.black,
    fontFamily: FONT.bold,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// HomeStories — main export
// ─────────────────────────────────────────────────────────────────────────────
type HomeStoriesProps = {
  stories?:      any[];
  primaryColor?: string;
  liveConfig?:   LiveCard[];
  onSeeAll?:     () => void;
};

export function HomeStories({ liveConfig = LIVE_CONFIG, onSeeAll }: HomeStoriesProps) {
  return (
    <View style={hs.root}>
      <SectionHeader onSeeAll={onSeeAll} />
      <View style={hs.stack}>
        {liveConfig.map(card => (
          <LiveCardRow key={card.id} card={card} />
        ))}
      </View>
    </View>
  );
}

const hs = StyleSheet.create({
  root: {
    backgroundColor: T.bg,
    paddingTop:      20,
    paddingBottom:   24,
  },
  stack: {
    paddingHorizontal: OUTER_MX,
    gap:               10,
  },
});