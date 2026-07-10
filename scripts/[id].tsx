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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { authenticatedClient } from '@/api/common/client';
import { useCart } from '@/lib/store/cart-store';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.52;
const AUTO_SCROLL_INTERVAL = 3000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review { title: string; content: string; rating: number; images: string[] }
interface Category { id: number; name: string; slug: string }
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
  sellable_inventory: { quantity_remaining: number; address: string };
  attributes: {
    features: string[];
    tags: string[];
    feedback: { reviews: Review[]; summary: any };
    faqs: any[];
  };
  categories: Category[];
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 13 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(rating) ? 'star' : 'star-outline'}
        size={size}
        color={i <= Math.round(rating) ? '#F59E0B' : '#D1D5DB'}
      />
    ))}
  </View>
);

// ─── Size Chip ────────────────────────────────────────────────────────────────
const SizeChip = ({ size, selected, onPress }: { size: string; selected: boolean; onPress: () => void }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={() => {
      scale.value = withSequence(withTiming(0.85, { duration: 70 }), withSpring(1));
      onPress();
    }}>
      <Animated.View style={[st.sizeChip, selected && st.sizeChipSel, animStyle]}>
        <Text style={[st.sizeChipTxt, selected && st.sizeChipTxtSel]}>{size}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── Info Strip Item ──────────────────────────────────────────────────────────
const StripItem = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={st.stripItem}>
    <View style={st.stripIcon}>
      <Ionicons name={icon} size={16} color="#6B7280" />
    </View>
    <Text style={st.stripLabel}>{label}</Text>
    <Text style={st.stripValue}>{value}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  // ── Cart state ──
  const cartItems        = useCart(s => s.cartItems);
  const loadingProductId = useCart(s => s.loadingProductId);
  const addToCart        = useCart(s => s.addToCart);
  const updateQuantity   = useCart(s => s.updateQuantity);
  const removeFromCart   = useCart(s => s.removeFromCart);

  // Find if this product is already in cart
  const cartItem    = cartItems.find(c => c.id === Number(id));
  const cartQty     = cartItem?.quantity ?? 0;
  const isInCart    = cartQty > 0;

  const [product,          setProduct]          = useState<Product | null>(null);
  const [similar,          setSimilar]           = useState<Product[]>([]);
  const [activeImageIndex, setActiveImageIndex]  = useState(0);
  const [selectedSize,     setSelectedSize]      = useState<string | null>(null);
  const [quantity,         setQuantity]          = useState(1);
  const [addedPulse,       setAddedPulse]        = useState(false);
  const [isWishlisted,     setIsWishlisted]      = useState(false);

  const scrollY      = useSharedValue(0);
  const cartBtnScale = useSharedValue(1);
  const heartScale   = useSharedValue(1);
  const imageListRef = useRef<FlatList>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagesRef     = useRef<string[]>([]);

  useEffect(() => { if (id) fetchProduct(); }, [id]);

  // const fetchProduct = async () => {
  //   try {
  //     const res  = await authenticatedClient.get(`api/shop/get_product/${id}/`);
  //     const data: Product = res.data.data;
  //     setProduct(data);
  //     fetchSimilar(data.id);
  //   } catch (e) { console.error('Product fetch error', e); }
  // };

  const fetchProduct = async () => {
    try {
      const res = await authenticatedClient.get(`api/shop/get_product/${id}/`);
      const raw: Product = res.data.data;
  
      // Normalize all nullable numeric fields once, here
      const data: Product = {
        ...raw,
        price: raw.price ?? 0,
        market_price: raw.market_price ?? 0,
        rating: raw.rating ?? '0',
        sellable_inventory: {
          quantity_remaining: raw.sellable_inventory?.quantity_remaining ?? 0,
          address: raw.sellable_inventory?.address ?? '',
        },
        currency: raw.currency ?? { code: 'INR', symbol: '₹' },
        attributes: {
          features: raw.attributes?.features ?? [],
          tags: raw.attributes?.tags ?? [],
          feedback: raw.attributes?.feedback ?? { reviews: [], summary: null },
          faqs: raw.attributes?.faqs ?? [],
        },
        images: raw.images ?? [],
        categories: raw.categories ?? [],
      };
  
      setProduct(data);
      fetchSimilar(data.id);
    } catch (e) { console.error('Product fetch error', e); }
  };

  const fetchSimilar = async (productId: number) => {
    try {
      const res = await authenticatedClient.get(`api/shop/products/${productId}/similar/`);
      setSimilar(res.data || []);
    } catch (e) { console.error('Similar fetch error', e); }
  };

  // Auto-rotate images
  useEffect(() => {
    if (!product) return;
    const imgs = [product.photo, ...(product.images || [])];
    imagesRef.current = imgs;
    if (imgs.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      setActiveImageIndex(prev => {
        const next = (prev + 1) % imagesRef.current.length;
        try { imageListRef.current?.scrollToIndex({ index: next, animated: true }); } catch (_) {}
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [product]);

  const stopAutoScroll = () => {
    if (autoScrollRef.current) { clearInterval(autoScrollRef.current); autoScrollRef.current = null; }
  };

  const onScroll = useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y; } });

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, IMAGE_HEIGHT], [0, -IMAGE_HEIGHT * 0.3], Extrapolate.CLAMP) }],
  }));

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [IMAGE_HEIGHT - 100, IMAGE_HEIGHT - 10], [0, 1], Extrapolate.CLAMP),
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const cartAnimStyle  = useAnimatedStyle(() => ({ transform: [{ scale: cartBtnScale.value }] }));

  // ── Add to cart (first time) ──
  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 90 }), withSpring(1.04), withSpring(1));
    setAddedPulse(true);
    setTimeout(() => setAddedPulse(false), 1400);
    await addToCart(product.id, quantity);
  }, [product, quantity]);

  // ── Increment cart qty ──
  const handleIncrement = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1));
    await addToCart(product.id, cartQty + 1);
  }, [product, cartQty]);

  // ── Decrement — remove if reaching 0 ──
  const handleDecrement = useCallback(async () => {
    if (!product) return;
    cartBtnScale.value = withSequence(withTiming(0.92, { duration: 80 }), withSpring(1));
    if (cartQty <= 1) {
      await removeFromCart(product.id);
    } else {
      await updateQuantity(product.id, cartQty - 1);
    }
  }, [product, cartQty]);

  const handleWishlist = () => {
    heartScale.value = withSequence(withTiming(1.45, { duration: 140 }), withSpring(1));
    setIsWishlisted(w => !w);
  };

  const handleSimilarPress = useCallback((productId: number) => {
    setActiveImageIndex(0); setSelectedSize(null); setQuantity(1); setAddedPulse(false);
    router.push(`/storefront/${productId}`);
  }, [router]);

  if (!product) {
    return (
      <View style={st.loading}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={st.loadingTxt}>Loading…</Text>
      </View>
    );
  }

  const images    = [product.photo, ...(product.images || [])];
  const inventory = product.sellable_inventory?.quantity_remaining ?? 0;
  const onlyFew   = inventory > 0 && inventory <= 10;
  const isLoading = loadingProductId === product.id;
  const discount = (product.market_price > 0 && product.market_price > product.price)
  ? Math.round(((product.market_price - product.price) / product.market_price) * 100)
  : 0;
  const reviews  = product.attributes?.feedback?.reviews?.filter(r => r.content) || [];
  const features = product.attributes?.features || [];
  const tags     = product.attributes?.tags || [];
  const sizes    = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const ratingNum = parseFloat(product.rating || '0');
  const sym       = product.currency.symbol;

  // Android safe bottom — use insets.bottom, with a minimum of 16
  const androidBottom = Math.max(insets.bottom, 16);
  const ctaPaddingBottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : androidBottom;

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Floating Back Button ── */}
      <View style={[st.floatBack, { top: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={st.floatBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Sticky Header ── */}
      <View style={[st.stickyHeader, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, st.stickyHeaderBg, headerBgStyle]} />
        <TouchableOpacity onPress={() => router.back()} style={st.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>
        <Animated.Text style={[st.stickyTitle, headerBgStyle]} numberOfLines={1}>
          {product.product_name}
        </Animated.Text>
        <Animated.View style={[heartAnimStyle, headerBgStyle]}>
          <TouchableOpacity onPress={handleWishlist} style={st.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? '#EF4444' : '#111'} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Main Scroll ── */}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + ctaPaddingBottom }}
      >
        {/* ── Hero Image Carousel ── */}
        <Animated.View style={[{ height: IMAGE_HEIGHT, backgroundColor: '#0E0E0E' }, imageAnimStyle]}>
          <FlatList
            ref={imageListRef}
            data={images}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `img-${i}`}
            onScrollBeginDrag={stopAutoScroll}
            onMomentumScrollEnd={e => {
              setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: IMAGE_HEIGHT }} resizeMode="cover" />
            )}
          />

          {/* FIX: Replace harsh flat overlay with a soft vignette-style gradient.
              Two layered views give a natural bottom fade without the solid dark block. */}
          <View style={st.imgFadeBot} pointerEvents="none" />
          <View style={st.imgFadeBotSoft} pointerEvents="none" />

          {/* Wishlist float — top right */}
          <Animated.View style={[{ position: 'absolute', top: (insets.top) + 8, right: 16, zIndex: 10 }, heartAnimStyle]}>
            <TouchableOpacity onPress={handleWishlist} style={st.floatBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? '#FF4D6D' : '#fff'} />
            </TouchableOpacity>
          </Animated.View>

          {/* Badges */}
          {onlyFew && (
            <Animated.View entering={FadeIn} style={[st.badge, st.badgeFire, { top: insets.top + 56 }]}>
              <Ionicons name="flame" size={12} color="#fff" />
              <Text style={st.badgeTxt}>Only {inventory} left</Text>
            </Animated.View>
          )}
          {discount > 0 && (
            <View style={[st.badge, st.badgeGreen, { top: insets.top + (onlyFew ? 96 : 56) }]}>
              <Text style={st.badgeTxt}>{discount}% OFF</Text>
            </View>
          )}

          {/* Bottom overlays row: counter left, rating right */}
          <View style={st.imgBottomRow} pointerEvents="none">
            <View style={st.pillDark}>
              <Text style={st.pillDarkTxt}>{activeImageIndex + 1} / {images.length}</Text>
            </View>
            <View style={st.pillDark}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={st.pillDarkTxt}>{ratingNum.toFixed(1)}</Text>
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

          {/* Price hero row — prominent at the top */}
          <View style={st.priceHero}>
            <View style={{ flex: 1 }}>
              <View style={st.priceHeroRow}>
                <Text style={st.priceHeroValue}>{sym}{product.price.toLocaleString()}</Text>
                {discount > 0 && (
                  <View style={st.discBadge}>
                    <Text style={st.discBadgeTxt}>{discount}% off</Text>
                  </View>
                )}
              </View>
              {discount > 0 && (
                <Text style={st.priceHeroMrp}>MRP {sym}{product.market_price.toLocaleString()}</Text>
              )}
              {discount > 0 && (
                <Text style={st.priceSaving}>
                  You save {sym}{(product.market_price - product.price).toLocaleString()}
                </Text>
              )}
            </View>
            {/* Stock indicator */}
            <View style={st.stockPill}>
              <View style={[st.stockDot, {
                backgroundColor: inventory > 10 ? '#10B981' : inventory > 0 ? '#F59E0B' : '#EF4444'
              }]} />
              <Text style={st.stockTxt}>
                {inventory > 10 ? 'In Stock' : inventory > 0 ? `${Math.floor(inventory)} left` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Name + SKU */}
          <Text style={st.productName}>{product.product_name}</Text>
          <Text style={st.sku}>SKU: {product.sku}</Text>

          {/* Rating + location row */}
          <View style={st.metaRow}>
            <StarRating rating={ratingNum} />
            <Text style={st.metaBold}>{ratingNum.toFixed(1)}</Text>
            {reviews.length > 0 && <Text style={st.metaDim}>({reviews.length})</Text>}
            <View style={st.metaSep} />
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={st.metaDim} numberOfLines={1}>
              {product.sellable_inventory?.address || 'In Stock'}
            </Text>
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {product.categories.map(c => (
              <View key={c.id} style={st.catChip}>
                <Text style={st.catChipTxt}>{c.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Info strip — 3 quick facts */}
          <View style={st.strip}>
            <StripItem icon="bicycle-outline"  label="Delivery"  value="Free over ₹500" />
            <View style={st.stripDivider} />
            <StripItem icon="shield-checkmark-outline" label="Authentic" value="100% genuine" />
            <View style={st.stripDivider} />
            <StripItem icon="refresh-outline"  label="Returns"   value="7-day easy" />
          </View>

          <View style={st.divider} />

          {/* Description */}
          <Text style={st.secLabel}>DESCRIPTION</Text>
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

          {/* Size selector */}
          <View style={st.secHeader}>
            <Text style={st.secLabel}>SELECT SIZE</Text>
            {selectedSize && (
              <View style={st.selSizeBadge}>
                <Text style={st.selSizeTxt}>{selectedSize}</Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sizes.map(s => (
              <SizeChip key={s} size={s} selected={selectedSize === s} onPress={() => setSelectedSize(s)} />
            ))}
          </ScrollView>
          {!selectedSize && <Text style={st.sizeHint}>↑ Select a size to continue</Text>}

          <View style={st.divider} />

          {/* Quantity row (only shown when NOT in cart — cart has its own qty in CTA) */}
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
                      <Ionicons name="remove" size={18} color={quantity <= 1 ? '#D1D5DB' : '#111'} />
                    </TouchableOpacity>
                    <Animated.Text key={quantity} entering={FadeIn.duration(150)} style={st.qtyNum}>
                      {quantity}
                    </Animated.Text>
                    <TouchableOpacity
                      onPress={() => setQuantity(q => Math.min(q + 1, Math.floor(inventory)))}
                      style={[st.qtyBtn, quantity >= Math.floor(inventory) && st.qtyBtnOff]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={18} color={quantity >= Math.floor(inventory) ? '#D1D5DB' : '#111'} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Compact stock display */}
                <View style={st.stockBox}>
                  <View style={[st.stockDot, {
                    backgroundColor: inventory > 10 ? '#10B981' : inventory > 0 ? '#F59E0B' : '#EF4444'
                  }]} />
                  <View>
                    <Text style={st.stockLbl}>In Stock</Text>
                    <Text style={st.stockQty}>{Math.floor(inventory)} units</Text>
                  </View>
                </View>
              </View>
              <View style={st.divider} />
            </>
          )}

          {/* Features */}
          {features.length > 0 && (
            <>
              <Text style={st.secLabel}>FEATURES</Text>
              <View style={st.featGrid}>
                {features.map((f, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 60)} style={st.featItem}>
                    <View style={st.featIcon}>
                      <Ionicons name="checkmark" size={13} color="#10B981" />
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
                <Animated.View key={i} entering={SlideInRight.delay(i * 60)} style={st.reviewCard}>
                  <View style={st.reviewHdr}>
                    <View style={st.avatar}>
                      <Text style={st.avatarTxt}>{(r.title || 'U')[0].toUpperCase()}</Text>
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
              <Text style={st.secLabel}>SIMILAR PRODUCTS</Text>
              <FlatList
                horizontal
                data={similar}
                keyExtractor={(item, i) => `sim-${item.id}-${i}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 4 }}
                renderItem={({ item, index }) => {
                  const sd = (item.market_price > 0 && item.market_price > item.price)
                    ? Math.round(((item.market_price - item.price) / item.market_price) * 100)
                    : 0;
                  return (
                    <Animated.View entering={FadeInDown.delay(index * 80)}>
                      <TouchableOpacity style={st.simCard} onPress={() => handleSimilarPress(item.id)} activeOpacity={0.88}>
                        <View style={st.simImgWrap}>
                          <Image source={{ uri: item.photo }} style={st.simImg} resizeMode="cover" />
                          {sd > 0 && (
                            <View style={st.simDisc}>
                              <Text style={st.simDiscTxt}>{sd}% OFF</Text>
                            </View>
                          )}
                        </View>
                        <View style={st.simInfo}>
                          <Text style={st.simName} numberOfLines={2}>{item.product_name}</Text>
                          <View style={st.simRatingRow}>
                            <StarRating rating={parseFloat(item.rating || '0')} size={10} />
                            <Text style={st.simRatingTxt}>{parseFloat(item.rating || '0').toFixed(1)}</Text>
                          </View>
                          <View style={st.simPriceRow}>
                          <Text style={st.simPrice}>{item.currency.symbol}{(item.price ?? 0).toFixed(0)}</Text>
                            {sd > 0 && (
                              <Text style={st.simMrp}>{item.currency.symbol}{(item.market_price ?? 0).toFixed(0)}</Text>
                            )}
                          </View>
                          {item.categories?.[0] && (
                            <Text style={st.simCat} numberOfLines={1}>{item.categories[0].name}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
              />
            </>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* ══════════════════════════════════════════════════════════════
          STICKY CTA BAR
          FIX: Use insets.bottom from useSafeAreaInsets() for paddingBottom.
          This correctly handles Android gesture nav bar AND iOS home indicator.
          DO NOT use hardcoded values or Platform.OS checks for bottom padding.
      ══════════════════════════════════════════════════════════════ */}
      <View style={[st.ctaBar, { paddingBottom: ctaPaddingBottom }]}>
        {/* Price side */}
        <View style={st.ctaLeft}>
          <Text style={st.ctaLabel}>TOTAL</Text>
          <View style={st.ctaPriceRow}>
            <Text style={st.ctaPrice}>
            {sym}{((product.price ?? 0) * (isInCart ? cartQty : quantity)).toFixed(2)}
            </Text>
            {discount > 0 && (
              <View style={st.ctaDiscBadge}>
                <Text style={st.ctaDiscTxt}>{discount}%</Text>
              </View>
            )}
          </View>
          {discount > 0 && (
            <Text style={st.ctaMrp}>
              MRP {sym}{((product.market_price ?? 0) * (isInCart ? cartQty : quantity)).toFixed(0)}
            </Text>
          )}
        </View>

        {/* CTA button — smart: shows -qty+ if in cart, else Add to Cart */}
        <Animated.View style={[st.ctaBtnWrap, cartAnimStyle]}>
          {isInCart ? (
            /* ── In-cart stepper ── */
            <View style={st.cartStepper}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={st.stepBtn}
                activeOpacity={0.75}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="remove" size={20} color="#fff" />}
              </TouchableOpacity>

              <View style={st.stepCount}>
                <Text style={st.stepCountTxt}>{cartQty}</Text>
                <Text style={st.stepCountSub}>in cart</Text>
              </View>

              <TouchableOpacity
                onPress={handleIncrement}
                style={[st.stepBtn, st.stepBtnAdd]}
                activeOpacity={0.75}
                disabled={isLoading || cartQty >= Math.floor(inventory)}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={cartQty >= Math.floor(inventory) ? 'rgba(255,255,255,0.4)' : '#fff'}
                />
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Add to cart button ── */
            <TouchableOpacity
              onPress={handleAddToCart}
              style={[st.cartBtn, addedPulse && st.cartBtnSuccess]}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : addedPulse ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={st.cartBtnTxt}>Added!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="bag-add-outline" size={20} color="#fff" />
                  <Text style={st.cartBtnTxt}>Add to Cart · {quantity}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// TOP_INSET only used as a fallback default — actual value comes from useSafeAreaInsets()
const TOP_INSET = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24) + 4;

const st = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F3F4F6' },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingTxt: { marginTop: 12, color: '#6B7280', fontSize: 15 },

  // ── Sticky header
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
  },
  stickyHeaderBg: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stickyTitle:    { flex: 1, marginHorizontal: 10, fontWeight: '700', fontSize: 16, color: '#111', letterSpacing: -0.3 },
  headerBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(243,244,246,0.95)', justifyContent: 'center', alignItems: 'center' },

  // ── Floating buttons
  floatBack: { position: 'absolute', left: 14, zIndex: 101 },
  floatBtn:  {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  // ── Image overlays — two soft layers instead of solid block
  // Layer 1: tall soft fade from transparent to semi-dark
  imgFadeBot: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
    // Simulated gradient using opacity layers
    backgroundColor: 'rgba(0,0,0,0.0)',
    // We stack two views to fake a gradient effect
  },
  // Layer 2: stronger near the bottom edge only
  imgFadeBotSoft: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  // Badges
  badge:      { position: 'absolute', left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeFire:  { backgroundColor: '#EF4444' },
  badgeGreen: { backgroundColor: '#059669' },
  badgeTxt:   { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Counter + rating pills at bottom
  imgBottomRow: { position: 'absolute', bottom: 46, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  pillDark:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.48)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  pillDarkTxt:  { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Dots
  dotsRow:  { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  dot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)', marginHorizontal: 3 },
  dotActive:{ width: 18, backgroundColor: '#fff' },

  // ── Info card
  infoCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    marginTop: -28, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 5,
  },

  // Price hero — shown at top of card, most prominent
  priceHero:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  priceHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  priceHeroValue:{ fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -0.8 },
  discBadge:    { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discBadgeTxt: { fontSize: 12, fontWeight: '800', color: '#059669' },
  priceHeroMrp: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through', marginTop: 2 },
  priceSaving:  { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 2 },

  stockPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: '#F3F4F6', marginLeft: 'auto' },
  stockDot:     { width: 8, height: 8, borderRadius: 4 },
  stockTxt:     { fontSize: 12, fontWeight: '600', color: '#374151' },

  productName: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5, marginBottom: 3 },
  sku:         { fontSize: 11, color: '#9CA3AF', marginBottom: 10, letterSpacing: 0.5 },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  metaBold: { fontSize: 13, fontWeight: '700', color: '#374151' },
  metaDim:  { fontSize: 13, color: '#6B7280' },
  metaSep:  { width: 1, height: 12, backgroundColor: '#E5E7EB' },

  catChip:    { backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginRight: 7 },
  catChipTxt: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },

  // Info strip — 3 columns
  strip:        { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', marginBottom: 4 },
  stripItem:    { flex: 1, alignItems: 'center', paddingVertical: 13, gap: 4 },
  stripIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  stripLabel:   { fontSize: 10, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.3 },
  stripValue:   { fontSize: 11, color: '#374151', fontWeight: '700', textAlign: 'center' },
  stripDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 18 },

  secLabel:  { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 11 },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selSizeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  selSizeTxt:   { fontSize: 13, fontWeight: '700', color: '#111' },

  description: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  tag:     { backgroundColor: '#F3F4F6', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
  tagTxt:  { fontSize: 12, color: '#374151', fontWeight: '500' },

  sizeChip:    { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 11, paddingHorizontal: 18, paddingVertical: 11, marginRight: 9, backgroundColor: '#fff' },
  sizeChipSel: { borderColor: '#111', backgroundColor: '#111' },
  sizeChipTxt: { fontSize: 14, fontWeight: '700', color: '#374151' },
  sizeChipTxtSel: { color: '#fff' },
  sizeHint:    { fontSize: 11, color: '#EF4444', marginTop: 6 },

  qtyStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qtyRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyBtn:      { width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  qtyBtnOff:   { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  qtyNum:      { width: 44, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#111' },

  stockBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  stockLbl:  { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  stockQty:  { fontSize: 14, fontWeight: '800', color: '#111' },

  featGrid: { gap: 10 },
  featItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  featTxt:  { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },

  reviewCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  reviewHdr:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  avatarTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },
  reviewName: { fontWeight: '700', color: '#111', marginBottom: 3, fontSize: 13 },
  reviewTxt:  { fontSize: 13, color: '#4B5563', lineHeight: 20 },

  simCard:    { width: 165, marginRight: 13, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  simImgWrap: { width: 165, height: 155, backgroundColor: '#F3F4F6' },
  simImg:     { width: 165, height: 155 },
  simDisc:    { position: 'absolute', top: 8, right: 8, backgroundColor: '#059669', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  simDiscTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  simInfo:    { padding: 10, gap: 4 },
  simName:    { fontSize: 13, fontWeight: '700', color: '#111', lineHeight: 17 },
  simRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  simRatingTxt: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  simPriceRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  simPrice:     { fontSize: 15, fontWeight: '800', color: '#111' },
  simMrp:       { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  simCat:       { fontSize: 10, color: '#3B82F6', fontWeight: '600' },

  // ── CTA Bar ──
  // paddingBottom is set inline from useSafeAreaInsets — never hardcoded
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 12, gap: 14,
    // No elevation — would block touches above it
  },
  ctaLeft:     { minWidth: 95 },
  ctaLabel:    { fontSize: 10, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  ctaPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctaPrice:    { fontSize: 22, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  ctaDiscBadge:{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ctaDiscTxt:  { fontSize: 11, fontWeight: '800', color: '#059669' },
  ctaMrp:      { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through', marginTop: 1 },
  ctaBtnWrap:  { flex: 1 },

  // Add to cart button
  cartBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111', borderRadius: 16, paddingVertical: 16 },
  cartBtnSuccess: { backgroundColor: '#059669' },
  cartBtnTxt:     { color: '#fff', fontWeight: '700', fontSize: 16 },

  // In-cart stepper
  cartStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', height: 52 },
  stepBtn:     { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  stepBtnAdd:  { backgroundColor: '#111' },
  stepCount:   { flex: 1, alignItems: 'center' },
  stepCountTxt:{ fontSize: 20, fontWeight: '900', color: '#fff' },
  stepCountSub:{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: -1 },
});
