import * as React from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNewItems } from '@/api/home/use-home';
import { DrawerMenu } from '@/components/drawer-menu';
import { StorefrontHeaderWrapper } from '@/components/storefront/StorefrontHeaderWrapper';
import { authenticatedClient } from '@/api/common/client';

// ─── constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const H_PAD = 14;
const COL_GAP = 6;
const ROW_GAP = 8;

const C = {
  bg:      '#F7F7F5',
  surface: '#FFFFFF',
  dark:    '#0E0E0E',
  muted:   '#9A9A9A',
  border:  '#E8E8E8',
  lime:    '#C8FF00',
};

// ─── types ────────────────────────────────────────────────────────────────────
type Product = {
  id:    number;
  slug:  string;
  name:  string;
  photo: string;
  price: number;
  mrp:   number;
  disc:  number; // integer percent, 0 if none
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Fallback: turn a name into a URL slug */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function bestSlug(p: Product): string {
  return p.slug || slugify(p.name) || String(p.id);
}

/**
 * Flatten featured_categories API response.
 * Shape: { id, name, slug, products: [{ id, name, slug, price, mrp, discount_percent, image_url }] }[]
 */
function flattenCategories(cats: any[]): Product[] {
  const seen = new Set<number>();
  const out: Product[] = [];
  for (const cat of cats) {
    for (const p of (cat.products ?? [])) {
      if (!p?.id || seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({
        id:    p.id,
        slug:  p.slug ?? '',
        name:  p.name ?? p.product_name ?? '',
        photo: p.image_url ?? (Array.isArray(p.images) ? p.images[0] : '') ?? '',
        price: Number(p.price) || 0,
        mrp:   Number(p.mrp ?? p.market_price) || 0,
        disc:  p.discount_percent ? Math.round(Number(p.discount_percent)) : 0,
      });
    }
  }
  return out;
}

/** Map search-API result shape to Product */
function fromSearch(r: any): Product {
  const price = Number(r.price) || 0;
  const mrp   = Number(r.market_price ?? r.mrp) || 0;
  return {
    id:    r.id,
    slug:  r.slug ?? '',
    name:  r.product_name ?? r.name ?? '',
    photo: r.photo ?? r.image_url ?? '',
    price,
    mrp,
    disc:  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
  };
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
// Pressable only — no overlays, no nested touchables, no pointerEvents magic.
function ProductCard({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
    >
      {/* image */}
      <View style={styles.imgWrap}>
        {!!item.photo && (
          <Image
            source={{ uri: item.photo }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}
        {item.disc > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{item.disc}%{'\n'}off</Text>
          </View>
        )}
      </View>

      {/* info */}
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardPrice}>
          {item.price > 0 ? `₹${item.price.toLocaleString()}` : '—'}
        </Text>
        {item.mrp > item.price && (
          <Text style={styles.cardMrp}>₹{item.mrp.toLocaleString()}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── MasonryGrid ─────────────────────────────────────────────────────────────
// Distributes products round-robin across 3 flex columns.
// No FlatList, no nested ScrollViews — plain Views inside the parent ScrollView.
function MasonryGrid({
  items,
  onPress,
}: {
  items: Product[];
  onPress: (slug: string) => void;
}) {
  if (!items.length) return null;

  const col0: Product[] = [];
  const col1: Product[] = [];
  const col2: Product[] = [];

  items.forEach((item, i) => {
    if (i % 3 === 0) col0.push(item);
    else if (i % 3 === 1) col1.push(item);
    else col2.push(item);
  });

  const renderCol = (col: Product[]) => (
    <View style={styles.col}>
      {col.map(item => (
        <ProductCard
          key={item.id}
          item={item}
          onPress={() => onPress(bestSlug(item))}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.masonry}>
      {renderCol(col0)}
      {renderCol(col1)}
      {renderCol(col2)}
    </View>
  );
}

// ─── ExploreScreen ────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();

  const navigate = React.useCallback(
    (slug: string) => { router.push(`/storefront/${slug}` as never); },
    [router],
  );

  // drawer
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // search state
  const [inputText,     setInputText]     = React.useState('');
  const [searchQuery,   setSearchQuery]   = React.useState('');
  const [searching,     setSearching]     = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [searchError,   setSearchError]   = React.useState(false);

  const debounceRef   = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef     = React.useRef('');

  // featured products
  const { data: rawCats = [], isLoading } = useNewItems();

  const allProducts = React.useMemo(
    () => flattenCategories(Array.isArray(rawCats) ? rawCats : []),
    [rawCats],
  );

  const isSearchMode = searchQuery.length >= 2;

  // ── search ────────────────────────────────────────────────────────────────
  const runSearch = React.useCallback(async (q: string) => {
    setSearching(true);
    setSearchError(false);
    try {
      const res = await authenticatedClient.get(
        `api/shop/sellableproductsearch/${encodeURIComponent(q)}/`,
      );
      setSearchResults((res.data?.results ?? []).map(fromSearch));
    } catch {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const onChangeText = React.useCallback((text: string) => {
    latestRef.current = text;
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q = latestRef.current.trim();
      if (q.length >= 2) { setSearchQuery(q); void runSearch(q); }
    }, 450);
  }, [runSearch]);

  const clearSearch = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestRef.current = '';
    setInputText('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(false);
  }, []);

  // ── what to display ───────────────────────────────────────────────────────
  const displayItems   = isSearchMode ? searchResults : allProducts;
  const displayLoading = isSearchMode ? searching     : isLoading;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <StorefrontHeaderWrapper screenName="explore" onMenuPress={() => setDrawerOpen(true)}>
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <View style={styles.root}>

        {/* ── header + search bar ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover what's trending</Text>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={inputText}
                onChangeText={onChangeText}
                placeholder="Search products…"
                placeholderTextColor="#BBBBBB"
                style={styles.searchInput}
                returnKeyType="search"
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <View style={styles.clearBtn}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: C.dark }}>✕</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {isSearchMode && (
              <TouchableOpacity
                onPress={() => { clearSearch(); Keyboard.dismiss(); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── scrollable content ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
        >

          {/* section label */}
          {!displayLoading && displayItems.length > 0 && (
            <View style={styles.sectionHdr}>
              <Text style={styles.sectionTitle}>
                {isSearchMode
                  ? `${displayItems.length} results`
                  : 'All Products'}
              </Text>
              {isSearchMode ? (
                <View style={styles.limePill}>
                  <Text style={styles.limePillTxt}>"{searchQuery}"</Text>
                </View>
              ) : (
                <Text style={styles.sectionCount}>{displayItems.length} items</Text>
              )}
            </View>
          )}

          {/* loading */}
          {displayLoading && (
            <View style={styles.stateBox}>
              <ActivityIndicator color={C.dark} size="large" />
              <Text style={styles.stateTxt}>
                {isSearchMode ? 'Searching…' : 'Loading products…'}
              </Text>
            </View>
          )}

          {/* search error */}
          {isSearchMode && !searching && searchError && (
            <View style={styles.stateBox}>
              <Text style={{ fontSize: 36 }}>😕</Text>
              <Text style={styles.stateTxt}>Something went wrong</Text>
              <TouchableOpacity
                onPress={() => void runSearch(searchQuery)}
                style={styles.retryBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.retryTxt}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* no search results */}
          {isSearchMode && !searching && !searchError && searchResults.length === 0 && (
            <View style={styles.stateBox}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={styles.stateTxt}>No results for "{searchQuery}"</Text>
            </View>
          )}

          {/* the grid */}
          {!displayLoading && displayItems.length > 0 && (
            <MasonryGrid items={displayItems} onPress={navigate} />
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </StorefrontHeaderWrapper>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingTop: 12,
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {},
    }),
  },
  title:    { fontSize: 26, fontWeight: '900', color: C.dark, letterSpacing: -0.8 },
  subtitle: { fontSize: 12, color: C.muted, marginTop: 2, marginBottom: 12 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    paddingHorizontal: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {},
    }),
  },
  searchIcon:  { fontSize: 16, color: C.muted, lineHeight: 20 },
  searchInput: { flex: 1, fontSize: 15, color: C.dark, paddingVertical: 0 },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { paddingVertical: 6 },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: C.dark },

  content: { paddingTop: 16, paddingHorizontal: H_PAD },

  sectionHdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.dark, letterSpacing: -0.3 },
  sectionCount: { fontSize: 12, color: C.muted, fontWeight: '600' },
  limePill:     { backgroundColor: C.lime, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  limePillTxt:  { fontSize: 11, fontWeight: '800', color: C.dark },

  // Masonry
  masonry: { flexDirection: 'row', gap: COL_GAP },
  col:     { flex: 1, gap: ROW_GAP },

  // Card — overflow hidden so badge doesn't escape rounded corner
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: 0.85,   // slightly portrait
    backgroundColor: '#F0EDE8',
  },
  cardBody:  { padding: 7, gap: 2 },
  cardName:  { fontSize: 11, fontWeight: '600', color: C.dark, lineHeight: 15 },
  cardPrice: { fontSize: 12, fontWeight: '800', color: C.dark, marginTop: 2 },
  cardMrp:   { fontSize: 10, color: '#CACACA', textDecorationLine: 'line-through' },

  badge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: C.lime,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  badgeTxt: { fontSize: 8, fontWeight: '900', color: C.dark, textAlign: 'center' },

  stateBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  stateTxt:  { fontSize: 14, color: C.muted, fontWeight: '500' },
  retryBtn:  {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.dark,
    marginTop: 4,
  },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
