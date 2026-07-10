/**
 * HomeProductRail — v12 (Premium Edition)
 *
 * Changes from v11:
 * - BIGGER images: aspect ratio bumped to 1.15× card width
 * - Bottom sheet variant picker (Flipkart/Swiggy style) — opens on "Add" tap when variants exist
 * - Direct add-to-cart (no sheet) when no variants
 * - Premium beige background: #F0EDE6
 * - Tighter card gap (6px), zero horizontal padding waste — cards stretch to fill screen
 * - Reduced text/detail area — name 2 lines, price only, no desc clutter below image
 * - White inset frame preserved, slightly thinner (6px) to give more image room
 */

import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Animated,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

import { Image, Text } from '@/components/ui';
import { F } from '@/lib/fonts';
import { Heart } from '@/components/ui/icons';
import { authenticatedClient } from '@/api/common/client';
import { useCart, type GuestProductSnapshot } from '@/lib/store/cart-store';
import { useAuth } from '@/hooks/useAuth';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  white:        '#FFFFFF',
  bg:           '#FFF5F7',          // light red — Chinese Corner brand
  cardBg:       '#FFFFFF',          // card face — clean white
  black:        '#0D0D0D',
  grey:         '#8A8A8A',
  greyLight:    '#D4D0C9',
  greyBorder:   '#FFD5D8',          // warm red border
  orange:       '#C41230',
  orangeBg:     '#FFF0F3',
  orangeBorder: '#FFD5D8',
  green:        '#1E8B00',
  greenBg:      '#EBF7E6',
  red:          '#EF4444',
  star:         '#F59E0B',
  sheetBg:      '#FFFFFF',
  overlay:      'rgba(0,0,0,0.52)',
  cardRadius:   14,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type VariationOption = {
  option_id:    number;
  option_name:  string;
  option_value: string;
  variant_id:   number;
  meta?:        { color_hex?: string };
};
type AvailableVariation = {
  type_id:   number;
  type_name: string;
  type_slug: string;
  options:   VariationOption[];
};
type Variant = {
  id:                number;
  sku:               string;
  price:             number;
  market_price:      number;
  photo:             string;
  images:            string[];
  variation_options: { option_id: number; option_name: string; type_name: string }[];
};
type Product = {
  id:                   number;
  name:                 string;
  slug:                 string;
  description?:         string;
  price:                string;
  mrp?:                 string;
  market_price?:        string;
  discount_percent?:    number;
  image_url:            string;
  images?:              string[];
  has_variation:        boolean;
  variants:             Variant[];
  available_variations: AvailableVariation[];
  rating?:              number;
  rating_count?:        number;
  attributes?: {
    meta?: { food_type?: string };
    [key: string]: any;
  };
};
type FeaturedCategory = {
  id:           number;
  name:         string;
  description?: string;
  image_url?:   string;
  banner_image?: string;
  currency:     { code: string; symbol: string };
  products:     Product[];
};
type Props = {
  title?:        string;
  products:      { data: FeaturedCategory[] };
  primaryColor?: string;
  showSeeAll?:   boolean;
};

// ─── Card dimension constants ─────────────────────────────────────────────────
const PLUS_BTN_SIZE = 36;
const CARD_IMG_H    = 140;

// ─── Variant state hook ───────────────────────────────────────────────────────
function useVariantState(product: Product) {
  const [selected, setSelected] = React.useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const v of product.available_variations) {
      if (v.options.length > 0) init[v.type_id] = v.options[0].option_id;
    }
    return init;
  });

  const pick = React.useCallback((typeId: number, optionId: number) => {
    setSelected(prev => ({ ...prev, [typeId]: optionId }));
  }, []);

  const matched = React.useMemo<Variant | null>(() => {
    if (!product.has_variation || !product.variants.length) return null;
    const ids = Object.values(selected);
    return (
      product.variants.find(v => {
        const s = new Set(v.variation_options.map(o => o.option_id));
        return ids.every(id => s.has(id));
      }) ?? product.variants[0] ?? null
    );
  }, [product, selected]);

  const activeImage = matched ? (matched.photo || matched.images?.[0] || product.image_url) : product.image_url;
  const activePrice = matched ? matched.price        : parseFloat(product.price);
  const activeMrp   = matched ? matched.market_price : parseFloat(product.mrp ?? product.market_price ?? product.price);
  const cartId      = matched ? matched.id           : product.id;

  return { selected, pick, activeImage, activePrice, activeMrp, cartId };
}

// ─── Discount badge ───────────────────────────────────────────────────────────
function DiscountBadge({ disc }: { disc: number }) {
  if (disc <= 0) return null;
  return (
    <View style={db.badge} pointerEvents="none">
      <Text style={db.txt}>{disc.toFixed(0)}% off</Text>
    </View>
  );
}
const db = StyleSheet.create({
  badge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: T.orange, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 3, zIndex: 10,
    ...Platform.select({
      ios:     { shadowColor: T.orange, shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  txt: { color: T.white, fontSize: 9, fontFamily: F.sans800, letterSpacing: 0.2 },
});

// ─── Price block ──────────────────────────────────────────────────────────────
function PriceBlock({ price, mrp, disc, sym }: {
  price: number; mrp: number; disc: number; sym: string;
}) {
  const hasMrp = mrp > price && disc > 0;
  return (
    <View style={pb.root}>
      <Text style={pb.price}>{sym}{price.toFixed(0)}</Text>
      {hasMrp && (
        <>
          <Text style={pb.mrp}>{sym}{mrp.toFixed(0)}</Text>
          <View style={pb.chip}><Text style={pb.chipTxt}>{disc.toFixed(0)}% off</Text></View>
        </>
      )}
    </View>
  );
}
const pb = StyleSheet.create({
  root:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  price:   { fontSize: 13, fontFamily: F.sans900, color: T.black, letterSpacing: -0.3 },
  mrp:     { fontSize: 10, color: T.grey, textDecorationLine: 'line-through', fontFamily: F.sans500 },
  chip:    { backgroundColor: T.orangeBg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  chipTxt: { color: T.orange, fontSize: 8.5, fontFamily: F.sans800 },
});

// ─── Star rating (compact) ────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  if (!rating) return null;
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.4;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={sr.row}>
      {Array.from({ length: full  }).map((_, i) => <Text key={`f${i}`} style={sr.star}>★</Text>)}
      {half && <Text style={[sr.star, { opacity: 0.5 }]}>★</Text>}
      {Array.from({ length: empty }).map((_, i) => <Text key={`e${i}`} style={[sr.star, sr.empty]}>★</Text>)}
      <Text style={sr.num}>{rating.toFixed(1)}</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 1, marginTop: 3 },
  star:  { fontSize: 9, color: T.star, lineHeight: 12 },
  empty: { color: '#D1D5DB' },
  num:   { fontSize: 8.5, color: T.black, fontWeight: '700', marginLeft: 2 },
});

// ─── Compact inline stepper (for image overlay + variant rows) ───────────────
function InlineStepper({ id, qty, loading, onAdd, onRemove }: {
  id: number; qty: number; loading: boolean;
  onAdd: () => void; onRemove: () => void;
}) {
  return (
    <View style={is.wrap}>
      <Pressable onPress={onRemove} hitSlop={6} style={is.btn}>
        <Text style={is.sym}>−</Text>
      </Pressable>
      <View style={is.center}>
        {loading
          ? <ActivityIndicator color={T.white} size="small" />
          : <Text style={is.qty}>{qty}</Text>}
      </View>
      <Pressable onPress={onAdd} hitSlop={6} style={is.btn}>
        <Text style={is.sym}>+</Text>
      </Pressable>
    </View>
  );
}
const is = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.orange, borderRadius: 9,
    overflow: 'hidden',
    height: PLUS_BTN_SIZE, width: PLUS_BTN_SIZE * 2.8,
  },
  btn:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sym:    { color: T.white, fontSize: 16, fontFamily: F.sans700 },
  qty:    { color: T.white, fontSize: 12, fontFamily: F.sans900 },
});

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT BOTTOM SHEET — row-per-variant style
// ─────────────────────────────────────────────────────────────────────────────
type VariantSheetProps = {
  visible:   boolean;
  product:   Product;
  category:  FeaturedCategory;
  onClose:   () => void;
  onConfirm: (variantId: number, qty: number, snap: GuestProductSnapshot) => void;
  cartQty:   (id: number) => number;
  cartLoading: (id: number) => boolean;
};

function VariantBottomSheet({
  visible, product, category, onClose, onConfirm, cartQty, cartLoading,
}: VariantSheetProps) {
  const slideAnim = React.useRef(new Animated.Value(500)).current;
  const sym = category.currency.symbol;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, speed: 18, bounciness: 3,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleVariantQty = (variant: Variant, newQty: number) => {
    onConfirm(variant.id, newQty, {
      product_name:       product.name,
      final_price:        variant.price,
      original_price:     variant.market_price,
      photo:              variant.photo || variant.images?.[0] || product.image_url,
      quantity_remaining: undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={bs.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[bs.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle bar */}
        <View style={bs.handle} />

        {/* Sheet title */}
        <View style={bs.titleRow}>
          <Text style={bs.titleTxt}>Choose Variant</Text>
          <Pressable onPress={onClose} hitSlop={12} style={bs.closeBtn}>
            <Text style={bs.closeTxt}>✕</Text>
          </Pressable>
        </View>

        <View style={bs.divider} />

        {/* Product name + description */}
        <View style={bs.productHeader}>
          <Text style={bs.productName} numberOfLines={2}>{product.name}</Text>
          {!!product.description && (
            <Text style={bs.productDesc} numberOfLines={3}>{product.description}</Text>
          )}
        </View>

        <View style={bs.divider} />

        {/* Variant rows — one per variant */}
        <ScrollView
          style={bs.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}>
          {product.variants.map((variant, idx) => {
            const label   = variant.variation_options.map(o => o.option_name).join(' / ');
            const price   = variant.price;
            const mrp     = variant.market_price;
            const disc    = mrp > price ? Math.round((mrp - price) / mrp * 100) : 0;
            const imgSrc  = variant.photo || variant.images?.[0] || product.image_url;
            const qty     = cartQty(variant.id);
            const loading = cartLoading(variant.id);

            return (
              <React.Fragment key={variant.id}>
                {idx > 0 && <View style={bs.rowDivider} />}
                <View style={bs.varRow}>
                  {/* Thumbnail */}
                  <Image
                    source={{ uri: imgSrc }}
                    style={bs.varImg}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={String(variant.id)}
                    allowDownscaling
                    transition={120}
                  />

                  {/* Label + price */}
                  <View style={bs.varInfo}>
                    <Text style={bs.varLabel} numberOfLines={2}>
                      {label || variant.sku}
                    </Text>
                    <View style={bs.varPriceRow}>
                      <Text style={bs.varPrice}>{sym}{price.toFixed(0)}</Text>
                      {disc > 0 && (
                        <>
                          <Text style={bs.varMrp}>{sym}{mrp.toFixed(0)}</Text>
                          <View style={bs.varDiscChip}>
                            <Text style={bs.varDiscTxt}>{disc}% off</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Add / stepper */}
                  {qty > 0 ? (
                    <InlineStepper
                      id={variant.id}
                      qty={qty}
                      loading={loading}
                      onAdd={() => handleVariantQty(variant, qty + 1)}
                      onRemove={() => handleVariantQty(variant, qty - 1)}
                    />
                  ) : (
                    <Pressable
                      onPress={() => handleVariantQty(variant, 1)}
                      disabled={loading}
                      style={({ pressed }) => [bs.varAddBtn, { opacity: pressed ? 0.75 : 1 }]}>
                      {loading
                        ? <ActivityIndicator color={T.orange} size="small" />
                        : <Text style={bs.varAddTxt}>+ Add</Text>}
                    </Pressable>
                  )}
                </View>
              </React.Fragment>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const bs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: T.overlay },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.sheetBg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '75%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: T.greyLight,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  titleTxt:   { fontSize: 15, fontFamily: F.display700, color: T.black, letterSpacing: -0.2 },
  closeBtn:   { width: 28, height: 28, borderRadius: 14, backgroundColor: T.greyBorder, alignItems: 'center', justifyContent: 'center' },
  closeTxt:   { fontSize: 11, color: T.grey, fontWeight: '700' },
  divider:    { height: StyleSheet.hairlineWidth, backgroundColor: T.greyBorder },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: T.greyBorder, marginHorizontal: 18 },
  productHeader: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 5,
  },
  productName: {
    fontSize: 15,
    fontFamily: F.sans800,
    color: T.black,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  productDesc: {
    fontSize: 12,
    fontFamily: F.sans400,
    color: T.grey,
    lineHeight: 18,
  },
  scroll:     { flexGrow: 0, maxHeight: 420 },
  // Variant row
  varRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  varImg:      { width: 62, height: 62, borderRadius: 10, backgroundColor: '#FFF0F3' },
  varInfo:     { flex: 1, gap: 5 },
  varLabel:    { fontSize: 12.5, fontFamily: F.sans700, color: T.black, lineHeight: 17 },
  varPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  varPrice:    { fontSize: 13, fontFamily: F.sans900, color: T.black },
  varMrp:      { fontSize: 10, color: T.grey, textDecorationLine: 'line-through', fontFamily: F.sans500 },
  varDiscChip: { backgroundColor: T.orangeBg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  varDiscTxt:  { color: T.orange, fontSize: 8.5, fontFamily: F.sans800 },
  varAddBtn: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: T.orange, backgroundColor: T.white,
    alignItems: 'center', justifyContent: 'center', minWidth: 68,
  },
  varAddTxt: { color: T.orange, fontSize: 12, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD — bigger image, leaner body
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({
  product, category, primaryColor,
  isFav, heartLoading, cartQty, cartLoading,
  onFavourite, onPress, addToCart, showWishlist,
}: {
  product: Product; category: FeaturedCategory;
  primaryColor: string; isFav: boolean; heartLoading: boolean;
  cartQty: (id: number) => number; cartLoading: (id: number) => boolean;
  onFavourite: () => void; onPress: () => void;
  addToCart: (id: number, qty: number, snapshot?: GuestProductSnapshot) => void;
  showWishlist: boolean;
}) {
  const { activeImage, activePrice, activeMrp, cartId } = useVariantState(product);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const hasVars = product.has_variation && product.available_variations.length > 0;

  const disc = product.discount_percent
    ?? (activeMrp > activePrice ? Math.round((activeMrp - activePrice) / activeMrp * 100) : 0);
  const sym  = category.currency.symbol;
  const qty  = cartQty(cartId);
  const loading = cartLoading(cartId);

  const addDirect = (id: number, newQty: number) => {
    addToCart(id, newQty, {
      product_name:    product.name,
      final_price:     activePrice,
      original_price:  activeMrp,
      photo:           activeImage,
      quantity_remaining: undefined,
    });
  };

  const handleAddPress = () => {
    if (hasVars) {
      setSheetOpen(true);
    } else {
      addDirect(cartId, qty + 1);
    }
  };

  const scale   = React.useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 60, bounciness: 2 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 60, bounciness: 2 }).start();

  return (
    <>
      <Animated.View style={[card.outer, { transform: [{ scale }] }]}>

        {/* Image — fixed height, clips to rounded corners */}
        <View style={card.imgWrap}>
          <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={{ flex: 1 }}>
            <View style={card.imgInner}>
              <Image
                source={{ uri: activeImage }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={String(product.id)}
                allowDownscaling
                transition={150}
              />
            </View>
          </Pressable>

          <DiscountBadge disc={disc} />

          {/* Wishlist — only for logged-in users */}
          {showWishlist && (
            <Pressable onPress={onFavourite} hitSlop={12} style={card.heart}>
              {heartLoading
                ? <ActivityIndicator color={primaryColor} size="small" />
                : <Heart color={isFav ? T.red : '#BBBBBB'} filled={isFav} width={13} height={13} />}
            </Pressable>
          )}
        </View>

        {/* Body — name + description + price */}
        <View style={card.body}>
          <Pressable onPress={onPress}>
            <Text style={card.name} numberOfLines={2}>{product.name}</Text>
            {!!product.description && (
              <View style={{ marginTop: 4 }}>
                <Text style={card.desc} numberOfLines={2}>{product.description}</Text>
                <Text style={card.readMore}>...read more</Text>
              </View>
            )}
            <View style={{ marginTop: 5 }}>
              <PriceBlock price={activePrice} mrp={activeMrp} disc={disc} sym={sym} />
            </View>
          </Pressable>
        </View>

        {/* Veg / Non-Veg indicator — left side, same level as + button */}
        <View
          style={[card.foodTypeAbs, { top: CARD_IMG_H - PLUS_BTN_SIZE / 2 + (PLUS_BTN_SIZE - 16) / 2 + 8 }]}
          pointerEvents="none"
        >
          <FoodTypeIcon foodType={product.attributes?.meta?.food_type} />
        </View>

        {/* ── Cart control rendered LAST so it always paints on top ── */}
        <View
          style={[card.plusAbs, { top: CARD_IMG_H - PLUS_BTN_SIZE / 2 }]}
          pointerEvents="box-none">
          {qty > 0 ? (
            <InlineStepper
              id={cartId}
              qty={qty}
              loading={loading}
              onAdd={() => addDirect(cartId, qty + 1)}
              onRemove={() => addDirect(cartId, qty - 1)}
            />
          ) : (
            <Pressable
              onPress={handleAddPress}
              disabled={loading}
              hitSlop={6}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
              <View style={card.plusBtn}>
                {loading
                  ? <ActivityIndicator color={T.white} size="small" />
                  : <Text style={card.plusTxt}>+</Text>}
              </View>
            </Pressable>
          )}
        </View>

      </Animated.View>

      {/* Bottom sheet — only rendered when needed */}
      {hasVars && (
        <VariantBottomSheet
          visible={sheetOpen}
          product={product}
          category={category}
          onClose={() => setSheetOpen(false)}
          onConfirm={(id, q, snap) => { addToCart(id, q, snap); }}
          cartQty={cartQty}
          cartLoading={cartLoading}
        />
      )}
    </>
  );
}

const card = StyleSheet.create({
  outer: {
    backgroundColor: T.cardBg,
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.greyBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  imgWrap: {
    width: '100%', height: CARD_IMG_H,
    overflow: 'hidden',
    backgroundColor: T.cardBg,
    borderTopLeftRadius: T.cardRadius - 1,
    borderTopRightRadius: T.cardRadius - 1,
    padding: 6,
  },
  imgInner: {
    width: '100%', height: '100%',
    borderRadius: 9, overflow: 'hidden',
    backgroundColor: '#FFF0F3',
  },
  heart: {
    position: 'absolute', top: 12, right: 12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center', justifyContent: 'center', zIndex: 3,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  plusAbs: {
    position: 'absolute',
    right: 10,
    zIndex: 4,
  },
  foodTypeAbs: {
    position: 'absolute',
    left: 10,
    zIndex: 4,
  },
  plusBtn: {
    width: PLUS_BTN_SIZE, height: PLUS_BTN_SIZE, borderRadius: 9,
    backgroundColor: T.orange,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: T.orange, shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 5 },
    }),
  },
  plusTxt: { color: T.white, fontSize: 22, fontFamily: F.sans400, lineHeight: PLUS_BTN_SIZE },
  body: {
    paddingHorizontal: 8,
    paddingTop: PLUS_BTN_SIZE / 2 + 4,
    paddingBottom: 10,
  },
  name: { fontSize: 11.5, fontFamily: F.sans700, color: '#1A1A1A', lineHeight: 15.5, letterSpacing: -0.1 },
  desc: {
    fontSize: 9.5, fontFamily: F.sans400, color: T.grey, lineHeight: 13.5,
  },
  readMore: {
    fontSize: 9, fontFamily: F.sans700, color: T.orange, marginTop: 1,
  },
});

// ─── Food type indicator (FSSAI standard: square border + circle dot) ────────
function FoodTypeIcon({ foodType }: { foodType?: string }) {
  if (!foodType) return null;
  const isVeg = foodType.toLowerCase() === 'veg';
  const color = isVeg ? '#1E8B00' : '#9B1C1C';
  return (
    <View style={[fi.box, { borderColor: color }]}>
      <View style={[fi.dot, { backgroundColor: color }]} />
    </View>
  );
}
const fi = StyleSheet.create({
  box: {
    width: 16, height: 16, borderWidth: 1.5, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.white,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
    }),
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── Masonry split ────────────────────────────────────────────────────────────
function splitMasonry(products: Product[]): { left: Product[]; right: Product[] } {
  const left: Product[]  = [];
  const right: Product[] = [];
  products.forEach((p, i) => (i % 2 === 0 ? left : right).push(p));
  return { left, right };
}

// ─── Category banner — full-width inside card, description only (no title dupe)
function CategoryBanner({
  cat, width, onPress,
}: {
  cat: FeaturedCategory; width: number; onPress: () => void;
}) {
  if (!cat.banner_image) return null;
  const bannerH = Math.round(width * 0.4);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [bn.wrap, { width, height: bannerH, opacity: pressed ? 0.88 : 1 }]}
    >
      <Image
        source={{ uri: cat.banner_image }}
        style={{ width, height: bannerH }}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        allowDownscaling
        transition={150}
      />
    </Pressable>
  );
}
const bn = StyleSheet.create({
  wrap: { overflow: 'hidden' },
});

// ─────────────────────────────────────────────────────────────────────────────
// RAIL SKELETON — shown while featured_categories API is in-flight
// Matches the structure of the real rail so no layout jump occurs.
// ─────────────────────────────────────────────────────────────────────────────
function ProductRailSkeleton() {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 520, useNativeDriver: true, isInteraction: false }),
        Animated.timing(anim, { toValue: 0, duration: 520, useNativeDriver: true, isInteraction: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const op = anim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.62] });

  const S = ({ w, h, r = 8 }: { w: number | `${number}%`; h: number; r?: number }) => (
    <Animated.View
      style={{ width: w as any, height: h, borderRadius: r, backgroundColor: '#E8D5D7', opacity: op }}
    />
  );

  return (
    <View style={{ backgroundColor: T.bg, paddingBottom: 20 }}>
      {/* Rail header */}
      <View style={[rl.railHeader]}>
        <View style={[rl.railAccentBar, { opacity: 0.3 }]} />
        <View style={{ flex: 1, gap: 7 }}>
          <S w={130} h={22} r={6} />
          <S w={170} h={13} r={5} />
        </View>
      </View>

      {/* Category card + masonry */}
      <View style={{ marginHorizontal: 8, marginTop: 18 }}>
        {/* White section card — banner placeholder */}
        <View style={[rl.catCard, { padding: 10, gap: 8 }]}>
          <S w={'55%'} h={20} r={6} />
          <S w={'100%'} h={120} r={10} />
        </View>

        {/* 2-column masonry ghost cards */}
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
          {[0, 1].map(col => (
            <View key={col} style={{ flex: 1, gap: 4 }}>
              {[0, 1, 2].map(row => (
                <View
                  key={row}
                  style={{
                    backgroundColor: T.white,
                    borderRadius: T.cardRadius,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: T.greyBorder,
                  }}
                >
                  <S w={'100%'} h={CARD_IMG_H} r={0} />
                  <View style={{ padding: 8, paddingTop: 22, gap: 6 }}>
                    <S w={'80%'} h={11} r={4} />
                    <S w={'60%'} h={11} r={4} />
                    <S w={'55%'} h={13} r={4} />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PRODUCT RAIL — main export
// ─────────────────────────────────────────────────────────────────────────────
export function HomeProductRail({
  title,
  products,
  primaryColor = T.green,
  showSeeAll   = true,
}: Props) {
  const router = useRouter();
  const { width: W } = useWindowDimensions();

  // Zero wasted space: 8px side padding, 6px gap between columns
  const PAD   = 8;
  const GAP   = 4;

  const { cartItems, addToCart, loadingProductId } = useCart();

  const getQty = React.useCallback(
    (id: number) => {
      const it = cartItems.find((i: any) => Number(i.id) === id);
      return it ? Number(it.quantity) : 0;
    },
    [cartItems],
  );

  const isLoading = React.useCallback(
    (id: number) => loadingProductId === id,
    [loadingProductId],
  );

  const isLoggedIn = useAuth.use.status() === 'signIn';

  const [favIds, setFavIds]   = React.useState<Set<number>>(new Set());
  const [heartId, setHeartId] = React.useState<number | null>(null);

  const handleFav = React.useCallback(async (productId: number) => {
    const pid = Number(productId);
    if (favIds.has(pid)) return;
    setFavIds(prev => new Set(prev).add(pid));
    setHeartId(pid);
    try {
      await authenticatedClient.post('api/shop/addfavourite_products/', { product_id: pid });
    } catch {
      setFavIds(prev => { const n = new Set(prev); n.delete(pid); return n; });
    } finally {
      setHeartId(null);
    }
  }, [favIds]);

  // ── Progressive rendering ─────────────────────────────────────────────────
  // Start with 4 cards per category (2 per column) to avoid a JS-thread freeze
  // when the API resolves. InteractionManager defers the full render until after
  // the first paint + any in-flight animations have settled.
  const dataLength = products?.data?.length ?? 0;

  // If data is already cached (back-nav), start fully expanded immediately.
  const [expanded, setExpanded] = React.useState(() => dataLength > 0);

  React.useEffect(() => {
    if (dataLength === 0) { setExpanded(false); return; }
    if (expanded) return;           // already expanded, nothing to do
    const task = InteractionManager.runAfterInteractions(() => setExpanded(true));
    return () => task.cancel();
  }, [dataLength]);               // runs once when data first arrives

  // ── Loading / empty guard ─────────────────────────────────────────────────
  const queryLoading = (products as any)?.isLoading ?? false;

  if (!products?.data?.length) {
    // Show skeleton while in-flight; hide silently on error or truly empty
    return queryLoading ? <ProductRailSkeleton /> : null;
  }

  return (
    <View style={rl.root}>

      {/* ── Premium section header ─────────────────────────────────────── */}
      <View style={rl.railHeader}>
        {/* Left accent bar */}
        <View style={rl.railAccentBar} />
        <View style={rl.railTitleBlock}>
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value={title ?? 'Featured Deals'}
            style={rl.railTitle}
          />
          <TextInput
            editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
            value="🥢  Chinese Corner Favourites"
            style={rl.railSubtitle}
          />
        </View>
        {/* Orange chopstick dot cluster */}
        <View style={rl.dotCluster}>
          {[0,1,2].map(i => (
            <View key={i} style={[rl.dot, i === 1 && rl.dotMid]} />
          ))}
        </View>
      </View>

      {products.data.map((cat: FeaturedCategory) => {
        // Limit to first 4 products until InteractionManager fires (avoids freeze)
        const visibleProducts = expanded ? cat.products : cat.products.slice(0, 4);
        const { left, right } = splitMasonry(visibleProducts);

        const makeCard = (p: Product) => (
          <ProductCard
            key={p.id}
            product={p}
            category={cat}
            primaryColor={primaryColor}
            isFav={favIds.has(Number(p.id))}
            heartLoading={heartId === p.id}
            cartQty={getQty}
            cartLoading={isLoading}
            onFavourite={() => handleFav(p.id)}
            onPress={() => router.push(`/storefront/${p.slug}` as never)}
            addToCart={addToCart}
            showWishlist={isLoggedIn}
          />
        );

        const catCardW = W - PAD * 2; // inner width inside the white card

        return (
          <View key={cat.id ?? cat.name} style={rl.section}>

            {/* ── White card: banner + title/see-all ─────────────────────── */}
            <View style={[rl.catCard, { marginHorizontal: PAD }]}>
              <CategoryBanner
                cat={cat}
                width={catCardW}
                onPress={() => router.push({
                  pathname: '/storefront/categories',
                  params: { categoryId: String(cat.id ?? ''), categoryName: cat.name ?? '' },
                } as never)}
              />

              {/* Section header — title once, see-all */}
              <View style={rl.header}>
                <View style={{ flex: 1, gap: 2 }}>
                  <TextInput
                    editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                    value={cat.name}
                    style={rl.sectionTitle}
                  />
                  {!!cat.description && (
                    <TextInput
                      editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                      value={cat.description}
                      style={rl.sectionDesc}
                      numberOfLines={1}
                    />
                  )}
                </View>
                {showSeeAll && (
                  <Pressable
                    onPress={() => router.push({
                      pathname: '/storefront/categories',
                      params: { categoryId: String(cat.id ?? ''), categoryName: cat.name ?? '' },
                    } as never)}
                    style={rl.seeAllBtn}>
                    <TextInput
                      editable={false} caretHidden selectTextOnFocus={false} contextMenuHidden
                      value="See all →"
                      style={rl.seeAllTxt}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* 2-column masonry — flush to edges */}
            <View style={[rl.masonry, { paddingHorizontal: PAD, gap: GAP, marginTop: 8 }]}>
              <View style={[rl.col, { gap: GAP }]}>
                {left.map(p => makeCard(p))}
              </View>
              <View style={[rl.col, { gap: GAP }]}>
                {right.map(p => makeCard(p))}
              </View>
            </View>

            <View style={{ height: 14 }} />
          </View>
        );
      })}
    </View>
  );
}

const rl = StyleSheet.create({
  root:         { backgroundColor: T.bg },

  // ── Premium rail header ──────────────────────────────────────────────────────
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD5D8',
  },
  railAccentBar: {
    width: 4, height: 40,
    backgroundColor: T.orange, borderRadius: 2,
    ...Platform.select({
      ios: { shadowColor: T.orange, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
      android: { elevation: 3 },
    }),
  },
  railTitleBlock: { flex: 1, gap: 2 },
  railTitle: {
    fontSize: 22, fontFamily: F.display900, color: '#1A1A1A', letterSpacing: -0.4,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 30,
  },
  railSubtitle: {
    fontSize: 10.5, fontFamily: F.sans600, color: T.orange, letterSpacing: 0.5,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },
  dotCluster: { gap: 3, alignItems: 'center' },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: T.orange, opacity: 0.4,
  },
  dotMid: { opacity: 1, width: 8, height: 8, borderRadius: 4 },
  // ────────────────────────────────────────────────────────────────────────────

  section:      { backgroundColor: T.bg, paddingTop: 0, marginTop: 18 },
  catCard: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: T.white,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  header:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, marginBottom: 10, marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18, fontFamily: F.display900, color: '#1A1A1A', letterSpacing: -0.3,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 26,
  },
  sectionDesc: {
    fontSize: 11, fontFamily: F.sans500, color: T.grey,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 16,
  },
  seeAllBtn:    {
    paddingVertical: 5, paddingHorizontal: 12,
    backgroundColor: T.orange, borderRadius: 20,
  },
  seeAllTxt:    {
    fontSize: 11, fontFamily: F.sans700, color: T.white, letterSpacing: 0.3,
    padding: 0, margin: 0, backgroundColor: 'transparent', height: 15,
  },
  masonry:      { flexDirection: 'row', alignItems: 'flex-start' },
  col:          { flex: 1 },
});