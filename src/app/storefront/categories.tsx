import * as React from 'react';
import {
  View, FlatList, Pressable, Image,
  Dimensions, ScrollView, Modal, TouchableOpacity, Text,
  TouchableWithoutFeedback, StyleSheet, Animated, Platform, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/api/home/use-home';
import { authenticatedClient } from '@/api/common/client';
import { F } from '@/lib/fonts';

const { width, height } = Dimensions.get('window');

// ── Layout ─────────────────────────────────────────────────────────────────────
const SIDEBAR_W = 86;
const GRID_W    = width - SIDEBAR_W;
const CARD_GAP  = 8;
const CARD_W    = (GRID_W - CARD_GAP * 3) / 2;   // 8px left + 8px gap + 8px right
const IMG_H     = 92;                             // compact — 8 products on screen

// ── Tokens — RED & WHITE ────────────────────────────────────────────────────
const BLACK   = '#0C0C0C';
const DARK    = '#F5F5F5';       // grid area bg — light grey
const CARD_BG = '#FFFFFF';       // cards — white
const RED     = '#C41230';
const DIM_RED = 'rgba(196,18,48,0.10)';
const WHITE   = '#FFFFFF';
const DIM     = '#888888';       // muted text
const BORDER  = '#EBEBEB';       // light border
const MUTED   = '#AAAAAA';

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = { id: number; name: string; image?: string; icon?: string; emoji?: string; description?: string };
type Product  = {
  id: number; slug?: string; product_name: string; photo: string; photos?: string[];
  price: number; mrp: number; market_price?: number;
  rating: number; review_count: number; brand?: string; description?: string;
  attributes?: { meta?: { food_type?: string }; [key: string]: any };
};
type FilterState = {
  priceRange: [number, number];
  colors: string[]; brands: string[]; sizes: string[];
  ratings: number[]; discount: string[];
};
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'discount';

const DEFAULT_FILTERS: FilterState = {
  priceRange: [0, 99999], colors: [], brands: [], sizes: [], ratings: [], discount: [],
};

const SORT_OPTIONS: { key: SortOption; label: string; sub: string }[] = [
  { key: 'relevance',  label: 'Relevance',         sub: 'Best match first'    },
  { key: 'newest',     label: 'New Arrivals',       sub: 'Latest first'        },
  { key: 'price_asc',  label: 'Price: Low → High',  sub: 'Budget-friendly'     },
  { key: 'price_desc', label: 'Price: High → Low',  sub: 'Premium first'       },
  { key: 'rating',     label: 'Top Rated',          sub: 'Highest rated first' },
  { key: 'discount',   label: 'Best Discount',      sub: 'Biggest deals first' },
];

const DISCOUNT_OPTIONS = ['10% and above','20% and above','30% and above','50% and above','70% and above'];

// ── Client-side sort & filter ──────────────────────────────────────────────────
function sortProducts(list: Product[], sort: SortOption): Product[] {
  const a = [...list];
  if (sort === 'price_asc')  return a.sort((x, y) => Number(x.price) - Number(y.price));
  if (sort === 'price_desc') return a.sort((x, y) => Number(y.price) - Number(x.price));
  if (sort === 'rating')     return a.sort((x, y) => Number(y.rating) - Number(x.rating));
  if (sort === 'discount')   return a.sort((x, y) => {
    const da = Number(x.mrp || x.market_price || x.price) - Number(x.price);
    const db = Number(y.mrp || y.market_price || y.price) - Number(y.price);
    return db - da;
  });
  return a;
}

function filterProducts(list: Product[], f: FilterState): Product[] {
  return list.filter(p => {
    const price = Number(p.price);
    const mrp   = Number(p.mrp || p.market_price || p.price);
    if (price < f.priceRange[0] || price > f.priceRange[1]) return false;
    if (f.ratings.length) {
      if (Number(p.rating) < Math.min(...f.ratings)) return false;
    }
    if (f.discount.length) {
      const pct = mrp > price ? ((mrp - price) / mrp) * 100 : 0;
      if (pct < Math.min(...f.discount.map(d => parseInt(d)))) return false;
    }
    return true;
  });
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = React.useRef(new Animated.Value(0.45)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, []);
  return (
    <Animated.View style={{ width: CARD_W, borderRadius: 12, overflow: 'hidden',
      backgroundColor: '#EDEDED', opacity: anim }}>
      <View style={{ width: '100%', height: IMG_H, backgroundColor: '#D8D8D8' }} />
      <View style={{ padding: 7, gap: 6 }}>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: '#D8D8D8', width: '82%' }} />
        <View style={{ height: 8,  borderRadius: 4, backgroundColor: '#E0E0E0', width: '52%' }} />
        <View style={{ height: 8,  borderRadius: 4, backgroundColor: '#E0E0E0', width: '38%' }} />
        <View style={{ height: 13, borderRadius: 5, backgroundColor: '#D4D4D4', width: '40%', marginTop: 3 }} />
      </View>
    </Animated.View>
  );
}

function SkeletonGrid() {
  return (
    <View style={{ padding: CARD_GAP, gap: CARD_GAP }}>
      {[0, 1, 2, 3].map(row => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

function SkeletonFooter() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: CARD_GAP, paddingBottom: CARD_GAP }}>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

// ── Stars ──────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <TextInput
          key={s}
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value="★"
          style={{ fontSize: 9, color: s <= Math.round(Number(rating)) ? RED : 'rgba(255,255,255,0.15)',
            padding: 0, margin: 0, backgroundColor: 'transparent', width: 10, height: 12 }}
        />
      ))}
    </View>
  );
}

// ── Veg / Non-veg indicator ────────────────────────────────────────────────────
function FoodTypeTag({ foodType }: { foodType?: string }) {
  if (!foodType) return null;
  const isVeg = foodType.toLowerCase() === 'veg';
  const color = isVeg ? '#1E8B00' : '#9B1C1C';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}>
      <View style={{ width: 13, height: 13, borderRadius: 2, borderWidth: 1.5, borderColor: color,
        alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
      </View>
      <Text style={{ fontSize: 9, color, fontFamily: F.sans700 }}>{isVeg ? 'Veg' : 'Non-Veg'}</Text>
    </View>
  );
}

// ── Product card ───────────────────────────────────────────────────────────────
function PCard({ item, onPress }: { item: Product; onPress: () => void }) {
  const price = Number(item.price) || 0;
  const mrp   = Number(item.mrp || item.market_price) || price;
  const disc  = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const [descExpanded, setDescExpanded] = React.useState(false);
  const imgUri = React.useMemo(() => {
    const arr = Array.isArray(item.photos) ? item.photos.filter(p => typeof p === 'string') : [];
    return arr.length ? arr[0] : (item.photo ?? null);
  }, [item.photos, item.photo]);

  return (
    <Pressable onPress={onPress} style={[st.card, { width: CARD_W }]}>
      {/* Image */}
      <View style={{ width: CARD_W, height: IMG_H, overflow: 'hidden',
        borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#222' }}>
        {imgUri
          ? <Image source={{ uri: imgUri }} style={{ width: CARD_W, height: IMG_H }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TextInput editable={false} caretHidden value="🍜"
                style={{ fontSize: 26, padding: 0, margin: 0, backgroundColor: 'transparent', height: 32 }} />
            </View>
        }
        {disc > 0 && (
          <View style={st.discBadge}>
            <TextInput editable={false} caretHidden value={`${disc}% OFF`}
              style={st.discTxt} />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={st.cardBody}>
        <TextInput
          editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
          value={item.product_name}
          numberOfLines={1}
          style={st.pname}
        />
        <FoodTypeTag foodType={item.attributes?.meta?.food_type} />
        {!!item.description && (
          <Pressable onPress={() => setDescExpanded(v => !v)} style={{ marginTop: 3 }}>
            <Text numberOfLines={descExpanded ? undefined : 2} style={st.pdesc}>
              {item.description}
            </Text>
            {!descExpanded && (
              <Text style={st.readMore}>...read more</Text>
            )}
          </Pressable>
        )}
        {Number(item.rating) > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Stars rating={item.rating} />
          </View>
        )}
        <View style={st.priceRow}>
          <TextInput editable={false} caretHidden value={`₹${price.toLocaleString()}`}
            style={st.price} />
          {mrp > price && (
            <TextInput editable={false} caretHidden value={`₹${mrp.toLocaleString()}`}
              style={st.mrp} />
          )}
          {disc > 0 && (
            <TextInput editable={false} caretHidden value={`${disc}% off`}
              style={st.saving} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ── Sort bottom sheet ──────────────────────────────────────────────────────────
function SortSheet({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: SortOption;
  onSelect:(s:SortOption)=>void; onClose:()=>void;
}) {
  const anim = React.useRef(new Animated.Value(400)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 0 : 400, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={st.scrim} />
      </TouchableWithoutFeedback>
      <Animated.View style={[st.sheet, { transform: [{ translateY: anim }] }]}>
        <View style={st.handle} />
        <TextInput editable={false} caretHidden value="Sort By" style={st.sheetTitle} />

        {/* Orange top border */}
        <View style={st.sheetAccent} />

        {SORT_OPTIONS.map(opt => {
          const on = selected === opt.key;
          return (
            <TouchableOpacity key={opt.key} onPress={() => { onSelect(opt.key); onClose(); }}
              style={[st.sortRow, on && st.sortRowOn]} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <TextInput editable={false} caretHidden value={opt.label}
                  style={[st.sortLabel, on && { color: RED, fontFamily: F.sans800 }]} />
                <TextInput editable={false} caretHidden value={opt.sub}
                  style={st.sortSub} />
              </View>
              <View style={[st.radio, on && st.radioOn]}>
                {on && <View style={st.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: Platform.OS === 'ios' ? 32 : 12 }} />
      </Animated.View>
    </Modal>
  );
}

// ── Filter bottom sheet ────────────────────────────────────────────────────────
function FilterSheet({ visible, filters, onChange, onApply, onClose, onReset }: {
  visible: boolean; filters: FilterState;
  onChange:(f:FilterState)=>void; onApply:()=>void;
  onClose:()=>void; onReset:()=>void;
}) {
  const anim = React.useRef(new Animated.Value(height)).current;
  const [sec, setSec] = React.useState('price');
  React.useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 0 : height, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }, [visible]);

  const toggleArr = (key: 'colors'|'brands'|'sizes'|'discount', val: string) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter(v=>v!==val) : [...arr, val] });
  };

  const SECTIONS = [
    { key:'price',    label:'Price',   icon:'₹'  },
    { key:'rating',   label:'Rating',  icon:'⭐' },
    { key:'discount', label:'Deal',    icon:'%'  },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={st.scrim} />
      </TouchableWithoutFeedback>
      <Animated.View style={[st.fSheet, { transform: [{ translateY: anim }] }]}>
        <View style={st.handle} />
        <View style={st.sheetAccent} />

        {/* Header */}
        <View style={st.fHeader}>
          <TextInput editable={false} caretHidden value="Filters" style={st.sheetTitle} />
          <TouchableOpacity onPress={onReset} style={st.resetBtn} activeOpacity={0.7}>
            <TextInput editable={false} caretHidden value="Reset All" style={st.resetTxt} />
          </TouchableOpacity>
        </View>

        {/* Two-column body */}
        <View style={{ flex: 1, flexDirection: 'row' }}>

          {/* LEFT TABS */}
          <View style={st.fSidebar}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SECTIONS.map((s, idx) => {
                const on = sec === s.key;
                return (
                  <TouchableOpacity key={s.key} onPress={() => setSec(s.key)}
                    style={[st.fTab, on && st.fTabOn, idx === 0 && { paddingTop: 14 }]}
                    activeOpacity={0.7}>
                    {on && <View style={st.fTabBar} />}
                    <TextInput editable={false} caretHidden value={s.icon}
                      style={{ fontSize: 15, padding: 0, margin: 0, backgroundColor: 'transparent', height: 20 }} />
                    <TextInput editable={false} caretHidden value={s.label}
                      style={[st.fTabTxt, on && st.fTabTxtOn]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* RIGHT CONTENT */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 14, paddingTop: 14 }} showsVerticalScrollIndicator={false}>

            {sec === 'price' && (
              <>
                <TextInput editable={false} caretHidden value="Price Range" style={st.fSecTitle} />
                {([
                  ['Under ₹200',      0,   200  ],
                  ['₹200 – ₹500',     200, 500  ],
                  ['₹500 – ₹1,000',   500, 1000 ],
                  ['₹1,000 – ₹2,000', 1000,2000 ],
                  ['Above ₹2,000',    2000,99999 ],
                ] as [string,number,number][]).map(([lbl,mn,mx]) => {
                  const on = filters.priceRange[0]===mn && filters.priceRange[1]===mx;
                  return (
                    <TouchableOpacity key={lbl} onPress={() => onChange({...filters, priceRange:[mn,mx]})}
                      style={[st.chip, on && st.chipOn]} activeOpacity={0.7}>
                      <TextInput editable={false} caretHidden value={lbl}
                        style={[st.chipTxt, on && st.chipTxtOn]} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {sec === 'rating' && (
              <>
                <TextInput editable={false} caretHidden value="Minimum Rating" style={st.fSecTitle} />
                {[4,3,2].map(r => {
                  const on = filters.ratings.includes(r);
                  return (
                    <TouchableOpacity key={r}
                      onPress={() => onChange({...filters, ratings: on ? filters.ratings.filter(v=>v!==r) : [...filters.ratings,r]})}
                      style={st.checkRow} activeOpacity={0.7}>
                      <View style={[st.box, on && st.boxOn]}>
                        {on && <TextInput editable={false} caretHidden value="✓"
                          style={{ color: WHITE, fontSize: 10, padding: 0, margin: 0, backgroundColor: 'transparent', height: 14 }} />}
                      </View>
                      <TextInput editable={false} caretHidden value={'★'.repeat(r)}
                        style={{ color: RED, fontSize: 13, padding: 0, margin: 0, backgroundColor: 'transparent', height: 18 }} />
                      <TextInput editable={false} caretHidden value={'★'.repeat(5-r)}
                        style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13, padding: 0, margin: 0, backgroundColor: 'transparent', height: 18 }} />
                      <TextInput editable={false} caretHidden value=" & above"
                        style={st.checkTxt} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {sec === 'discount' && (
              <>
                <TextInput editable={false} caretHidden value="Discount" style={st.fSecTitle} />
                {DISCOUNT_OPTIONS.map(d => {
                  const on = filters.discount.includes(d);
                  return (
                    <TouchableOpacity key={d} onPress={() => toggleArr('discount', d)}
                      style={st.checkRow} activeOpacity={0.7}>
                      <View style={[st.box, on && st.boxOn]}>
                        {on && <TextInput editable={false} caretHidden value="✓"
                          style={{ color: WHITE, fontSize: 10, padding: 0, margin: 0, backgroundColor: 'transparent', height: 14 }} />}
                      </View>
                      <TextInput editable={false} caretHidden value={d} style={st.checkTxt} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={st.fFooter}>
          <TouchableOpacity style={st.applyBtn} onPress={() => { onApply(); onClose(); }} activeOpacity={0.85}>
            <TextInput editable={false} caretHidden value="Apply Filters" style={st.applyTxt} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId?: string;
    categoryName?: string;
  }>();

  const { data: categories = [], isLoading: catsLoading } = useCategories();

  const [selectedCat,    setSelectedCat]    = React.useState<Category|null>(() => {
    if (categoryId && categoryName) return { id: Number(categoryId), name: categoryName };
    return null;
  });
  const [rawProducts,    setRawProducts]    = React.useState<Product[]>([]);
  const [page,           setPage]           = React.useState(1);
  const [loading,        setLoading]        = React.useState(false);
  const [hasMore,        setHasMore]        = React.useState(true);
  const [sortVisible,    setSortVisible]    = React.useState(false);
  const [filterVisible,  setFilterVisible]  = React.useState(false);
  const [sortBy,         setSortBy]         = React.useState<SortOption>('relevance');
  const [pendingFilters, setPending]        = React.useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setApplied]        = React.useState<FilterState>(DEFAULT_FILTERS);

  const displayProducts = React.useMemo(() => {
    const filtered = filterProducts(rawProducts, appliedFilters);
    return sortProducts(filtered, sortBy);
  }, [rawProducts, appliedFilters, sortBy]);

  const filterCount = React.useMemo(() => [
    appliedFilters.colors.length, appliedFilters.brands.length,
    appliedFilters.sizes.length,  appliedFilters.ratings.length,
    appliedFilters.discount.length,
    (appliedFilters.priceRange[0] > 0 || appliedFilters.priceRange[1] < 99999) ? 1 : 0,
  ].reduce((a,b)=>a+b,0), [appliedFilters]);

  React.useEffect(() => {
    if (!categories.length) return;
    if (categoryId) {
      const match = categories.find(c => String(c.id) === String(categoryId));
      if (match) { setSelectedCat(match); return; }
    }
    if (!selectedCat) setSelectedCat(categories[0]);
  }, [categories]);

  React.useEffect(() => {
    if (!selectedCat) return;
    setRawProducts([]); setPage(1); setHasMore(true);
    fetchPage(1, true);
  }, [selectedCat]);

  const fetchPage = async (pg: number, reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    try {
      setLoading(true);
      const res = await authenticatedClient.post('api/shop/products/Pagination/', {
        page: pg,
        subCategoryId: selectedCat?.id,
        subCategoryName: selectedCat?.name,
      });
      const data: Product[] = res.data?.data || [];
      if (!data.length) { setHasMore(false); }
      else { setRawProducts(prev => reset ? data : [...prev, ...data]); setPage(pg); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <View style={st.screen}>
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* ── Sidebar ── */}
        <View style={st.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 + Math.max(insets.bottom, 12) }}>
            {catsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <View key={i} style={{ height: 66, backgroundColor: CARD_BG, margin: 6, borderRadius: 10 }} />
                ))
              : categories.map((cat, idx) => {
                  const on = selectedCat?.id === cat.id;
                  return (
                    <TouchableOpacity key={cat.id} onPress={() => setSelectedCat(cat)}
                      style={[st.sbItem, on && st.sbItemOn, idx === 0 && { paddingTop: 10 }]}
                      activeOpacity={0.7}>
                      {on && <View style={st.sbBar} />}
                      {(cat.image || cat.icon)
                        ? <View style={[st.thumb, on && st.thumbOn]}>
                            <Image source={{ uri: (cat.image || cat.icon) as string }}
                              style={st.thumbImg} resizeMode="cover" />
                          </View>
                        : <View style={[st.thumb, on && st.thumbOn,
                            { justifyContent: 'center', alignItems: 'center',
                              backgroundColor: on ? DIM_RED : '#282828' }]}>
                            <TextInput editable={false} caretHidden
                              value={cat.name?.charAt(0)?.toUpperCase()}
                              style={{ fontSize: 14, color: on ? RED : DIM,
                                fontFamily: F.sans800, padding: 0, margin: 0,
                                backgroundColor: 'transparent', height: 18 }} />
                          </View>
                      }
                      <TextInput editable={false} caretHidden numberOfLines={2}
                        value={cat.name}
                        style={[st.sbTxt, on && st.sbTxtOn]} />
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>

        {/* ── Grid area ── */}
        <View style={{ flex: 1, backgroundColor: DARK }}>

          {/* Sub-header */}
          <View style={st.gHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: 6 }}>
              <TextInput editable={false} caretHidden numberOfLines={1}
                value={selectedCat?.name ?? ''}
                style={[st.gTitle, { flex: 1 }]} />
              {displayProducts.length > 0 && (
                <View style={st.dishPill}>
                  <TextInput editable={false} caretHidden
                    value={`${displayProducts.length} dishes`}
                    style={st.dishPillTxt} />
                </View>
              )}
            </View>
            {!!selectedCat?.description && (
              <Text style={[st.gDesc, { marginTop: 5 }]}>{selectedCat.description}</Text>
            )}
          </View>

          {/* Active filter chips */}
          {(sortBy !== 'relevance' || filterCount > 0) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 38, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER }}
              contentContainerStyle={{ paddingHorizontal: 10, gap: 6, alignItems: 'center', paddingVertical: 5 }}>
              {sortBy !== 'relevance' && (
                <View style={st.activeChip}>
                  <TextInput editable={false} caretHidden
                    value={`↕ ${SORT_OPTIONS.find(o=>o.key===sortBy)?.label}`}
                    style={st.activeChipTxt} />
                  <TouchableOpacity onPress={() => setSortBy('relevance')}
                    hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                    <TextInput editable={false} caretHidden value="✕"
                      style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginLeft: 5,
                        padding: 0, margin: 0, backgroundColor: 'transparent', height: 14, marginTop: 1 }} />
                  </TouchableOpacity>
                </View>
              )}
              {filterCount > 0 && (
                <View style={st.activeChip}>
                  <TextInput editable={false} caretHidden
                    value={`⊟ ${filterCount} filter${filterCount>1?'s':''}`}
                    style={st.activeChipTxt} />
                  <TouchableOpacity onPress={() => { setPending(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}
                    hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                    <TextInput editable={false} caretHidden value="✕"
                      style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginLeft: 5,
                        padding: 0, margin: 0, backgroundColor: 'transparent', height: 14, marginTop: 1 }} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          <FlatList
            data={displayProducts}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: CARD_GAP }}
            contentContainerStyle={{ paddingTop: CARD_GAP, paddingBottom: 80 + Math.max(insets.bottom, 12) }}
            ItemSeparatorComponent={() => <View style={{ height: CARD_GAP }} />}
            renderItem={({ item }) => (
              <PCard item={item} onPress={() => router.push(`/storefront/${item.slug ?? item.id}` as never)} />
            )}
            onEndReached={() => { if (!loading && hasMore) fetchPage(page + 1); }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? <SkeletonGrid /> :
              !loading ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <TextInput editable={false} caretHidden value="🍜"
                    style={{ fontSize: 40, padding: 0, margin: 0, backgroundColor: 'transparent', height: 50, textAlign: 'center' }} />
                  <TextInput editable={false} caretHidden
                    value={filterCount > 0 ? 'No dishes match filters' : 'No dishes found'}
                    style={{ color: DIM, marginTop: 10, fontSize: 13, fontFamily: F.sans600,
                      padding: 0, margin: 0, backgroundColor: 'transparent', height: 18 }} />
                  {filterCount > 0 && (
                    <TouchableOpacity onPress={() => { setPending(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}
                      style={{ marginTop: 14, paddingHorizontal: 22, paddingVertical: 11,
                        backgroundColor: RED, borderRadius: 12 }} activeOpacity={0.8}>
                      <TextInput editable={false} caretHidden value="Clear Filters"
                        style={{ color: WHITE, fontFamily: F.sans700, fontSize: 13,
                          padding: 0, margin: 0, backgroundColor: 'transparent', height: 18 }} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            }
            ListFooterComponent={loading && displayProducts.length > 0
              ? <SkeletonFooter />
              : null
            }
          />
        </View>
      </View>

      {/* ── Bottom bar ── */}
      <View style={[st.bar, {
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 20),
        height: 56 + Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 20),
      }]}>
        {/* Sort */}
        <TouchableOpacity style={st.barBtn} onPress={() => setSortVisible(true)} activeOpacity={0.75}>
          <View style={[st.barIconWrap, sortBy !== 'relevance' && st.barIconWrapOn]}>
            <TextInput editable={false} caretHidden value="⇅"
              style={[st.barIconGlyph, sortBy !== 'relevance' && { color: WHITE }]} />
          </View>
          <TextInput editable={false} caretHidden
            value={sortBy !== 'relevance'
              ? (SORT_OPTIONS.find(o => o.key === sortBy)?.label?.split(':')[0] ?? 'Sort')
              : 'Sort'}
            style={[st.barTxt, sortBy !== 'relevance' && { color: RED, fontFamily: F.sans700 }]} />
        </TouchableOpacity>

        <View style={st.barDiv} />

        {/* Filter */}
        <TouchableOpacity style={st.barBtn} onPress={() => setFilterVisible(true)} activeOpacity={0.75}>
          <View style={[st.barIconWrap, filterCount > 0 && st.barIconWrapOn]}>
            <TextInput editable={false} caretHidden value="≡"
              style={[st.barIconGlyph, filterCount > 0 && { color: WHITE }]} />
            {filterCount > 0 && (
              <View style={st.badgeDot}>
                <TextInput editable={false} caretHidden value={String(filterCount)}
                  style={{ color: WHITE, fontSize: 8, fontFamily: F.sans800,
                    padding: 0, margin: 0, backgroundColor: 'transparent', height: 11 }} />
              </View>
            )}
          </View>
          <TextInput editable={false} caretHidden
            value={filterCount > 0 ? `Filter (${filterCount})` : 'Filter'}
            style={[st.barTxt, filterCount > 0 && { color: RED, fontFamily: F.sans700 }]} />
        </TouchableOpacity>
      </View>

      <SortSheet visible={sortVisible} selected={sortBy} onSelect={setSortBy} onClose={() => setSortVisible(false)} />
      <FilterSheet
        visible={filterVisible} filters={pendingFilters} onChange={setPending}
        onApply={() => setApplied({ ...pendingFilters })}
        onClose={() => setFilterVisible(false)}
        onReset={() => { setPending(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS); }}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: WHITE },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#F0F0F0',
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  sbItem: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    alignItems: 'center',
    position: 'relative',
    minHeight: 92,
    justifyContent: 'center',
  },
  sbItemOn: { backgroundColor: WHITE },
  sbBar: {
    position: 'absolute', left: 0, top: 14, bottom: 14,
    width: 3, backgroundColor: RED,
    borderTopRightRadius: 3, borderBottomRightRadius: 3,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 2, height: 0 } } }),
  },
  thumb: {
    width: 80, height: 68, borderRadius: 6, overflow: 'hidden',
    marginBottom: 4, backgroundColor: '#E0E0E0',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbOn: { borderColor: RED },
  thumbImg: { width: '100%', height: '100%', borderRadius: 5 },
  sbTxt: {
    fontSize: 9, color: '#2D2D2D', textAlign: 'center',
    fontFamily: F.sans500, lineHeight: 12,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 24,
  },
  sbTxtOn: { color: RED, fontFamily: F.sans700 },

  // Grid header
  gHeader: {
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1.5, borderColor: BORDER,
  },
  gTitle: {
    fontFamily: F.sans800, fontSize: 16, color: BLACK, letterSpacing: 0.2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 22,
  },
  dishPill: {
    backgroundColor: DIM_RED,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${RED}50`,
    marginTop: 2,
  },
  dishPillTxt: {
    fontFamily: F.sans600, fontSize: 10, color: RED,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
  pdesc: {
    fontFamily: F.sans400, fontSize: 10, color: '#666', lineHeight: 14,
  },
  gDesc: {
    fontFamily: F.sans400, fontSize: 11, color: '#555', lineHeight: 16,
  },
  readMore: {
    fontFamily: F.sans700, fontSize: 11, color: RED, marginTop: 1,
  },

  // Active chips
  activeChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DIM_RED, borderWidth: 1, borderColor: `${RED}60`,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, height: 26,
  },
  activeChipTxt: {
    color: RED, fontFamily: F.sans700, fontSize: 11,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },

  // Card
  card: {
    marginBottom: 0,
    backgroundColor: WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  discBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: RED,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } } }),
  },
  discTxt: {
    color: WHITE, fontFamily: F.sans800, fontSize: 9, letterSpacing: 0.2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 13,
  },
  cardBody: { padding: 7, gap: 2 },
  pname: {
    fontFamily: F.sans600, fontSize: 11, color: BLACK, lineHeight: 15,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 15,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' },
  price: {
    fontFamily: F.sans900, fontSize: 13, color: BLACK,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 17,
  },
  mrp: {
    fontFamily: F.sans400, fontSize: 10, color: MUTED,
    textDecorationLine: 'line-through',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
  saving: {
    fontFamily: F.sans700, fontSize: 9, color: RED,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 13,
  },

  // Bottom bar — black
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C0C0C',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderColor: RED,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } } }),
    elevation: 16,
  },
  barBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  barIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: '#1C1C1C',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  barIconWrapOn: { backgroundColor: RED, borderColor: RED },
  barIconGlyph: {
    fontSize: 16, color: 'rgba(255,255,255,0.5)', fontFamily: F.sans600, lineHeight: 20,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 20,
  },
  badgeDot: {
    position: 'absolute', top: -5, right: -5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0C0C0C',
  },
  barTxt: {
    fontFamily: F.sans600, fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 17,
  },
  barDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },

  // Sort sheet — orange & black
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C0C0C',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 14,
    borderTopWidth: 2.5, borderColor: RED,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } } }),
  },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(196,18,48,0.4)', borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetAccent: { height: 0 },   // not needed — top border does the job
  sheetTitle: {
    fontFamily: F.sans900, fontSize: 18, color: WHITE, letterSpacing: 0.3, marginBottom: 8,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 24,
  },
  sortRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  sortRowOn: {
    backgroundColor: 'rgba(196,18,48,0.12)',
    borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10,
    borderBottomWidth: 0,
  },
  sortLabel: {
    fontFamily: F.sans600, fontSize: 14, color: 'rgba(255,255,255,0.55)',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 18,
  },
  sortSub: {
    fontFamily: F.sans400, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: RED },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },

  // Filter sheet — orange & black
  fSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0C0C0C',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: height * 0.78, paddingTop: 14,
    borderTopWidth: 2.5, borderColor: RED,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } } }),
  },
  fHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  resetBtn: { borderWidth: 1.5, borderColor: RED, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  resetTxt: {
    color: RED, fontFamily: F.sans700, fontSize: 12,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },

  fSidebar: { width: 72, backgroundColor: '#111111', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  fTab: { paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 5, position: 'relative' },
  fTabOn: { backgroundColor: '#1C1C1C' },
  fTabBar: { position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, backgroundColor: RED, borderRadius: 2 },
  fTabTxt: {
    fontFamily: F.sans500, fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'center',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 12,
  },
  fTabTxtOn: { color: RED, fontFamily: F.sans700 },
  fSecTitle: {
    fontFamily: F.sans800, fontSize: 10, color: RED, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 14,
  },

  fFooter: {
    padding: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#0C0C0C',
  },
  applyBtn: {
    backgroundColor: RED, borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } } }),
  },
  applyTxt: {
    color: WHITE, fontFamily: F.sans800, fontSize: 14, letterSpacing: 0.5,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 18,
  },

  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1C1C1C', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  chipOn: { borderColor: RED, backgroundColor: 'rgba(196,18,48,0.15)' },
  chipTxt: {
    fontFamily: F.sans500, fontSize: 13, color: 'rgba(255,255,255,0.5)',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 17,
  },
  chipTxtOn: { color: RED, fontFamily: F.sans700 },

  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1C' },
  boxOn: { backgroundColor: RED, borderColor: RED },
  checkTxt: {
    fontFamily: F.sans500, fontSize: 13, color: 'rgba(255,255,255,0.55)',
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 17,
  },
});
