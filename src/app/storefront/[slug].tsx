import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { authenticatedClient } from '@/api/common/client';
import { useCart } from '@/lib/store/cart-store';
import { F } from '@/lib/fonts';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.52;
const AUTO_SCROLL_INTERVAL = 3000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review { title: string; content: string; rating: number; images: string[] }
interface Category { id: number; name: string; slug: string }

interface VariationOption {
  option_id: number;
  option_name: string;
  option_value: string;
  type_id: number;
  type_name: string;
  type_slug: string;
}

interface SellableInventory {
  id?: number;
  quantity_remaining: number;
  price?: number;
  market_price?: number;
  address?: string;
}

interface Variant {
  id: number;
  sku: string;
  price: number;
  market_price: number;
  images: string[];
  variation_options: VariationOption[];
  sellable_inventory: SellableInventory;
}

interface VendorListing {
  product_id: number;
  sold_by: {
    tenant_id: number;
    title: string;
    currency: { code: string; symbol: string };
  };
  price: number;
  market_price: number;
  sellable_inventory: SellableInventory;
  variants: Variant[];
  status: string;
  is_active_product: boolean;
}

interface ProductAvailableVariation {
  type_id:   number;
  type_name: string;
  type_slug: string;
  options: {
    option_id:    number;
    option_name:  string;
    option_value: string;
    meta?:        { color_hex?: string };
    variant_id:   number;
  }[];
}

interface Product {
  id: number;
  product_name: string;
  description: string;
  photo: string;
  images: string[];
  price: number;
  market_price: number;
  currency: { code: string; symbol: string };
  rating: string;
  sku: string;
  slug: string;
  sellable_inventory: { quantity_remaining: number; address: string };
  attributes: {
    features: string[];
    tags: string[];
    feedback: { reviews: Review[]; summary: any };
    faqs: any[];
    meta?: { food_type?: string };
    [key: string]: any;
  };
  categories: Category[];
  vendor_listings: VendorListing[];
  has_variation: boolean;
  variants?:             Variant[];
  available_variations?: ProductAvailableVariation[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getApprovedVendors(listings: VendorListing[]): VendorListing[] {
  return listings
    .filter(v => v.is_active_product && v.status === 'APPROVED')
    .sort((a, b) => a.price - b.price);
}

const vendorKey = (v: VendorListing, idx: number) =>
  `vendor-${v.sold_by?.tenant_id ?? idx}-${v.product_id}`;

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 13 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={size}
        color={i <= Math.round(rating) ? '#F59E0B' : '#FFD5D8'}
      />
    ))}
  </View>
);

// ─── Food Type Indicator (FSSAI) ─────────────────────────────────────────────
const FoodTypeIndicator = ({ foodType }: { foodType?: string }) => {
  if (!foodType) return null;
  const isVeg  = foodType.toLowerCase() === 'veg';
  const color  = isVeg ? '#1E8B00' : '#9B1C1C';
  const label  = isVeg ? 'Veg' : 'Non-Veg';
  return (
    <View style={fti.row}>
      <View style={[fti.box, { borderColor: color }]}>
        <View style={[fti.dot, { backgroundColor: color }]} />
      </View>
      <Text style={[fti.label, { color }]}>{label}</Text>
    </View>
  );
};
const fti = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box:   { width: 18, height: 18, borderWidth: 1.5, borderRadius: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  dot:   { width: 9, height: 9, borderRadius: 4.5 },
  label: { fontSize: 12, fontFamily: F.sans700, letterSpacing: 0.2 },
});

// ─── Variant Chip ─────────────────────────────────────────────────────────────
const VariantChip = ({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        scale.value = withSequence(withTiming(0.85, { duration: 70 }), withSpring(1));
        onPress();
      }}
      disabled={disabled}
    >
      <Animated.View style={[st.sizeChip, selected && st.sizeChipSel, disabled && st.sizeChipDisabled, animStyle]}>
        <Text style={[st.sizeChipTxt, selected && st.sizeChipTxtSel, disabled && st.sizeChipTxtDisabled]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── Info Strip Item ──────────────────────────────────────────────────────────
const StripItem = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={st.stripItem}>
    <View style={st.stripIcon}><Ionicons name={icon} size={15} color="#C41230" /></View>
    <Text style={st.stripLabel}>{label}</Text>
    <Text style={st.stripValue}>{value}</Text>
  </View>
);

// ─── Sold By Card ─────────────────────────────────────────────────────────────
const SoldByCard = ({
  vendor,
  selected,
  onSelect,
  isCheapest,
  rank,
}: {
  vendor: VendorListing;
  selected: boolean;
  onSelect: () => void;
  isCheapest: boolean;
  rank: number;
}) => {
  const discount =
    vendor.market_price > 0 && vendor.market_price > vendor.price
      ? Math.round(((vendor.market_price - vendor.price) / vendor.market_price) * 100)
      : 0;
  const sym = vendor.sold_by?.currency?.symbol ?? '₹';
  const qty = vendor.sellable_inventory?.quantity_remaining ?? 0;
  const hasVariants = vendor.variants && vendor.variants.length > 0;

  const cheapestVariantPrice = hasVariants
    ? Math.min(...vendor.variants.map(v => v.price))
    : null;

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.82}
      style={[st.soldByCard, selected && st.soldByCardSel]}
    >
      {selected && <View style={st.soldBySelectedStrip} />}

      <View style={[st.soldByRadio, selected && st.soldByRadioSel]}>
        {selected && <View style={st.soldByRadioDot} />}
      </View>

      <View style={{ flex: 1 }}>
        <View style={st.soldByNameRow}>
          <View style={[st.soldByAvatar, selected && st.soldByAvatarSel]}>
            <Text style={st.soldByAvatarTxt}>
              {(vendor.sold_by?.title ?? 'S')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.soldByName, selected && st.soldByNameSel]} numberOfLines={1}>
              {vendor.sold_by?.title ?? 'Unknown Seller'}
            </Text>
            <View style={st.soldByMetaRow}>
              <View style={[st.stockDotSmall, {
                backgroundColor: qty <= 0 ? '#EF4444' : qty <= 10 ? '#F59E0B' : '#22C55E',
              }]} />
              <Text style={[st.soldByStock, qty <= 0 && st.soldByStockOut]}>
                {qty <= 0 ? 'Out of stock' : qty > 10 ? 'In stock' : `Only ${Math.floor(qty)} left`}
              </Text>
            </View>
          </View>

          {isCheapest && (
            <View style={st.bestPriceBadge}>
              <Ionicons name="pricetag" size={10} color="#8B7355" />
              <Text style={st.bestPriceTxt}>Best price</Text>
            </View>
          )}
        </View>

        <View style={st.soldByPriceRow}>
          <Text style={[st.soldByPrice, selected && st.soldByPriceSel]}>
            {sym}
            {(cheapestVariantPrice ?? vendor.price).toLocaleString()}
            {hasVariants && cheapestVariantPrice !== null ? '+' : ''}
          </Text>
          {discount > 0 && (
            <>
              <Text style={st.soldByMrp}>
                {sym}{vendor.market_price.toLocaleString()}
              </Text>
              <View style={st.soldByDiscBadge}>
                <Text style={st.soldByDiscTxt}>{discount}% off</Text>
              </View>
            </>
          )}
        </View>

        {hasVariants && (
          <View style={st.vendorVariantHintRow}>
            <Ionicons name="color-palette-outline" size={11} color="#8B7355" />
            <Text style={st.vendorVariantHintTxt}>
              {vendor.variants.length} variant{vendor.variants.length > 1 ? 's' : ''} available
            </Text>
            {vendor.variants.slice(0, 5).map(v => {
              const colorOpt = v.variation_options.find(o => o.type_slug === 'color');
              if (!colorOpt) return null;
              const colorMap: Record<string, string> = {
                black: '#1a1a1a', white: '#f5f5f5', red: '#EF4444',
                blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B',
                pink: '#EC4899', purple: '#8B5CF6', orange: '#F97316',
                grey: '#9CA3AF', gray: '#9CA3AF', silver: '#C0C0C0',
                gold: '#FFD700', brown: '#92400E',
              };
              const bgColor = colorMap[colorOpt.option_value.toLowerCase()] ?? '#E5E7EB';
              return (
                <View
                  key={v.id}
                  style={[
                    st.colorSwatchPreview,
                    { backgroundColor: bgColor },
                    bgColor === '#f5f5f5' && { borderWidth: 1, borderColor: '#D1FAE5' },
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Variant Row ──────────────────────────────────────────────────────────────
const VariantRow = ({
  variant,
  productPhoto,
  sym,
  isSelected,
  qty,
  loading,
  onSelect,
  onAdd,
  onRemove,
}: {
  variant: Variant;
  productPhoto: string;
  sym: string;
  isSelected: boolean;
  qty: number;
  loading: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) => {
  const label = variant.variation_options.map((o) => o.option_name).join(' · ');
  const disc =
    variant.market_price > variant.price
      ? Math.round(((variant.market_price - variant.price) / variant.market_price) * 100)
      : 0;
  const stock = Math.floor(variant.sellable_inventory?.quantity_remaining ?? 0);
  const outOfStock = stock <= 0;
  const imgSrc = variant.images?.[0] || productPhoto;

  return (
    <Pressable
      onPress={onSelect}
      style={[vr.row, isSelected && vr.rowSel, outOfStock && vr.rowOos]}
    >
      {isSelected && <View style={vr.selStrip} />}
      <Image source={{ uri: imgSrc }} style={vr.img} resizeMode="cover" />
      <View style={vr.info}>
        <Text style={[vr.label, isSelected && vr.labelSel]} numberOfLines={2}>
          {label || variant.sku}
        </Text>
        <View style={vr.priceRow}>
          <Text style={vr.price}>{sym}{variant.price.toLocaleString()}</Text>
          {disc > 0 && (
            <>
              <Text style={vr.mrp}>{sym}{variant.market_price.toLocaleString()}</Text>
              <View style={vr.discChip}>
                <Text style={vr.discTxt}>{disc}% off</Text>
              </View>
            </>
          )}
        </View>
        <View style={vr.stockRow}>
          <View style={[vr.stockDot, { backgroundColor: stock > 10 ? '#22C55E' : stock > 0 ? '#F59E0B' : '#EF4444' }]} />
          <Text style={[vr.stockTxt, outOfStock && vr.stockOos]}>
            {outOfStock ? 'Out of stock' : stock <= 10 ? `Only ${stock} left` : 'In stock'}
          </Text>
        </View>
      </View>

      {/* Cart control — right side */}
      {outOfStock ? (
        <View style={vr.oosTag}><Text style={vr.oosTxt}>N/A</Text></View>
      ) : qty > 0 ? (
        <View style={vr.stepper}>
          <Pressable onPress={onRemove} hitSlop={8} style={vr.stepBtn}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="remove" size={16} color="#FFFFFF" />
            )}
          </Pressable>
          <Text style={vr.stepQty}>{qty}</Text>
          <Pressable onPress={onAdd} hitSlop={8} style={[vr.stepBtn, vr.stepBtnPlus]}>
            <Ionicons name="add" size={16} color="#F5EFE6" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onAdd(); }}
          style={vr.addBtn}
          hitSlop={6}
        >
          {loading ? (
            <ActivityIndicator color="#2C1F14" size="small" />
          ) : (
            <Text style={vr.addTxt}>+ Add</Text>
          )}
        </Pressable>
      )}
    </Pressable>
  );
};

const vr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#FFD5D8',
    padding: 12, gap: 12, overflow: 'hidden',
  },
  rowSel:    { borderColor: '#C41230', backgroundColor: '#FFF0F3' },
  rowOos:    { opacity: 0.55 },
  selStrip:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#C41230', borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  img:       { width: 60, height: 60, borderRadius: 10, backgroundColor: '#FFF0F3', flexShrink: 0 },
  info:      { flex: 1, gap: 3 },
  label:     { fontSize: 13, fontFamily: F.sans700, color: '#2D2D2D', lineHeight: 17 },
  labelSel:  { color: '#0D0D0D' },
  priceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  price:     { fontSize: 14, fontFamily: F.sans900, color: '#0D0D0D', letterSpacing: -0.3 },
  mrp:       { fontSize: 11, color: '#6B7280', textDecorationLine: 'line-through' },
  discChip:  { backgroundColor: '#FFF0F3', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  discTxt:   { fontSize: 9, fontFamily: F.sans800, color: '#C41230' },
  stockRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  stockDot:  { width: 5, height: 5, borderRadius: 3 },
  stockTxt:  { fontSize: 10, color: '#6B7280', fontFamily: F.sans500 },
  stockOos:  { color: '#EF4444' },
  stepper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#C41230', borderRadius: 10, overflow: 'hidden', flexShrink: 0 },
  stepBtn:   { width: 32, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  stepBtnPlus: { backgroundColor: 'transparent' },
  stepQty:   { width: 30, textAlign: 'center', fontSize: 14, fontFamily: F.sans900, color: '#FFFFFF' },
  addBtn:    { borderWidth: 1.5, borderColor: '#C41230', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, flexShrink: 0 },
  addTxt:    { fontSize: 12, fontFamily: F.sans800, color: '#C41230' },
  oosTag:    { backgroundColor: '#FFF0F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 },
  oosTxt:    { fontSize: 11, color: '#6B7280', fontFamily: F.sans600 },
});

// ─── Skeleton shimmer (Reanimated) ───────────────────────────────────────────
function useSkeletonShimmer() {
  const sv = useSharedValue(0);
  useEffect(() => {
    sv.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 820 }),
        withTiming(0, { duration: 820 }),
      ),
      -1,
    );
    return () => cancelAnimation(sv);
  }, []);
  // opacity oscillates 0.28 → 0.72
  return useAnimatedStyle(() => ({ opacity: 0.28 + sv.value * 0.44 }));
}

// ─── SkBone ───────────────────────────────────────────────────────────────────
function SkBone({
  w, h, r = 8, shimmer, style,
}: {
  w?: number | string;
  h: number;
  r?: number;
  shimmer: any;         // Reanimated animated style
  style?: object;
}) {
  return (
    <Animated.View
      style={[
        { width: w as any, height: h, borderRadius: r, backgroundColor: '#E9DEE1' },
        shimmer,
        style,
      ]}
    />
  );
}

// ─── Product Detail Skeleton ──────────────────────────────────────────────────
function ProductDetailSkeleton({ onBack }: { onBack: () => void }) {
  const insets  = useSafeAreaInsets();
  const shimmer = useSkeletonShimmer();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF5F7' }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Sticky header (back + cart buttons always tappable) ── */}
      <View
        style={{
          position: 'absolute', top: insets.top + 4, left: 14, right: 14,
          zIndex: 100, flexDirection: 'row', justifyContent: 'space-between',
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={onBack}
          style={skSt.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          pointerEvents="auto"
        >
          <Ionicons name="chevron-back" size={20} color="#2C1F14" />
        </TouchableOpacity>
        <TouchableOpacity style={skSt.headerBtn} pointerEvents="auto">
          <Ionicons name="cart-outline" size={20} color="#2C1F14" />
        </TouchableOpacity>
      </View>

      {/* ── Hero image block ── */}
      <SkBone w={width} h={IMAGE_HEIGHT} r={0} shimmer={shimmer} />

      {/* ── White info card ── */}
      <View style={skSt.card}>
        {/* Price */}
        <SkBone w={130} h={38} r={8} shimmer={shimmer} style={{ marginBottom: 16 }} />

        {/* Product name 2 lines */}
        <SkBone w="88%" h={22} r={6} shimmer={shimmer} style={{ marginBottom: 9 }} />
        <SkBone w="58%" h={15} r={5} shimmer={shimmer} style={{ marginBottom: 16 }} />

        {/* Rating row */}
        <View style={skSt.ratingRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkBone key={i} w={14} h={14} r={7} shimmer={shimmer} />
          ))}
          <SkBone w={28} h={12} r={4} shimmer={shimmer} />
          <SkBone w={72} h={12} r={4} shimmer={shimmer} />
        </View>

        {/* Category chips */}
        <View style={skSt.chipsRow}>
          <SkBone w={82}  h={30} r={15} shimmer={shimmer} />
          <SkBone w={114} h={30} r={15} shimmer={shimmer} />
          <SkBone w={70}  h={30} r={15} shimmer={shimmer} />
        </View>

        {/* Info strip */}
        <SkBone w="100%" h={78} r={16} shimmer={shimmer} style={{ marginBottom: 18 }} />

        {/* Divider */}
        <View style={skSt.div} />

        {/* Sold by section */}
        <SkBone w={88}    h={11} r={4} shimmer={shimmer} style={{ marginBottom: 13 }} />
        <SkBone w="100%"  h={88} r={16} shimmer={shimmer} style={{ marginBottom: 10 }} />
        <SkBone w="100%"  h={88} r={16} shimmer={shimmer} style={{ marginBottom: 18 }} />

        {/* Divider */}
        <View style={skSt.div} />

        {/* Description */}
        <SkBone w={140}  h={11} r={4} shimmer={shimmer} style={{ marginBottom: 13 }} />
        <SkBone w="100%" h={14} r={4} shimmer={shimmer} style={{ marginBottom: 8 }} />
        <SkBone w="100%" h={14} r={4} shimmer={shimmer} style={{ marginBottom: 8 }} />
        <SkBone w="76%"  h={14} r={4} shimmer={shimmer} style={{ marginBottom: 8 }} />
        <SkBone w="50%"  h={14} r={4} shimmer={shimmer} />
      </View>

      {/* ── CTA Bar placeholder ── */}
      <View style={[skSt.ctaBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={{ minWidth: 100, gap: 7 }}>
          <SkBone w={50}  h={10} r={4}  shimmer={shimmer} />
          <SkBone w={92}  h={28} r={7}  shimmer={shimmer} />
          <SkBone w={66}  h={10} r={4}  shimmer={shimmer} />
        </View>
        <Animated.View
          style={[
            { flex: 1, height: 54, borderRadius: 18, backgroundColor: '#E9DEE1' },
            shimmer,
          ]}
        />
      </View>
    </View>
  );
}

const skSt = StyleSheet.create({
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FFD5D8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
    flex: 1,
  },
  ratingRow:  { flexDirection: 'row', gap: 5, alignItems: 'center', marginBottom: 16 },
  chipsRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  div:        { height: 1, backgroundColor: '#FFF0F3', marginBottom: 16 },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#FFD5D8',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 14, gap: 14,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const cartItems        = useCart(s => s.cartItems);
  const totalCartCount   = Array.isArray(cartItems)
    ? cartItems.reduce((sum: number, i: any) => sum + Number(i?.quantity ?? 1), 0)
    : 0;
  const loadingProductId = useCart(s => s.loadingProductId);
  const addToCart        = useCart(s => s.addToCart);
  const updateQuantity   = useCart(s => s.updateQuantity);
  const removeFromCart   = useCart(s => s.removeFromCart);

  const [product,           setProduct]           = useState<Product | null>(null);
  const [similar,           setSimilar]            = useState<Product[]>([]);
  const [activeImageIndex,  setActiveImageIndex]   = useState(0);
  const [quantity,          setQuantity]           = useState(1);
  const [addedPulse,        setAddedPulse]         = useState(false);
  const [vendors,           setVendors]            = useState<VendorListing[]>([]);
  const [selectedVendorIdx, setSelectedVendorIdx]  = useState(0);
  const [selectedVariantId, setSelectedVariantId]  = useState<number | null>(null);

  const scrollY      = useSharedValue(0);
  const cartBtnScale = useSharedValue(1);
  const imageListRef = useRef<FlatList>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagesRef    = useRef<string[]>([]);

  useEffect(() => { if (slug) fetchProduct(); }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await authenticatedClient.get(`api/shop/get_product/${slug}/`);
      const raw: Product = res.data.data;
      const data: Product = {
        ...raw,
        price:        raw.price        ?? 0,
        market_price: raw.market_price ?? 0,
        rating:       raw.rating       ?? '0',
        sellable_inventory: {
          quantity_remaining: raw.sellable_inventory?.quantity_remaining ?? 0,
          address:            raw.sellable_inventory?.address            ?? '',
        },
        currency:             raw.currency             ?? { code: 'INR', symbol: '₹' },
        attributes: {
          features: raw.attributes?.features ?? [],
          tags:     raw.attributes?.tags     ?? [],
          feedback: raw.attributes?.feedback ?? { reviews: [], summary: null },
          faqs:     raw.attributes?.faqs     ?? [],
          meta:     raw.attributes?.meta     ?? {},
        },
        images:               raw.images               ?? [],
        categories:           raw.categories           ?? [],
        vendor_listings:      raw.vendor_listings      ?? [],
        has_variation:        raw.has_variation        ?? false,
        variants:             raw.variants             ?? [],
        available_variations: raw.available_variations ?? [],
      };
      setProduct(data);

      const approved = getApprovedVendors(data.vendor_listings);
      setVendors(approved);

      if (approved.length > 0) {
        // Vendor listings present — cart-aware pre-select
        let preVendorIdx = 0;
        let preVariantId: number | null = approved[0]?.variants?.[0]?.id ?? null;
        outerLoop:
        for (let vi = 0; vi < approved.length; vi++) {
          for (const v of approved[vi].variants ?? []) {
            const ci = cartItems.find((c: any) => Number(c.id) === v.id);
            if (ci && Number(ci.quantity) > 0) {
              preVendorIdx = vi;
              preVariantId = v.id;
              break outerLoop;
            }
          }
        }
        setSelectedVendorIdx(preVendorIdx);
        setSelectedVariantId(preVariantId);
      } else if (data.variants?.length) {
        // No vendor listings — use product-level variants, cart-aware
        let preVariantId: number | null = data.variants[0].id;
        for (const v of data.variants) {
          const ci = cartItems.find((c: any) => Number(c.id) === v.id);
          if (ci && Number(ci.quantity) > 0) { preVariantId = v.id; break; }
        }
        setSelectedVariantId(preVariantId);
      }
      fetchSimilar(data.id);
    } catch (e) { console.error('Product fetch error', e); }
  };

  const fetchSimilar = async (productId: number) => {
    try {
      const res = await authenticatedClient.get(`api/shop/products/${productId}/similar/`);
      setSimilar(res.data || []);
    } catch (e) { console.error('Similar fetch error', e); }
  };

  const activeVendor  = vendors[selectedVendorIdx] ?? null;

  // Resolve the active variant — check vendor variants first, fall back to product-level variants
  const productLevelVariants = product?.variants ?? [];
  const activeVariant =
    activeVendor?.variants?.find(v => v.id === selectedVariantId) ??
    productLevelVariants.find(v => v.id === selectedVariantId) ??
    null;

  const effectivePrice =
    activeVariant?.price        ?? activeVendor?.price        ?? product?.price        ?? 0;
  const effectiveMarketPrice =
    activeVariant?.market_price ?? activeVendor?.market_price ?? product?.market_price ?? 0;
  const effectiveInventory =
    activeVariant?.sellable_inventory?.quantity_remaining ??
    activeVendor?.sellable_inventory?.quantity_remaining  ??
    product?.sellable_inventory?.quantity_remaining       ?? 0;
  const sym = activeVendor?.sold_by?.currency?.symbol ?? product?.currency?.symbol ?? '₹';

  // Use vendor variants if available, otherwise fall back to product-level variants
  const vendorVariants = activeVendor?.variants?.length
    ? activeVendor.variants
    : productLevelVariants;
  const hasVariants = vendorVariants.length > 0;

  const variantTypeMap = new Map<string, {
    typeName: string;
    options: Array<{ variantId: number; label: string; outOfStock: boolean; colorValue?: string }>;
  }>();

  if (hasVariants) {
    for (const variant of vendorVariants) {
      for (const opt of variant.variation_options) {
        if (!variantTypeMap.has(opt.type_slug)) {
          variantTypeMap.set(opt.type_slug, { typeName: opt.type_name, options: [] });
        }
        const group = variantTypeMap.get(opt.type_slug)!;
        const alreadyAdded = group.options.some(
          o => o.variantId === variant.id && o.label === opt.option_name
        );
        if (!alreadyAdded) {
          group.options.push({
            variantId:  variant.id,
            label:      opt.option_name,
            outOfStock: (variant.sellable_inventory?.quantity_remaining ?? 0) <= 0,
            colorValue: opt.type_slug === 'color' ? opt.option_value : undefined,
          });
        }
      }
    }
  }

  const getActiveImages = useCallback((): string[] => {
    if (!product) return [];
    const variantImgs = activeVariant?.images?.length ? activeVariant.images : [];
    const base = [product.photo, ...(product.images ?? [])].filter(Boolean);
    return variantImgs.length ? [...variantImgs, ...base] : base;
  }, [product, activeVariant]);

  const cartKey  = activeVariant
    ? activeVariant.id
    : (activeVendor?.product_id ?? product?.id ?? 0);
  const cartItem = cartItems.find((c: any) => Number(c.id) === Number(cartKey));
  const cartQty  = Number(cartItem?.quantity ?? 0);
  const isInCart = cartQty > 0;

  useEffect(() => {
    if (!product) return;
    const imgs = getActiveImages();
    imagesRef.current = imgs;
    setActiveImageIndex(0);
    try { imageListRef.current?.scrollToIndex({ index: 0, animated: false }); } catch (_) {}
    if (imgs.length <= 1) return;
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      setActiveImageIndex(prev => {
        const next = (prev + 1) % imagesRef.current.length;
        try { imageListRef.current?.scrollToIndex({ index: next, animated: true }); } catch (_) {}
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [product, activeVariant]);

  const stopAutoScroll = () => {
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null; }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: e => { scrollY.value = e.contentOffset.y; },
  });

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(scrollY.value, [0, IMAGE_HEIGHT], [0, -IMAGE_HEIGHT * 0.3], Extrapolate.CLAMP),
    }],
  }));
  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [IMAGE_HEIGHT - 100, IMAGE_HEIGHT - 10], [0, 1], Extrapolate.CLAMP),
  }));
  const cartAnimStyle  = useAnimatedStyle(() => ({ transform: [{ scale: cartBtnScale.value }] }));

  const handleSelectVendor = useCallback((idx: number) => {
    setSelectedVendorIdx(idx);
    const firstVariant = vendors[idx]?.variants?.[0]?.id ?? null;
    setSelectedVariantId(firstVariant);
    setQuantity(1);
  }, [vendors]);

  const handleSelectVariant = useCallback((variantId: number) => {
    setSelectedVariantId(prev => prev === variantId ? prev : variantId);
    setQuantity(1);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 90 }), withSpring(1.04), withSpring(1));
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 1400);
    await addToCart(cartKey, quantity, {
      product_name: product.product_name,
      final_price: effectivePrice,
      original_price: effectiveMarketPrice,
      photo: product.images?.[0] ?? product.photo,
      quantity_remaining: effectiveInventory,
    });
  }, [product, cartKey, quantity, effectivePrice, effectiveMarketPrice, effectiveInventory]);

  const handleIncrement = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1));
    await addToCart(cartKey, cartQty + 1, {
      product_name: product.product_name,
      final_price: effectivePrice,
      original_price: effectiveMarketPrice,
      photo: product.images?.[0] ?? product.photo,
      quantity_remaining: effectiveInventory,
    });
  }, [product, cartKey, cartQty, effectivePrice, effectiveMarketPrice, effectiveInventory]);

  const handleDecrement = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1));
    if (cartQty <= 1) { await removeFromCart(cartKey); }
    else              { await updateQuantity(cartKey, cartQty - 1); }
  }, [product, cartKey, cartQty]);

  const handleSimilarPress = useCallback((itemSlug: string, itemId: number) => {
    setActiveImageIndex(0); setSelectedVariantId(null); setQuantity(1); setAddedPulse(false);
    router.push(`/storefront/${itemSlug || itemId}`);
  }, [router]);

  if (!product) {
    return <ProductDetailSkeleton onBack={() => router.back()} />;
  }

  const images    = getActiveImages();
  const onlyFew   = effectiveInventory > 0 && effectiveInventory <= 10;
  const isLoading = loadingProductId === cartKey;
  const discount  = (effectiveMarketPrice > 0 && effectiveMarketPrice > effectivePrice)
    ? Math.round(((effectiveMarketPrice - effectivePrice) / effectiveMarketPrice) * 100)
    : 0;
  const reviews   = product.attributes?.feedback?.reviews?.filter(r => r.content) || [];
  const features  = product.attributes?.features || [];
  const tags      = product.attributes?.tags || [];
  const ratingNum = parseFloat(product.rating || '0');

  const androidBottom    = Math.max(insets.bottom, 16);
  const ctaPaddingBottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : androidBottom;

  const cheapestApprovedIdx = 0;

  const colorMap: Record<string, string> = {
    black: '#1a1a1a', white: '#f5f5f5', red: '#EF4444',
    blue: '#3B82F6', green: '#10B981', yellow: '#F59E0B',
    pink: '#EC4899', purple: '#8B5CF6', orange: '#F97316',
    grey: '#9CA3AF', gray: '#9CA3AF', silver: '#C0C0C0',
    gold: '#FFD700', brown: '#92400E',
  };

  const maxQty = Math.floor(effectiveInventory);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={st.root}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* ── Header ── */}
        <View
          style={[st.stickyHeader, { paddingTop: insets.top + 4 }]}
          pointerEvents="box-none"
        >
          <Animated.View style={[StyleSheet.absoluteFill, st.stickyHeaderBg, headerBgStyle]} />

          <TouchableOpacity
            onPress={() => router.back()}
            style={st.stickyBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            pointerEvents="auto"
          >
            <Ionicons name="chevron-back" size={20} color="#2C1F14" />
          </TouchableOpacity>

          <Animated.Text style={[st.stickyTitle, headerBgStyle]} numberOfLines={1}>
            {product.product_name}
          </Animated.Text>

          <View style={st.stickyRight}>
            <TouchableOpacity
              onPress={() => router.push('/storefront/cart' as never)}
              style={st.stickyBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              pointerEvents="auto"
            >
              <Ionicons name="cart-outline" size={20} color="#2C1F14" />
              {totalCartCount > 0 && (
                <View style={st.cartBadge}>
                  <Text style={st.cartBadgeTxt}>
                    {totalCartCount > 99 ? '99+' : String(totalCartCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Main Scroll ── */}
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + ctaPaddingBottom }}
        >
          {/* ── Hero Carousel ── */}
          <Animated.View style={[{ height: IMAGE_HEIGHT, backgroundColor: '#0D0D0D' }, imageAnimStyle]}>
            <FlatList
              ref={imageListRef}
              data={images}
              horizontal pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `img-${i}`}
              onScrollBeginDrag={stopAutoScroll}
              onMomentumScrollEnd={e =>
                setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: IMAGE_HEIGHT }}
                  resizeMode="cover"
                />
              )}
            />

            {/* Badges */}
            {onlyFew && (
              <Animated.View
                entering={FadeIn}
                style={[st.badge, st.badgeFire, { top: insets.top + 56 }]}
              >
                <Ionicons name="flame" size={12} color="#fff" />
                <Text style={st.badgeTxt}>Only {Math.floor(effectiveInventory)} left</Text>
              </Animated.View>
            )}
            {discount > 0 && (
              <View
                style={[st.badge, st.badgeGold, { top: insets.top + (onlyFew ? 96 : 56) }]}
              >
                <Text style={st.badgeTxt}>{discount}% OFF</Text>
              </View>
            )}

            {/* Counter + rating pills */}
            <View style={st.imgBottomRow} pointerEvents="none">
              <View style={st.pillLight}>
                <Text style={st.pillLightTxt}>
                  {activeImageIndex + 1} / {images.length}
                </Text>
              </View>
              <View style={st.pillLight}>
                <Ionicons name="star" size={12} color="#C9A96E" />
                <Text style={st.pillLightTxt}>{ratingNum.toFixed(1)}</Text>
              </View>
            </View>

            {/* Dots */}
            <View style={st.dotsRow} pointerEvents="none">
              {images.map((_, i) => (
                <View key={i} style={[st.dot, i === activeImageIndex && st.dotActive]} />
              ))}
            </View>
          </Animated.View>

          {/* ── Info Card ── */}
          <Animated.View entering={FadeInUp.delay(60)} style={st.infoCard}>

            {/* Price hero */}
            <View style={st.priceHero}>
              <View style={{ flex: 1 }}>
                <View style={st.priceHeroRow}>
                  <Text style={st.priceHeroValue}>
                    {sym}{effectivePrice.toLocaleString()}
                  </Text>
                  {discount > 0 && (
                    <View style={st.discBadge}>
                      <Text style={st.discBadgeTxt}>{discount}% off</Text>
                    </View>
                  )}
                </View>
                {discount > 0 && (
                  <Text style={st.priceHeroMrp}>
                    MRP {sym}{effectiveMarketPrice.toLocaleString()}
                  </Text>
                )}
                {discount > 0 && (
                  <Text style={st.priceSaving}>
                    You save {sym}
                    {(effectiveMarketPrice - effectivePrice).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Text style={st.productName}>{product.product_name}</Text>
            </View>
            <FoodTypeIndicator foodType={product.attributes?.meta?.food_type} />

            <View style={[st.metaRow, { marginTop: 8 }]}>
              <StarRating rating={ratingNum} />
              <Text style={st.metaBold}>{ratingNum.toFixed(1)}</Text>
              {reviews.length > 0 && (
                <Text style={st.metaDim}>({reviews.length} reviews)</Text>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {product.categories.map(c => (
                <View key={c.id} style={st.catChip}>
                  <Text style={st.catChipTxt}>{c.name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Info strip */}
            <View style={st.strip}>
              <StripItem icon="flame-outline"             label="Fresh Daily"  value="Made to order" />
              <View style={st.stripDivider} />
              <StripItem icon="ribbon-outline"            label="Authentic"    value="Chinese recipe" />
              <View style={st.stripDivider} />
              <StripItem icon="bicycle-outline"           label="Fast Delivery" value="30 min avg" />
            </View>

            <View style={st.divider} />

            {/* ════ SOLD BY SECTION ════════════════════════════════════════════ */}
            {vendors.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <View style={st.secHeader}>
                  <View>
                    <Text style={st.secLabel}>SOLD BY</Text>
                    {vendors.length > 1 && (
                      <Text style={st.soldBySubtitle}>
                        {vendors.length} verified seller{vendors.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  {activeVendor && (
                    <View style={st.selectedVendorPill}>
                      <View style={st.selectedVendorPillDot} />
                      <Text style={st.selectedVendorPillTxt} numberOfLines={1}>
                        {activeVendor.sold_by?.title?.split(' ').slice(0, 2).join(' ') ?? 'Selected'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={st.soldByList}>
                  {vendors.map((vendor, idx) => (
                    <Animated.View
                      key={vendorKey(vendor, idx)}
                      entering={FadeInDown.delay(idx * 60)}
                    >
                      <SoldByCard
                        vendor={vendor}
                        selected={selectedVendorIdx === idx}
                        onSelect={() => handleSelectVendor(idx)}
                        isCheapest={idx === cheapestApprovedIdx}
                        rank={idx + 1}
                      />
                    </Animated.View>
                  ))}
                </View>

                {activeVendor && (
                  <Animated.View entering={FadeIn} style={st.vendorSummaryStrip}>
                    <View style={st.vendorSummaryItem}>
                      <Ionicons name="storefront-outline" size={14} color="#8B7355" />
                      <Text style={st.vendorSummaryTxt} numberOfLines={1}>
                        {activeVendor.sold_by?.title ?? 'Seller'}
                      </Text>
                    </View>
                    <View style={st.vendorSummaryDivider} />
                    <View style={st.vendorSummaryItem}>
                      <Ionicons name="shield-checkmark" size={14} color="#7C9E8A" />
                      <Text style={[st.vendorSummaryTxt, { color: '#22C55E' }]}>Approved</Text>
                    </View>
                    <View style={st.vendorSummaryDivider} />
                    <View style={st.vendorSummaryItem}>
                      <Ionicons name="cube-outline" size={14} color="#8B7355" />
                      <Text style={st.vendorSummaryTxt}>
                        {Math.floor(
                          activeVariant?.sellable_inventory?.quantity_remaining ??
                          activeVendor.sellable_inventory?.quantity_remaining ?? 0
                        )}{' '}
                        units
                      </Text>
                    </View>
                  </Animated.View>
                )}

                <View style={st.divider} />
              </View>
            )}

            {/* ════ VARIANT SELECTOR — row per variant ══════════════════════════ */}
            {hasVariants && vendorVariants.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <View style={[st.secHeader, { marginBottom: 4 }]}>
                  <Text style={st.secLabel}>SELECT VARIANT</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: F.sans500 }}>
                    {vendorVariants.length} option{vendorVariants.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={{ gap: 10, marginBottom: 4 }}>
                  {vendorVariants.map((variant) => {
                    const varQty = Number(cartItems.find((c: any) => Number(c.id) === variant.id)?.quantity ?? 0);
                    const varLoading = loadingProductId === variant.id;
                    return (
                      <VariantRow
                        key={variant.id}
                        variant={variant}
                        productPhoto={product.photo}
                        sym={sym}
                        isSelected={selectedVariantId === variant.id}
                        qty={varQty}
                        loading={varLoading}
                        onSelect={() => handleSelectVariant(variant.id)}
                        onAdd={() => {
                          handleSelectVariant(variant.id);
                          addToCart(variant.id, varQty + 1, {
                            product_name: product.product_name,
                            final_price: variant.price,
                            original_price: variant.market_price,
                            photo: variant.images?.[0] ?? product.photo,
                            quantity_remaining: variant.sellable_inventory?.quantity_remaining,
                          });
                        }}
                        onRemove={() => {
                          if (varQty <= 1) removeFromCart(variant.id);
                          else updateQuantity(variant.id, varQty - 1);
                        }}
                      />
                    );
                  })}
                </View>
                <View style={st.divider} />
              </View>
            )}

            {/* Description */}
            <Text style={st.secLabel}>ABOUT THIS PRODUCT</Text>
            <Text style={st.description}>{product.description}</Text>

            {tags.length > 0 && (
              <View style={st.tagsRow}>
                {tags.map(t => (
                  <View key={t} style={st.tag}>
                    <Text style={st.tagTxt}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={st.divider} />

            {/* ── Quantity — hidden when in cart ── */}
            {!isInCart && (
              <>
                <View style={st.qtyStockRow}>
                  <View>
                    <Text style={st.secLabel}>QUANTITY</Text>
                    <View style={st.qtyRow}>
                      <TouchableOpacity
                        onPress={() => setQuantity(q => Math.max(1, q - 1))}
                        style={[st.qtyBtn, quantity <= 1 && st.qtyBtnOff]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={quantity <= 1 ? '#FFD5D8' : '#0D0D0D'}
                        />
                      </TouchableOpacity>
                      <Animated.Text
                        key={quantity}
                        entering={FadeIn.duration(150)}
                        style={st.qtyNum}
                      >
                        {quantity}
                      </Animated.Text>
                      <TouchableOpacity
                        onPress={() =>
                          setQuantity(q => Math.min(q + 1, Math.floor(effectiveInventory)))
                        }
                        style={[
                          st.qtyBtn,
                          quantity >= Math.floor(effectiveInventory) && st.qtyBtnOff,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={
                            quantity >= Math.floor(effectiveInventory) ? '#FFD5D8' : '#0D0D0D'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={st.divider} />
              </>
            )}

            {/* Features */}
            {features.length > 0 && (
              <>
                <Text style={st.secLabel}>KEY BENEFITS</Text>
                <View style={st.featGrid}>
                  {features.map((f, i) => (
                    <Animated.View
                      key={i}
                      entering={FadeInDown.delay(i * 60)}
                      style={st.featItem}
                    >
                      <View style={st.featIcon}>
                        <Ionicons name="checkmark-circle" size={12} color="#C41230" />
                      </View>
                      <Text style={st.featTxt}>{f}</Text>
                    </Animated.View>
                  ))}
                </View>
                <View style={st.divider} />
              </>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <>
                <Text style={st.secLabel}>CUSTOMER REVIEWS</Text>
                {reviews.map((r, i) => (
                  <Animated.View
                    key={i}
                    entering={SlideInRight.delay(i * 60)}
                    style={st.reviewCard}
                  >
                    <View style={st.reviewHdr}>
                      <View style={st.avatar}>
                        <Text style={st.avatarTxt}>
                          {(r.title || 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={st.reviewName}>{r.title || 'Anonymous'}</Text>
                        <StarRating rating={r.rating || 5} size={12} />
                      </View>
                    </View>
                    <Text style={st.reviewTxt}>{r.content}</Text>
                  </Animated.View>
                ))}
                <View style={st.divider} />
              </>
            )}

            {/* Similar Products */}
            {similar.length > 0 && (
              <>
                <Text style={st.secLabel}>YOU MAY ALSO LIKE</Text>
                {/* 2-column grid — pairs of items rendered as rows */}
                <View style={st.simGrid}>
                  {Array.from({ length: Math.ceil(similar.length / 2) }, (_, rowIdx) => {
                    const left  = similar[rowIdx * 2];
                    const right = similar[rowIdx * 2 + 1];
                    const renderCard = (item: typeof left, index: number) => {
                      if (!item) return <View style={st.simCardPlaceholder} />;
                      const sd =
                        item.market_price > 0 && item.market_price > item.price
                          ? Math.round(((item.market_price - item.price) / item.market_price) * 100)
                          : 0;
                      return (
                        <Animated.View style={st.simCardWrap} entering={FadeInDown.delay(index * 70)}>
                          <TouchableOpacity
                            style={st.simCard}
                            onPress={() => handleSimilarPress(item.slug, item.id)}
                            activeOpacity={0.88}
                          >
                            <View style={st.simImgWrap}>
                              <Image source={{ uri: item.photo }} style={st.simImg} resizeMode="cover" />
                              {sd > 0 && (
                                <View style={st.simDisc}>
                                  <Text style={st.simDiscTxt}>{sd}% OFF</Text>
                                </View>
                              )}
                            </View>
                            {/* Strip border between image and info */}
                            <View style={st.simStrip} />
                            <View style={st.simInfo}>
                              <Text style={st.simName} numberOfLines={2}>{item.product_name}</Text>
                              <View style={st.simRatingRow}>
                                <StarRating rating={parseFloat(item.rating || '0')} size={10} />
                                <Text style={st.simRatingTxt}>{parseFloat(item.rating || '0').toFixed(1)}</Text>
                              </View>
                              <View style={st.simPriceRow}>
                                <Text style={st.simPrice}>{item.currency.symbol}{(item.price ?? 0).toFixed(0)}</Text>
                                {sd > 0 && <Text style={st.simMrp}>{item.currency.symbol}{(item.market_price ?? 0).toFixed(0)}</Text>}
                              </View>
                              {item.categories?.[0] && (
                                <Text style={st.simCat} numberOfLines={1}>{item.categories[0].name}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    };
                    return (
                      <View key={`row-${rowIdx}`} style={st.simRow}>
                        {renderCard(left,  rowIdx * 2)}
                        {renderCard(right, rowIdx * 2 + 1)}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </Animated.View>
        </Animated.ScrollView>

        {/* ── Sticky CTA Bar ── */}
        <View style={[st.ctaBar, { paddingBottom: ctaPaddingBottom }]}>
          <View style={st.ctaLeft}>
            <Text style={st.ctaLabel}>TOTAL</Text>
            <View style={st.ctaPriceRow}>
              <Text style={st.ctaPrice}>
                {sym}
                {(effectivePrice * (isInCart ? cartQty : quantity)).toFixed(2)}
              </Text>
              {discount > 0 && (
                <View style={st.ctaDiscBadge}>
                  <Text style={st.ctaDiscTxt}>{discount}%</Text>
                </View>
              )}
            </View>
            {discount > 0 && (
              <Text style={st.ctaMrp}>
                MRP {sym}
                {(effectiveMarketPrice * (isInCart ? cartQty : quantity)).toFixed(0)}
              </Text>
            )}
          </View>

          <Animated.View style={[st.ctaBtnWrap, cartAnimStyle]}>
            {isInCart ? (
              <View style={st.cartInCartWrap}>
                <View style={st.cartStepper}>
                  <TouchableOpacity
                    onPress={handleDecrement}
                    style={st.stepBtn}
                    activeOpacity={0.75}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Ionicons name="remove" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <View style={st.stepCount}>
                    <Text style={st.stepCountTxt}>{cartQty}</Text>
                    <Text style={st.stepCountSub}>in cart</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleIncrement}
                    style={[st.stepBtn, st.stepBtnAdd]}
                    activeOpacity={0.75}
                    disabled={isLoading || cartQty >= Math.floor(effectiveInventory)}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={
                        cartQty >= Math.floor(effectiveInventory)
                          ? 'rgba(255,255,255,0.3)'
                          : '#FFFFFF'
                      }
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('storefront/cart')}
                  style={st.goToCartBtn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bag-handle" size={17} color="#F5EFE6" />
                  <Text style={st.goToCartTxt}>Go to Cart</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAddToCart}
                style={[st.cartBtn, addedPulse && st.cartBtnSuccess]}
                activeOpacity={0.88}
                disabled={isLoading || effectiveInventory <= 0}
              >
                {isLoading ? (
                  <ActivityIndicator color="#F5EFE6" size="small" />
                ) : effectiveInventory <= 0 ? (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color="#F5EFE6" />
                    <Text style={st.cartBtnTxt}>Out of Stock</Text>
                  </>
                ) : addedPulse ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#F5EFE6" />
                    <Text style={st.cartBtnTxt}>Added!</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="bag-add-outline" size={20} color="#F5EFE6" />
                    <Text style={st.cartBtnTxt}>
                      Add to Cart · {quantity}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BEIGE_BG     = '#FFF5F7';   // light red page bg
const BEIGE_CARD   = '#FFFFFF';   // white card
const BEIGE_MID    = '#FFF0F3';   // soft red mid
const BEIGE_BORDER = '#FFD5D8';   // warm red border
const DARK         = '#0D0D0D';   // near black
const DARK_MED     = '#2D2D2D';   // dark gray
const GOLD         = '#C41230';   // red accent
const SAGE         = '#C41230';   // red (used for success states)
const MUTED        = '#6B7280';   // neutral gray

// infoCard has paddingHorizontal:20 each side + 10px gap between 2 cols
const SIM_CARD_W = Math.floor((width - 20 - 20 - 10) / 2);

const st = StyleSheet.create({
  root:       { flex: 1, backgroundColor: BEIGE_BG },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BEIGE_BG },
  loadingTxt: { marginTop: 12, color: MUTED, fontSize: 15, fontStyle: 'italic' },

  // ── Header ──
  stickyHeader:   {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
  },
  stickyHeaderBg: {
    backgroundColor: BEIGE_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BEIGE_BORDER,
  },
  stickyTitle: {
    flex: 1, marginHorizontal: 10,
    fontFamily: F.sans700, fontSize: 16,
    color: DARK, letterSpacing: -0.3,
  },
  stickyBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.90)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: BEIGE_BORDER,
  },
  stickyRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBadge: {
    position: 'absolute', top: 1, right: 1,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: DARK,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeTxt: { fontSize: 9, fontFamily: F.sans900, color: BEIGE_BG, lineHeight: 13 },

  // ── Badges ──
  badge:      { position: 'absolute', left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20 },
  badgeFire:  { backgroundColor: '#B04040' },
  badgeGold:  { backgroundColor: DARK },
  badgeTxt:   { color: BEIGE_BG, fontSize: 11, fontFamily: F.sans700, letterSpacing: 0.3 },

  // ── Image bottom ──
  imgBottomRow: { position: 'absolute', bottom: 46, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  pillLight:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(245,239,230,0.85)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  pillLightTxt: { color: DARK, fontSize: 12, fontFamily: F.sans600 },

  dotsRow:   { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(44,31,20,0.25)', marginHorizontal: 3 },
  dotActive: { width: 18, backgroundColor: DARK },

  // ── Info Card ──
  infoCard: {
    backgroundColor: BEIGE_CARD,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: DARK,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1,
  },

  // ── Price ──
  priceHero:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  priceHeroRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', },
  priceHeroValue: { fontSize: 34, fontFamily: F.sans900, color: DARK, letterSpacing: -1, paddingTop: 14 },
  discBadge:      { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: BEIGE_BORDER },
  discBadgeTxt:   { fontSize: 12, fontFamily: F.sans800, color: GOLD },
  priceHeroMrp:   { fontSize: 13, color: MUTED, textDecorationLine: 'line-through', marginTop: 3 },
  priceSaving:    { fontSize: 13, color: SAGE, fontFamily: F.sans600, marginTop: 2 },

  stockPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: BEIGE_BORDER,
    marginLeft: 8, flexShrink: 0,
  },
  stockDot:  { width: 8, height: 8, borderRadius: 4 },
  stockTxt:  { fontSize: 12, fontFamily: F.sans600, color: DARK_MED },

  productName: { fontSize: 22, fontFamily: F.sans800, color: DARK, letterSpacing: -0.6, marginBottom: 8 },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14, flexWrap: 'wrap' },
  metaBold: { fontSize: 13, fontFamily: F.sans700, color: DARK_MED },
  metaDim:  { fontSize: 13, color: MUTED },

  catChip:    { backgroundColor: BEIGE_MID, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: BEIGE_BORDER },
  catChipTxt: { color: DARK_MED, fontSize: 12, fontFamily: F.sans600, letterSpacing: 0.2 },

  // ── Info strip ──
  strip:        { flexDirection: 'row', backgroundColor: BEIGE_MID, borderRadius: 16, borderWidth: 1, borderColor: BEIGE_BORDER, overflow: 'hidden', marginBottom: 4 },
  stripItem:    { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  stripIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: BEIGE_CARD, justifyContent: 'center', alignItems: 'center' },
  stripLabel:   { fontSize: 10, color: MUTED, fontFamily: F.sans600, letterSpacing: 0.4 },
  stripValue:   { fontSize: 11, color: DARK, fontFamily: F.sans700, textAlign: 'center' },
  stripDivider: { width: 1, backgroundColor: BEIGE_BORDER, marginVertical: 10 },

  divider: { height: 1, backgroundColor: BEIGE_MID, marginVertical: 16 },

  secLabel:  { fontSize: 11, fontFamily: F.sans800, color: MUTED, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  selSizeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BEIGE_MID, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: BEIGE_BORDER },
  selSizeTxt:   { fontSize: 13, fontFamily: F.sans700, color: DARK },
  selColorDot:  { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },

  variantPrice: { fontSize: 15, fontFamily: F.sans800, color: GOLD },

  // ── Sold By ──
  soldBySubtitle:       { fontSize: 12, color: MUTED, fontFamily: F.sans500, marginTop: 2 },
  soldByList:           { gap: 10, marginBottom: 10 },

  soldByCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, borderWidth: 1.5, borderColor: BEIGE_BORDER,
    backgroundColor: BEIGE_BG, padding: 14, overflow: 'hidden',
  },
  soldByCardSel:        { borderColor: DARK, backgroundColor: BEIGE_CARD },
  soldBySelectedStrip:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: DARK, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },

  soldByRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BEIGE_BORDER, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  soldByRadioSel: { borderColor: DARK },
  soldByRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DARK },

  soldByNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  soldByAvatar:    { width: 34, height: 34, borderRadius: 17, backgroundColor: BEIGE_MID, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  soldByAvatarSel: { backgroundColor: DARK },
  soldByAvatarTxt: { color: BEIGE_BG, fontFamily: F.sans800, fontSize: 14 },
  soldByName:      { fontSize: 14, fontFamily: F.sans700, color: DARK_MED },
  soldByNameSel:   { color: DARK },
  soldByMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  stockDotSmall:   { width: 6, height: 6, borderRadius: 3 },
  soldByStock:     { fontSize: 11, color: MUTED },
  soldByStockOut:  { color: '#EF4444' },

  bestPriceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: BEIGE_BORDER },
  bestPriceTxt:   { fontSize: 11, fontFamily: F.sans700, color: GOLD },

  soldByPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  soldByPrice:     { fontSize: 17, fontFamily: F.sans900, color: DARK_MED, letterSpacing: -0.4 },
  soldByPriceSel:  { color: DARK },
  soldByMrp:       { fontSize: 13, color: MUTED, textDecorationLine: 'line-through' },
  soldByDiscBadge: { backgroundColor: '#DCFCE7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  soldByDiscTxt:   { fontSize: 11, fontFamily: F.sans800, color: GOLD },

  vendorVariantHintRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vendorVariantHintTxt: { fontSize: 11, color: MUTED, fontFamily: F.sans500, marginRight: 4 },
  colorSwatchPreview:   { width: 14, height: 14, borderRadius: 7 },

  selectedVendorPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: DARK, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, maxWidth: 140 },
  selectedVendorPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SAGE },
  selectedVendorPillTxt: { fontSize: 11, color: BEIGE_BG, fontFamily: F.sans600, flex: 1 },

  vendorSummaryStrip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: BEIGE_MID, borderRadius: 12, borderWidth: 1, borderColor: BEIGE_BORDER, marginTop: 4, overflow: 'hidden' },
  vendorSummaryItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  vendorSummaryTxt:     { fontSize: 11, color: MUTED, fontFamily: F.sans600, flex: 1 },
  vendorSummaryDivider: { width: 1, backgroundColor: BEIGE_BORDER, height: '60%' as any },

  // ── Variants ──
  variantSection: { marginBottom: 16 },

  sizeChip:            { borderWidth: 1.5, borderColor: BEIGE_BORDER, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginRight: 9, backgroundColor: BEIGE_BG },
  sizeChipSel:         { borderColor: DARK, backgroundColor: DARK },
  sizeChipDisabled:    { borderColor: BEIGE_MID, backgroundColor: BEIGE_MID, opacity: 0.5 },
  sizeChipTxt:         { fontSize: 14, fontFamily: F.sans700, color: DARK_MED },
  sizeChipTxtSel:      { color: BEIGE_BG },
  sizeChipTxtDisabled: { color: BEIGE_BORDER },

  colorSwatchBtn:   { alignItems: 'center', marginRight: 14, gap: 5 },
  colorSwatch:      { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  swatchOutOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  swatchSlash:      { width: 40, height: 2, backgroundColor: '#EF4444', transform: [{ rotate: '45deg' }] },
  colorSwatchLabel: { fontSize: 10, color: MUTED, fontFamily: F.sans500, textAlign: 'center' },

  variantStockHint:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  variantStockHintTxt: { fontSize: 11, color: MUTED, fontFamily: F.sans500 },

  description: { fontSize: 14, color: DARK_MED, lineHeight: 23, letterSpacing: 0.1 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag:         { backgroundColor: BEIGE_MID, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: BEIGE_BORDER },
  tagTxt:      { fontSize: 12, color: DARK_MED, fontFamily: F.sans500 },

  // ── Quantity ──
  qtyStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qtyRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn:      { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: BEIGE_BORDER, justifyContent: 'center', alignItems: 'center', backgroundColor: BEIGE_MID },
  qtyBtnOff:   { borderColor: BEIGE_MID, backgroundColor: BEIGE_BG },
  qtyNum:      { width: 44, textAlign: 'center', fontSize: 20, fontFamily: F.sans800, color: DARK },
  stockBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: BEIGE_MID, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BEIGE_BORDER },
  stockLbl:    { fontSize: 11, color: MUTED, fontFamily: F.sans600 },
  stockQty:    { fontSize: 14, fontFamily: F.sans800, color: DARK },

  // ── Features ──
  featGrid: { gap: 11 },
  featItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center' },
  featTxt:  { fontSize: 14, color: DARK_MED, fontFamily: F.sans500, flex: 1 },

  // ── Reviews ──
  reviewCard: { backgroundColor: BEIGE_MID, borderRadius: 16, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: BEIGE_BORDER },
  reviewHdr:  { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  avatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: DARK, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:  { color: BEIGE_BG, fontFamily: F.sans800, fontSize: 15 },
  reviewName: { fontFamily: F.sans700, color: DARK, marginBottom: 3, fontSize: 13 },
  reviewTxt:  { fontSize: 13, color: DARK_MED, lineHeight: 20 },

  // ── Similar — 2-column grid ──
  simGrid:            { gap: 10 },
  simRow:             { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  simCardWrap:        { width: SIM_CARD_W },
  simCardPlaceholder: { width: SIM_CARD_W },
  simCard:      { width: SIM_CARD_W, backgroundColor: BEIGE_CARD, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BEIGE_BORDER, ...Platform.select({ ios: { shadowColor: DARK, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
  simImgWrap:   { width: SIM_CARD_W, height: SIM_CARD_W, backgroundColor: BEIGE_MID },
  simImg:       { width: SIM_CARD_W, height: SIM_CARD_W },
  simDisc:      { position: 'absolute', top: 8, left: 8, backgroundColor: DARK, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  simDiscTxt:   { color: BEIGE_BG, fontSize: 9, fontFamily: F.sans800 },
  // strip border between image and info area
  simStrip:     { height: 5, backgroundColor: BEIGE_MID, borderBottomWidth: 1, borderBottomColor: BEIGE_BORDER },
  simInfo:      { padding: 10, gap: 4 },
  simName:      { fontSize: 12, fontFamily: F.sans700, color: DARK, lineHeight: 16 },
  simRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  simRatingTxt: { fontSize: 10, color: MUTED, fontFamily: F.sans600 },
  simPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  simPrice:     { fontSize: 14, fontFamily: F.sans800, color: DARK },
  simMrp:       { fontSize: 11, color: MUTED, textDecorationLine: 'line-through' },
  simCat:       { fontSize: 10, color: GOLD, fontFamily: F.sans600 },

  // ── CTA Bar ──
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BEIGE_CARD,
    borderTopWidth: 1, borderTopColor: BEIGE_BORDER,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 14, gap: 14,
  },
  ctaLeft:      { minWidth: 100 },
  ctaLabel:     { fontSize: 10, color: MUTED, fontFamily: F.sans800, textTransform: 'uppercase', letterSpacing: 1.2 },
  ctaPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ctaPrice:     { fontSize: 23, fontFamily: F.sans900, color: DARK, letterSpacing: -0.5 , paddingTop:5},
  ctaDiscBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1, borderColor: BEIGE_BORDER },
  ctaDiscTxt:   { fontSize: 11, fontFamily: F.sans800, color: GOLD },
  ctaMrp:       { fontSize: 11, color: MUTED, textDecorationLine: 'line-through', marginTop: 1 },
  ctaBtnWrap:   { flex: 1 },

  cartBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GOLD, borderRadius: 18, paddingVertical: 17 },
  cartBtnSuccess: { backgroundColor: '#a81229' },
  cartBtnTxt:     { color: '#FFFFFF', fontFamily: F.sans700, fontSize: 16, letterSpacing: 0.2 },

  cartInCartWrap: { gap: 8 },
  cartStepper:    { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD, borderRadius: 16, overflow: 'hidden', height: 50 },
  stepBtn:        { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  stepBtnAdd:     { backgroundColor: 'transparent' },
  stepCount:      { flex: 1, alignItems: 'center' },
  stepCountTxt:   { fontSize: 18, fontFamily: F.sans900, color: '#FFFFFF' },
  stepCountSub:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: F.sans600, marginTop: -1 },

  goToCartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: DARK, borderRadius: 14, paddingVertical: 12 },
  goToCartTxt: { color: '#FFFFFF', fontFamily: F.sans700, fontSize: 14 },
});