/**
 * HomeRecentlyViewed — 2×2 Promo Grid (React Native / Expo)
 *
 * ✅ Single clean export: HomeRecentlyViewed
 * ✅ Boxy cards — zero border radius on images
 * ✅ Light blue container, white cards, text below image
 * ✅ Config-driven
 * ✅ Uses same Image/Text imports as your existing code
 */

import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View as RNView,
} from 'react-native';

import { Image, Text, View } from '@/components/ui';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  // Outer wrapper
  containerBg:      '#D6E8F7',
  containerRadius:  1,
  containerMx:      0,   // horizontal margin from screen edge
  containerMy:      0,
  containerPad:     10,

  // Header
  headerTitle:      "Shop for Women's Tops",
  headerTitleColor: '#0D0D0D',
  headerTitleSize:  16,
  headerPath:       '/storefront/categories',

  // Arrow button
  arrowBg:          '#0D0D0D',
  arrowColor:       '#FFFFFF',

  // Cards
  cardBg:           '#FFFFFF',
  cardRadius:       9,    // card outer corner
  imageRadius:      0,    // BOXY — zero radius on image
  imageHeight:      160,

  // Card text
  subLabelColor:    '#777777',
  subLabelSize:     11,
  titleColor:       '#0D0D0D',
  titleSize:        13,

  // Grid gap
  gap:              7,

  // Shadow
  shadowColor:      '#000',
  shadowOpacity:    0.08,
  shadowRadius:     8,
  shadowOffsetY:    3,
  elevation:        3,

  // Tiles data
  tiles: [
    {
      id:       'tile-1',
      imageUrl: 'https://cdn.appsketch.ai/phurti-cloudfront/imagestore/Screenshot_2026-03-29_at_9.44.33PM.png',
      subLabel: 'Top Rated',
      title:    '4 Stars and Above',
      path:     '/storefront/categories',
    },
    {
      id:       'tile-2',
      imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400&q=80',
      subLabel: 'Top Collection',
      title:    'Best Brands',
      path:     '/storefront/categories',
    },
    {
      id:       'tile-3',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
      subLabel: 'Upto 70% off.',
      title:    'Top Rated',
      path:     '/storefront/categories',
    },
    {
      id:       'tile-4',
      imageUrl: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=400&q=80',
      subLabel: 'Affordable Options',
      title:    'Under ₹299',
      path:     '/storefront/categories',
    },
  ],
};

// ─── TILE CARD ────────────────────────────────────────────────────────────────
function TileCard({
  tile,
  onPress,
}: {
  tile:    typeof CONFIG.tiles[0];
  onPress: () => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const pressIn  = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60, bounciness: 2 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 2 }).start();

  return (
    <Animated.View
      style={[
        { flex: 1, transform: [{ scale }] },
        Platform.select({
          ios: {
            shadowColor:   CONFIG.shadowColor,
            shadowOpacity: CONFIG.shadowOpacity,
            shadowRadius:  CONFIG.shadowRadius,
            shadowOffset:  { width: 0, height: CONFIG.shadowOffsetY },
          },
          android: { elevation: CONFIG.elevation },
        }) as object,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.card,
          { borderRadius: CONFIG.cardRadius, backgroundColor: CONFIG.cardBg },
        ]}
      >
        {/* Boxy image */}
        <RNView
          style={{
            width:           '100%',
            height:          CONFIG.imageHeight,
            borderTopLeftRadius:  CONFIG.cardRadius,
            borderTopRightRadius: CONFIG.cardRadius,
            overflow:        'hidden',
            backgroundColor: '#E8E4DF',
          }}
        >
          <Image
            source={{ uri: tile.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </RNView>

        {/* Text */}
        <RNView style={styles.textBlock}>
          <Text style={[styles.subLabel, { color: CONFIG.subLabelColor, fontSize: CONFIG.subLabelSize }]}>
            {tile.subLabel}
          </Text>
          <Text
            style={[styles.title, { color: CONFIG.titleColor, fontSize: CONFIG.titleSize }]}
            numberOfLines={2}
          >
            {tile.title}
          </Text>
        </RNView>
      </Pressable>
    </Animated.View>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export function HomeRecentlyViewed() {
  const router = useRouter();

  // Split into rows of 2
  const rows: (typeof CONFIG.tiles[0])[][] = [];
  for (let i = 0; i < CONFIG.tiles.length; i += 2) {
    rows.push(CONFIG.tiles.slice(i, i + 2));
  }

  return (
    <View
      style={{
        backgroundColor: CONFIG.containerBg,
        borderRadius:    CONFIG.containerRadius,
        marginHorizontal: CONFIG.containerMx,
        marginVertical:  CONFIG.containerMy,
        padding:         CONFIG.containerPad,
        overflow:        'hidden',
      }}
    >
      {/* ── Header ── */}
      <RNView style={styles.header}>
        <Text style={[styles.headerTitle, { color: CONFIG.headerTitleColor, fontSize: CONFIG.headerTitleSize }]}>
          {CONFIG.headerTitle}
        </Text>
        <Pressable
          onPress={() => router.push(CONFIG.headerPath as never)}
          style={[styles.arrowBtn, { backgroundColor: CONFIG.arrowBg }]}
        >
          <Text style={[styles.arrowTxt, { color: CONFIG.arrowColor }]}>→</Text>
        </Pressable>
      </RNView>

      {/* ── Grid ── */}
      <RNView style={{ gap: CONFIG.gap }}>
        {rows.map((row, ri) => (
          <RNView key={ri} style={{ flexDirection: 'row', gap: CONFIG.gap }}>
            {row.map((tile) => (
              <TileCard
                key={tile.id}
                tile={tile}
                onPress={() => router.push(tile.path as never)}
              />
            ))}
          </RNView>
        ))}
      </RNView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   10,
  },
  headerTitle: {
    fontWeight:    '800',
    letterSpacing: -0.3,
    flex:          1,
    fontFamily:    Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  arrowBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    justifyContent: 'center',
    alignItems:     'center',
    marginLeft:     8,
  },
  arrowTxt: {
    fontSize:   15,
    fontWeight: '700',
    lineHeight: 18,
  },
  card: {
    overflow: 'hidden',
  },
  textBlock: {
    paddingHorizontal: 9,
    paddingTop:        7,
    paddingBottom:     10,
    gap:               2,
  },
  subLabel: {
    fontWeight: '400',
  },
  title: {
    fontWeight:    '700',
    letterSpacing: -0.2,
    lineHeight:    18,
    fontFamily:    Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
});