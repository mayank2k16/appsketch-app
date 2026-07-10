/**
 * WishlistScreen
 *
 * Architecture (identical to ExploreScreen — keyboard focus safe):
 * ┌─────────────────────────────────┐
 * │  STATIC HEADER                  │  ← TextInput lives here, never re-renders
 * │  title + count + search bar     │    from search/list state changes
 * ├─────────────────────────────────┤
 * │  FLATLIST                       │  ← data swaps: 2-col cards ↔ 3-col search
 * └─────────────────────────────────┘
 *
 * APIs (unchanged):
 *   GET    api/shop/favourite_products/   → fetch wishlist
 *   DELETE api/shop/favourite_products/   → { product_id }
 */

import * as React from 'react';
import {
  View, Text, TextInput, Image, Pressable, FlatList, ScrollView,
  ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions,
  Platform, Animated, Keyboard, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authenticatedClient } from '@/api/common/client';
import { DrawerMenu } from '@/components/drawer-menu';
import { StorefrontHeaderWrapper } from '@/components/storefront/StorefrontHeaderWrapper';
import { useFocusEffect } from '@react-navigation/native';
import { F } from '@/lib/fonts';

const { width } = Dimensions.get('window');

// ── Tokens ─────────────────────────────────────────────────────────────────────
const BG      = '#FFF5F7';
const BLACK   = '#0D0D0D';
const DARK    = '#0D0D0D';
const SURFACE = '#FFFFFF';
const MUTED   = '#888888';
const BORDER  = '#FFD5D8';
const RED     = '#C41230';
const H_PAD   = 12;
const GAP2    = 1;   // gap between 2-col cards (tight, like reference)
const GAP3    = 6;   // gap between 3-col search cards
const COL2_W  = (width - GAP2) / 2;
const COL3_W  = (width - H_PAD * 2 - GAP3 * 2) / 3;
const H2      = [260, 320, 275, 330, 255, 295, 340, 265];
const H3      = [150, 185, 162, 195, 155, 172, 188, 158];

// ── Types ──────────────────────────────────────────────────────────────────────
type FavProduct = {
  id: number;
  product_id: {
    id: number; product_name: string; photo: string;
    images: string[]; market_price: number; price: number;
    rating: string; review_count?: number;
    categories: { name: string; id: number }[];
  };
};

type WishItem = {
  favId: number; productId: number; photo: string;
  name: string; price: number; mrp: number;
  rating: number; reviews: number; imgH: number;
};

// FlatList section descriptors
type SecTitle    = { type: 'title';    count: number };
type SecRow2     = { type: 'row2';     left: WishItem; right?: WishItem };
type SecSrchHdr  = { type: 'srchHdr'; count: number; query: string };
type SecRow3     = { type: 'row3';     items: WishItem[] };
type SecLoading  = { type: 'loading' };
type SecEmpty    = { type: 'empty';    isSearch: boolean };
type SecError    = { type: 'error' };
type Sec = SecTitle | SecRow2 | SecSrchHdr | SecRow3 | SecLoading | SecEmpty | SecError;

// ── Helpers ────────────────────────────────────────────────────────────────────
function favToItem(fav: FavProduct, idx: number, small = false): WishItem {
  const p = fav.product_id;
  return {
    favId: fav.id, productId: p.id,
    photo: p.photo || p.images?.[0] || '',
    name:  p.product_name || '',
    price: Number(p.price) || 0,
    mrp:   Number(p.market_price) || 0,
    rating: Number(p.rating) || 0,
    reviews: Number(p.review_count) || 0,
    imgH: small ? H3[idx % H3.length] : H2[idx % H2.length],
  };
}

function buildDefault(items: WishItem[]): Sec[] {
  if (!items.length) return [{ type: 'empty', isSearch: false }];
  const out: Sec[] = [{ type: 'title', count: items.length }];
  for (let i = 0; i < items.length; i += 2)
    out.push({ type: 'row2', left: items[i], right: items[i + 1] });
  return out;
}

function buildSearch(results: WishItem[], query: string): Sec[] {
  if (!results.length) return [{ type: 'empty', isSearch: true }];
  const out: Sec[] = [{ type: 'srchHdr', count: results.length, query }];
  for (let i = 0; i < results.length; i += 3)
    out.push({ type: 'row3', items: results.slice(i, i + 3) });
  return out;
}

// ── X Remove button ────────────────────────────────────────────────────────────
function XBtn({ onPress, removing, size = 30 }: {
  onPress: () => void; removing: boolean; size?: number;
}) {
  const sc = React.useRef(new Animated.Value(1)).current;
  const tap = () => {
    if (removing) return;
    Animated.sequence([
      Animated.spring(sc, { toValue: 0.8, useNativeDriver: true, speed: 60 }),
      Animated.spring(sc, { toValue: 1,   useNativeDriver: true, speed: 40 }),
    ]).start(() => onPress());
  };
  return (
    <TouchableOpacity onPress={tap} activeOpacity={0.8}
      style={[st.xBtn, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={{ transform: [{ scale: sc }] }}>
        {removing
          ? <ActivityIndicator size="small" color={MUTED} />
          : <Text style={{ fontSize: size * 0.38, color: '#555', fontFamily: F.sans700 }}>✕</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Fixed image height for uniform cards — no masonry
const CARD_IMG_H = COL2_W * 1.25;   // 5:4 portrait ratio, same for every card

// ── 2-col card — reference image exact style ────────────────────────────────────
function Card2({ item, onPress, onRemove, onMoveToCart, removing }: {
  item: WishItem; onPress: () => void;
  onRemove: () => void; onMoveToCart: () => void; removing: boolean;
}) {
  const disc = item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  return (
    <View style={[st.card2, { width: COL2_W }]}>
      {/* Image — fixed height, same on every card */}
      <Pressable onPress={onPress}>
        <View style={{ height: CARD_IMG_H, backgroundColor: '#ECECEC', overflow: 'hidden' }}>
          <Image source={{ uri: item.photo }}
            style={StyleSheet.absoluteFillObject} resizeMode="cover" />

          {/* X top-right */}
          <XBtn onPress={onRemove} removing={removing} size={32} />

          {/* Rating pill bottom-left */}
          {item.rating > 0 && (
            <View style={st.ratingPill}>
              <Text style={st.ratingNum}>{item.rating.toFixed(1)}</Text>
              <Text style={{ color: '#F59E0B', fontSize: 10 }}>★</Text>
              {item.reviews > 0 && (
                <Text style={st.ratingReviews}>{item.reviews}</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>

      {/* Info */}
      <View style={st.card2Body}>
        {/* Brand / name */}
        <Text numberOfLines={1} style={st.card2Name}>{item.name}</Text>

        {/* Price row */}
        <View style={st.priceRow}>
          <Text style={st.price}>₹{item.price.toLocaleString()}</Text>
          {item.mrp > item.price && (
            <Text style={st.mrp}>₹{item.mrp.toLocaleString()}</Text>
          )}
          {disc > 0 && (
            <Text style={st.discTxt}>({disc}% OFF)</Text>
          )}
        </View>

        {/* Move to Bag — matches reference exactly */}
        <TouchableOpacity onPress={onMoveToCart} style={st.moveBagRow} activeOpacity={0.75}>
          <Text style={st.moveBagTxt}>MOVE TO BAG</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 3-col compact search card ───────────────────────────────────────────────────
function Card3({ item, onPress, onRemove, removing }: {
  item: WishItem; onPress: () => void; onRemove: () => void; removing: boolean;
}) {
  const disc = item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
  return (
    <View style={{ width: COL3_W, marginBottom: 10 }}>
      <Pressable onPress={onPress}>
        <View style={{ height: item.imgH, borderRadius: 10, overflow: 'hidden', backgroundColor: '#ECECEC' }}>
          <Image source={{ uri: item.photo }}
            style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <XBtn onPress={onRemove} removing={removing} size={24} />
          {disc > 0 && (
            <View style={st.discBadge}>
              <Text style={st.discBadgeTxt}>{disc}%</Text>
            </View>
          )}
        </View>
      </Pressable>
      <View style={{ padding: 5, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: F.sans600, color: DARK }}>{item.name}</Text>
        <Text style={{ fontSize: 11, fontFamily: F.sans800, color: DARK }}>
          ₹{item.price.toLocaleString()}
        </Text>
        {disc > 0 && <Text style={{ fontSize: 9, color: RED, fontFamily: F.sans700 }}>{disc}% off</Text>}
      </View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function WishlistScreen() {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = React.useState(false);

  const [allItems,    setAllItems]    = React.useState<WishItem[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [listError,   setListError]   = React.useState(false);
  const [removing,    setRemoving]    = React.useState<Set<number>>(new Set());

  // Decoupled search state — same pattern as ExploreScreen
  const [inputText,   setInputText]   = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const isSearchMode = searchQuery.length > 0;

  const inputRef    = React.useRef<TextInput>(null);
  const debounceRef = React.useRef<any>(null);
  const latestText  = React.useRef('');

  // Fetch
  const fetchWishlist = React.useCallback(async () => {
    try {
      setLoadingList(true); setListError(false);
      const res = await authenticatedClient.get('api/shop/favourite_products/');
      const data: FavProduct[] = res.data?.data || [];
      setAllItems(data.map((f, i) => favToItem(f, i)));
    } catch { setListError(true); }
    finally { setLoadingList(false); }
  }, []);

  React.useEffect(() => { fetchWishlist(); }, []);
  useFocusEffect(React.useCallback(() => { fetchWishlist(); return () => {}; }, []));

  // Remove
  const handleRemove = React.useCallback(async (favId: number, productId: number) => {
    setRemoving(p => new Set(p).add(favId));
    try {
      await authenticatedClient.delete('api/shop/favourite_products/', {
        data: { product_id: productId },
      });
      setAllItems(p => p.filter(i => i.favId !== favId));
    } catch {
      Alert.alert('Error', 'Could not remove item. Please try again.');
    } finally {
      setRemoving(p => { const s = new Set(p); s.delete(favId); return s; });
    }
  }, []);

  // Text change — only updates inputText synchronously
  const handleTextChange = React.useCallback((text: string) => {
    latestText.current = text;
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setSearchQuery(''); return; }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(latestText.current.trim());
    }, 400);
  }, []);

  const handleClear = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestText.current = '';
    setInputText(''); setSearchQuery('');
  }, []);

  const handleCancel = React.useCallback(() => {
    handleClear(); Keyboard.dismiss();
  }, [handleClear]);

  // Client-side search filter
  const searchResults = React.useMemo((): WishItem[] => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return allItems
      .filter(i => i.name.toLowerCase().includes(q))
      .map((item, idx) => ({ ...item, imgH: H3[idx % H3.length] }));
  }, [allItems, searchQuery]);

  // FlatList data
  const listData: Sec[] = React.useMemo(() => {
    if (loadingList) return [{ type: 'loading' }];
    if (listError)   return [{ type: 'error' }];
    if (isSearchMode) return buildSearch(searchResults, searchQuery);
    return buildDefault(allItems);
  }, [loadingList, listError, isSearchMode, searchResults, searchQuery, allItems]);

  // Row renderer
  const renderItem = React.useCallback(({ item: sec }: { item: Sec }) => {
    switch (sec.type) {

      case 'title':
        return (
          <View style={st.sectionHdr}>
            <Text style={st.sectionTitle}>My Favourites</Text>
            <Text style={st.sectionCount}>{sec.count} items</Text>
          </View>
        );

      case 'row2':
        return (
          <View style={st.row2}>
            <Card2
              item={sec.left}
              onPress={() => router.push(`/storefront/${sec.left.productId}` as never)}
              onRemove={() => handleRemove(sec.left.favId, sec.left.productId)}
              onMoveToCart={() => router.push(`/storefront/${sec.left.productId}` as never)}
              removing={removing.has(sec.left.favId)}
            />
            {sec.right ? (
              <Card2
                item={sec.right}
                onPress={() => router.push(`/storefront/${sec.right!.productId}` as never)}
                onRemove={() => handleRemove(sec.right!.favId, sec.right!.productId)}
                onMoveToCart={() => router.push(`/storefront/${sec.right!.productId}` as never)}
                removing={removing.has(sec.right.favId)}
              />
            ) : (
              <View style={{ width: COL2_W }} />
            )}
          </View>
        );

      case 'srchHdr':
        return (
          <View style={st.sectionHdr}>
            <Text style={st.sectionTitle}>{sec.count} result{sec.count !== 1 ? 's' : ''}</Text>
            <Text style={st.sectionCount}>for "{sec.query}"</Text>
          </View>
        );

      case 'row3':
        return (
          <View style={st.row3}>
            {sec.items.map(item => (
              <Card3
                key={item.favId} item={item}
                onPress={() => router.push(`/storefront/${item.productId}` as never)}
                onRemove={() => handleRemove(item.favId, item.productId)}
                removing={removing.has(item.favId)}
              />
            ))}
            {sec.items.length < 3 && Array.from({ length: 3 - sec.items.length }).map((_, i) => (
              <View key={i} style={{ width: COL3_W }} />
            ))}
          </View>
        );

      case 'loading':
        return (
          <View style={st.stateBox}>
            <ActivityIndicator color={RED} size="large" />
            <Text style={st.stateTxt}>Loading your favourites…</Text>
          </View>
        );

      case 'empty':
        return (
          <View style={st.stateBox}>
            <Text style={{ fontSize: 44 }}>{sec.isSearch ? '🔍' : '🧡'}</Text>
            <Text style={st.emptyTitle}>
              {sec.isSearch ? 'No matches found' : 'Your favourites is empty'}
            </Text>
            <Text style={st.emptySub}>
              {sec.isSearch
                ? 'Try a different search term'
                : 'Tap ♥ on any dish to save it here'}
            </Text>
          </View>
        );

      case 'error':
        return (
          <View style={st.stateBox}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={st.stateTxt}>Couldn't load wishlist</Text>
            <TouchableOpacity onPress={fetchWishlist} style={st.retryBtn}>
              <Text style={st.retryTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        );

      default: return null;
    }
  }, [allItems, removing, router, handleRemove, fetchWishlist]);

  const keyExtractor = React.useCallback(
    (_: Sec, i: number) => `sec-${i}`, []
  );

  return (
    <StorefrontHeaderWrapper screenName="wishlist" onMenuPress={() => setDrawerVisible(true)}>
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={st.screen}>

          {/* ══ STATIC HEADER — TextInput never re-renders from list/search state ══ */}
        <View style={st.header}>
          <View style={st.titleRow}>
            <Text style={st.title}>Favourites</Text>
            <Text style={st.subtitle}>
              {loadingList ? 'Loading…' : `${allItems.length} saved items`}
            </Text>
          </View>

          <View style={st.searchRow}>
            {/* searchBox style: NEVER conditional — prevents Android blur */}
            <View style={st.searchBox}>
              <Text style={st.searchIcon}>⌕</Text>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={handleTextChange}
                placeholder="Search your favourites…"
                placeholderTextColor="#BBBBBB"
                style={st.searchInput}
                returnKeyType="search"
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
              {inputText.length > 0 && (
                <TouchableOpacity onPress={handleClear}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <View style={st.clearBtn}>
                    <Text style={{ fontSize: 10, fontFamily: F.sans900, color: DARK }}>✕</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel — always in layout, opacity only */}
            <TouchableOpacity onPress={handleCancel} style={st.cancelBtn}
              pointerEvents={isSearchMode ? 'auto' : 'none'}>
              <Text style={[st.cancelTxt, { opacity: isSearchMode ? 1 : 0 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ FLATLIST — content swaps, header is untouched ══ */}
        <FlatList
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          contentContainerStyle={st.listContent}
          removeClippedSubviews={false}
        />

        </View>
      </KeyboardAvoidingView>
    </StorefrontHeaderWrapper>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: 16,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    backgroundColor: BLACK,
    borderBottomWidth: 2,
    borderColor: RED,
    zIndex: 10, elevation: 4,
    shadowColor: RED, shadowOpacity: 0.25,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  titleRow:  { marginBottom: 12 },
  title:     { fontSize: 26, fontFamily: F.sans900, color: '#FFFFFF', letterSpacing: -0.8 },
  subtitle:  { fontSize: 12, fontFamily: F.sans400, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    height: 44, backgroundColor: SURFACE, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#FFD5D8',
    paddingHorizontal: 12, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  searchIcon:  { fontSize: 16, color: MUTED, lineHeight: 20 },
  searchInput: { flex: 1, fontSize: 15, color: DARK, paddingVertical: 0 },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#E2E2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn:  { width: 56, alignItems: 'flex-end', paddingVertical: 4 },
  cancelTxt:  { fontSize: 14, fontFamily: F.sans600, color: RED },

  listContent: { paddingBottom: 60 },

  sectionHdr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingVertical: 12,
  },
  sectionTitle: { fontSize: 15, fontFamily: F.sans800, color: DARK },
  sectionCount: { fontSize: 12, color: MUTED, fontFamily: F.sans600 },

  // 2-col layout — no padding, cards touch edges like reference
  row2: { flexDirection: 'row', gap: GAP2, marginBottom: GAP2, alignItems: 'stretch' },

  card2: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  card2Body: {
    paddingHorizontal: 10, paddingTop: 8, paddingBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
  },
  card2Name: { fontSize: 12, fontFamily: F.sans700, color: DARK, marginBottom: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  price:    { fontSize: 14, fontFamily: F.sans800, color: DARK },
  mrp:      { fontSize: 12, color: '#BBBBBB', textDecorationLine: 'line-through' },
  discTxt:  { fontSize: 11, color: RED, fontFamily: F.sans700 },

  // "MOVE TO BAG" exactly as reference
  moveBagRow: {
    marginTop: 10, paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: BORDER,
  },
  moveBagTxt: {
    fontSize: 12, fontFamily: F.sans800, color: RED, letterSpacing: 0.8,
  },

  // X button (top-right on image)
  xBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.90)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  },

  // Rating pill (bottom-left on image)
  ratingPill: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  ratingNum:     { fontSize: 11, fontFamily: F.sans800, color: DARK },
  ratingReviews: { fontSize: 10, color: MUTED, fontFamily: F.sans600 },

  // 3-col search
  row3: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, gap: GAP3, marginBottom: 4,
  },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#FFF3CD', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  discBadgeTxt: { fontSize: 9, fontFamily: F.sans900, color: '#B45309' },

  // States
  stateBox:   { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  stateTxt:   { fontSize: 14, color: MUTED, fontFamily: F.sans500 },
  emptyTitle: { fontSize: 17, fontFamily: F.sans800, color: DARK, letterSpacing: -0.3, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19 },
  retryBtn:   { marginTop: 4, paddingHorizontal: 28, paddingVertical: 11, backgroundColor: RED, borderRadius: 50 },
  retryTxt:   { color: '#fff', fontFamily: F.sans700, fontSize: 13 },
});