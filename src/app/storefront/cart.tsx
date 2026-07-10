import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AuthSheet } from '@/components/AuthForm';
import { DrawerMenu } from '@/components/drawer-menu';
import { StorefrontHeaderWrapper } from '@/components/storefront/StorefrontHeaderWrapper';
import { AddressFlowModal, type SelectedDeliveryAddress } from '@/components/address-flow-modal';
import { useCart } from '@/lib/store/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/lib/tenant';
import { showMessage } from 'react-native-flash-message';
import { authenticatedClient } from '@/api/common/client';
import { F } from '@/lib/fonts';

// ── Payment layer imports ──────────────────────────────────────────────────────
import { initiateCheckoutV2, confirmPaymentSuccess } from '@/api/payments/payment-api';
import { openPaymentGateway } from '@/lib/payments/payment-gateway';
// ─────────────────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const DELIVERY_TYPE = 'EXPRESS_DELIVERY';

// ── Design tokens ─────────────────────────────────────────────────────────────
const RED           = '#C41230';
const RED_LIGHT     = 'rgba(196,18,48,0.12)';
const RED_BORDER    = 'rgba(196,18,48,0.35)';
const BLACK         = '#0C0C0C';
const DARK          = '#1C1C1C';
const SURFACE       = '#181818';
const BG            = '#0C0C0C';
const MUTED         = 'rgba(255,255,255,0.40)';
const MUTED_BG      = '#222222';
const BORDER        = 'rgba(255,255,255,0.08)';
const GREEN         = '#22C55E';
const GREEN_LIGHT   = 'rgba(34,197,94,0.12)';
const GREEN_BORDER  = 'rgba(34,197,94,0.35)';
// ─────────────────────────────────────────────────────────────────────────────

// (Address types are now in @/components/address-flow-modal)

// ══════════════════════════════════════════════════════════════════════════════
// PaymentOptionCard
// ══════════════════════════════════════════════════════════════════════════════
function PaymentOptionCard({
  label, subtitle, icon, selected, onPress,
}: {
  label: string; subtitle: string; icon: string;
  selected: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform:       [{ scale: scale.value }],
    backgroundColor: selected ? RED_LIGHT : MUTED_BG,
    borderColor:     selected ? RED       : BORDER,
    borderWidth:     selected ? 2            : 1.5,
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1);   }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.paymentCard, animStyle]}>
        <View style={[styles.paymentIconCircle, { backgroundColor: selected ? RED : MUTED_BG }]}>
          <Ionicons name={icon as any} size={22} color={selected ? '#fff' : MUTED} />
        </View>
        <Text style={[styles.paymentCardLabel, { color: selected ? RED : BLACK }]}>{label}</Text>
        <Text style={styles.paymentCardSubtitle}>{subtitle}</Text>
        {selected && (
          <Animated.View entering={ZoomIn.duration(180)} style={styles.paymentCheckmark}>
            <Ionicons name="checkmark-circle" size={18} color={RED} />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Cart skeleton ─────────────────────────────────────────────────────────────
function CartSkeleton() {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700 }),
        withTiming(0.4,  { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const S = '#2A2A2A'; // skeleton block colour

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: BG }, animStyle]}>
      {/* Section header bar */}
      <View style={{ height: 52, backgroundColor: DARK, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <View style={{ width: 64, height: 14, borderRadius: 6, backgroundColor: S }} />
        <View style={{ width: 40, height: 20, borderRadius: 10, backgroundColor: S }} />
      </View>

      {/* Cart item rows */}
      {[0, 1, 2].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: 11, padding: 14,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
          backgroundColor: SURFACE }}>
          {/* Image */}
          <View style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: S }} />
          {/* Content */}
          <View style={{ flex: 1, gap: 7, justifyContent: 'center' }}>
            <View style={{ width: '75%', height: 12, borderRadius: 5, backgroundColor: S }} />
            <View style={{ width: '45%', height: 10, borderRadius: 4, backgroundColor: S }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <View style={{ width: 60, height: 16, borderRadius: 5, backgroundColor: S }} />
              <View style={{ width: 88, height: 30, borderRadius: 8, backgroundColor: S }} />
            </View>
          </View>
        </View>
      ))}

      {/* Summary block */}
      <View style={{ backgroundColor: SURFACE, margin: 0, padding: 18, marginTop: 1, gap: 14 }}>
        {[80, 100, 60, 90].map((w, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: w, height: 10, borderRadius: 4, backgroundColor: S }} />
            <View style={{ width: 50, height: 10, borderRadius: 4, backgroundColor: S }} />
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 2 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: 70, height: 14, borderRadius: 5, backgroundColor: S }} />
          <View style={{ width: 70, height: 20, borderRadius: 6, backgroundColor: S }} />
        </View>
      </View>
    </Animated.View>
  );
}

// AddressModal replaced by AddressFlowModal from @/components/address-flow-modal

// ══════════════════════════════════════════════════════════════════════════════
// CartScreen
// ══════════════════════════════════════════════════════════════════════════════
export default function CartScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { tenantConfig }  = useTenant();
  const primaryColor      = tenantConfig?.theme?.colors?.primary ?? RED;

  // Bottom bar total height: paddingTop(14) + button(~52) + paddingBottom
  // Scroll content must clear it completely.
  const bottomBarPaddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0) + 16;
  const bottomBarHeight        = 14 + 52 + bottomBarPaddingBottom; // approx, generously sized

  const {
    cartItems = [],
    finalPrice = 0,
    subTotal   = 0,
    totalItems = 0,
    fetchCart,
    addToCart,
    loadingProductId = null,
    address,
    cartId,
    paymentMethod,
    setAddress,
    setPaymentMethod,
  } = useCart();

  const authStatus = useAuth.use.status();
  const isGuest = authStatus !== 'signIn';

  const [isLoading,          setIsLoading]          = useState(true);
  const [placingOrder,       setPlacingOrder]        = useState(false);
  const [addrModalVisible,   setAddrModalVisible]    = useState(false);
  const [selectedAddress,    setSelectedAddress]     = useState<SelectedDeliveryAddress | null>(null);
  const [deliveryCharge,     setDeliveryCharge]      = useState(0);
  const [authSheetVisible,   setAuthSheetVisible]    = useState(false);
  const [promoCode,          setPromoCode]           = useState('');
  const [applyingPromo,      setApplyingPromo]       = useState(false);

  useEffect(() => { loadCart(); prefetchDeliveryCharge(); }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try { await fetchCart?.(); }
    catch { showMessage({ message: 'Failed to load cart', type: 'danger' }); }
    finally { setIsLoading(false); }
  };

  const prefetchDeliveryCharge = async () => {
    try {
      const res = await authenticatedClient.get('api/account/add_alternative/');
      setDeliveryCharge(res.data?.delivery_charge ?? 0);
    } catch { /* silent */ }
  };

  const handleSelectAddress = (addr: SelectedDeliveryAddress) => {
    setSelectedAddress(addr);
    setAddress({
      fullName: '',
      phone:    addr.mobileNumber ?? '',
      line1:    [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', '),
      city:     '',
      state:    addr.state   ?? '',
      pincode:  addr.zipCode ?? '',
    });
  };

  // ── Place Order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    // Guest users must sign in before placing an order
    if (isGuest) {
      setAuthSheetVisible(true);
      return;
    }

    if (!cartItems?.length) {
      showMessage({ message: 'Your cart is empty', type: 'warning' }); return;
    }
    if (!address) {
      showMessage({ message: 'Please add a delivery address', type: 'warning' });
      setAddrModalVisible(true); return;
    }
    if (!paymentMethod) {
      showMessage({ message: 'Please select a payment method', type: 'warning' }); return;
    }
    try {
      setPlacingOrder(true);
      const fullAddress = [address.line1, address.city, address.state, address.pincode]
        .filter(Boolean).join(', ');

      const checkoutPayload = {
        address:          fullAddress,
        mode_of_payment:  paymentMethod === 'CASH'
          ? 'cash_on_delivery' as const
          : 'online' as const,
        order_list: (cartItems as any[]).map((item: any) => ({
          product:  Number(item?.id ?? item?.product),
          quantity: Number(item?.quantity ?? 1),
        })),
        shipping_country: 'India',
        shipping_state:   address.state   ?? '',
        shipping_zipcode: address.pincode ?? '',
      };

      const checkoutResponse = await initiateCheckoutV2(
        cartId, DELIVERY_TYPE, checkoutPayload,
      );

      if (!checkoutResponse.operational) {
        Alert.alert('Store unavailable',
          checkoutResponse.unoperational_message ?? 'Not accepting orders right now.');
        return;
      }

      if (paymentMethod === 'CASH') {
        showMessage({ message: 'Order placed! Cash on delivery.', type: 'success' });
        await fetchCart?.();
        router.replace(
          `/storefront/OrderSuccessScreen?orderId=${checkoutResponse.order_id}` as never,
        );
        return;
      }

      const paymentResult = await openPaymentGateway(checkoutResponse, {
        primaryColor,
        prefillPhone: address?.phone ?? address?.fullName,
        prefillEmail: undefined,
      });

      if (!paymentResult.success) {
        showMessage(paymentResult.reason === 'cancelled'
          ? { message: 'Payment cancelled', type: 'info' }
          : { message: 'Payment failed',
              description: paymentResult.message ?? 'Please try again.',
              type: 'danger' });
        return;
      }

      await confirmPaymentSuccess({
        order_id:            paymentResult.orderId,
        razorpay_order_id:   paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature:  paymentResult.razorpay_signature,
      });

      await fetchCart?.();
      router.replace(
        `/storefront/OrderSuccessScreen?orderId=${paymentResult.orderId}` as never,
      );
    } catch (error: any) {
      showMessage({
        message:     'Something went wrong',
        description: error?.response?.data?.message ?? error?.message ?? 'Please try again.',
        type:        'danger',
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleQuantityChange = async (
    productId: number, currentQty: number, delta: number,
  ) => {
    const newQty = Math.max(0, Math.floor(currentQty + delta));
    if (newQty === currentQty) return;
    try {
      await addToCart(productId, newQty);
      await fetchCart?.();
    } catch {
      showMessage({ message: 'Failed to update cart', type: 'danger' });
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      await addToCart(productId, 0);
      await fetchCart?.();
      showMessage({ message: 'Item removed', type: 'success' });
    } catch {
      showMessage({ message: 'Failed to remove item', type: 'danger' });
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showMessage({ message: 'Enter a promo code', type: 'warning' }); return;
    }
    try {
      setApplyingPromo(true);
      await authenticatedClient.post('api/cart/apply-coupon/', { code: promoCode.trim() });
      await fetchCart?.();
      showMessage({ message: `Promo "${promoCode}" applied!`, type: 'success' });
    } catch {
      showMessage({ message: 'Invalid or expired promo code', type: 'danger' });
    } finally {
      setApplyingPromo(false);
    }
  };

  // Render the red swipe-to-delete action
  const renderSwipeDelete = (id: number, isUpdating: boolean) => (
    <Pressable
      style={styles.swipeDeleteAction}
      onPress={() => handleDelete(id)}
      disabled={isUpdating}
    >
      {isUpdating
        ? <ActivityIndicator color="#fff" size="small" />
        : <Ionicons name="trash-outline" size={22} color="#fff" />}
      <Text style={styles.swipeDeleteText}>Remove</Text>
    </Pressable>
  );

  if (isLoading) {
    return <CartSkeleton />;
  }

  const hasItems   = Array.isArray(cartItems) && cartItems.length > 0;
  const orderTotal = (finalPrice ?? 0) + deliveryCharge;
  const savings    = Math.max(0, (subTotal ?? 0) - (finalPrice ?? 0));

  return (
    <StorefrontHeaderWrapper
      screenName="cart"
      onBackPress={() => router.back()}
      onMenuPress={() => setDrawerVisible(true)}
    >
      <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      <AddressFlowModal
        visible={addrModalVisible}
        onSelect={handleSelectAddress}
        onClose={() => setAddrModalVisible(false)}
      />

      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <StatusBar barStyle="light-content" backgroundColor={BLACK} />

        {/* ── Guest banner ────────────────────────────────────────────────── */}
        {isGuest && (
          <Pressable
            style={styles.guestBanner}
            onPress={() => setAuthSheetVisible(true)}
          >
            <Ionicons name="person-circle-outline" size={16} color="#fff" />
            <Text style={styles.guestBannerText}>
              Sign in to place your order &amp; save your cart
            </Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        {/* ── Auth bottom sheet ──────────────────────────────────────────── */}
        <AuthSheet
          visible={authSheetVisible}
          onClose={() => setAuthSheetVisible(false)}
          onSuccess={() => { loadCart(); prefetchDeliveryCharge(); }}
        />

        {!hasItems ? (
          /* ── Empty ─────────────────────────────────────────────────────── */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconRing}>
              <Ionicons name="cart-outline" size={56} color={RED} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Looks like you haven't added anything yet. Start exploring!
            </Text>
            <Pressable
              style={styles.shopBtn}
              onPress={() => router.push('/storefront' as never)}
            >
              <Ionicons name="storefront-outline" size={18} color="#fff" />
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomBarHeight + 24 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Section header ── */}
              <Animated.View entering={FadeIn.delay(80)} style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderLabel}>My Cart</Text>
                <View style={styles.sectionHeaderBadge}>
                  <Text style={styles.sectionHeaderBadgeText}>
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </Text>
                </View>
              </Animated.View>

              {/* ═══════════════════════════════════════════════════════════
                  Cart Items  (swipe left to delete)
              ═══════════════════════════════════════════════════════════ */}
              {(cartItems as any[]).map((item: any, index: number) => {
                const id           = item?.id ?? item?.product ?? index;
                const name         = item?.product_name ?? 'Product';
                const photo        = item?.photo ?? item?.image_url ?? null;
                const qty          = Number(item?.quantity ?? 0);
                const unitPrice    = Number(item?.original_price ?? 0);
                const lineTotal    = unitPrice * qty;
                const qtyRemaining = Number(item?.quantity_remaining ?? 9999);
                const isUpdating   = loadingProductId === id;
                const description  = item?.description ?? item?.short_description ?? null;
                const category     = item?.category ?? item?.categories?.[0]?.name ?? null;

                return (
                  <Animated.View
                    key={id}
                    entering={FadeInDown.delay(index * 70).springify()}
                    style={{ marginBottom: 1 }}
                  >
                    <Swipeable
                      renderRightActions={() => renderSwipeDelete(id, isUpdating)}
                      friction={2}
                      rightThreshold={60}
                      overshootRight={false}
                    >
                      <View style={styles.cartItem}>
                        {/* ── Main row: image + content ── */}
                        <View style={styles.cartItemRow}>
                          {/* Image */}
                          <View style={styles.itemImgWrap}>
                            {photo ? (
                              <Image source={{ uri: photo }} style={styles.itemImg} resizeMode="cover" />
                            ) : (
                              <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                                <Ionicons name="image-outline" size={26} color={MUTED} />
                              </View>
                            )}
                          </View>

                          {/* Content */}
                          <View style={styles.itemContent}>
                            <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
                            {!!category && <Text style={styles.itemCat}>{category}</Text>}

                            {/* Variant badges */}
                            {Array.isArray(item?.variation_options) && item.variation_options.length > 0 && (
                              <View style={styles.badgeRow}>
                                {item.variation_options.map((opt: any) => (
                                  <View key={opt.option_id} style={styles.variantBadge}>
                                    <Text style={styles.variantBadgeText}>
                                      {opt.type_name}: {opt.option_name}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Price + stepper */}
                            <View style={styles.priceStepper}>
                              <View>
                                <Text style={styles.unitPriceTxt}>₹{unitPrice.toFixed(2)} × {qty}</Text>
                                <Text style={styles.lineTotalTxt}>₹{lineTotal.toFixed(2)}</Text>
                              </View>

                              <View style={styles.stepperRow}>
                                <Pressable
                                  style={[styles.stepperBtn, qty <= 1 && styles.stepperBtnOff]}
                                  onPress={() => handleQuantityChange(id, qty, -1)}
                                  disabled={isUpdating || qty <= 0}
                                  hitSlop={6}
                                >
                                  <Text style={styles.stepperBtnTxt}>−</Text>
                                </Pressable>

                                <View style={styles.stepperCount}>
                                  {isUpdating
                                    ? <ActivityIndicator size="small" color={GREEN} />
                                    : <Text style={styles.stepperCountTxt}>{qty}</Text>}
                                </View>

                                <Pressable
                                  style={[styles.stepperBtn, styles.stepperBtnPlus,
                                    qty >= qtyRemaining && styles.stepperBtnOff]}
                                  onPress={() => handleQuantityChange(id, qty, 1)}
                                  disabled={isUpdating || qty >= qtyRemaining}
                                  hitSlop={6}
                                >
                                  <Text style={[styles.stepperBtnTxt, { color: '#fff' }]}>+</Text>
                                </Pressable>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Description */}
                        {!!description && (
                          <View style={styles.descBox}>
                            <Text style={styles.descTxt} numberOfLines={2}>{description}</Text>
                          </View>
                        )}

                        {/* Stock warning */}
                        {qtyRemaining <= 5 && qtyRemaining < 9999 && (
                          <Text style={styles.stockWarning}>
                            ⚠ Only {qtyRemaining} left in stock
                          </Text>
                        )}
                      </View>
                    </Swipeable>
                  </Animated.View>
                );
              })}

              {/* ── Promo Code ── */}
              <Animated.View entering={FadeIn.delay(220)} style={[styles.promoSection, { marginTop: 8 }]}>
                <View style={styles.promoRow}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Promo Code"
                    placeholderTextColor={MUTED}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleApplyPromo}
                  />
                  <Pressable
                    style={[styles.promoBtn, applyingPromo && { opacity: 0.7 }]}
                    onPress={handleApplyPromo}
                    disabled={applyingPromo}
                  >
                    {applyingPromo
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.promoBtnText}>Apply</Text>}
                  </Pressable>
                </View>
              </Animated.View>

              {/* ═══════════════════════════════════════════════════════════
                  Order Summary
              ═══════════════════════════════════════════════════════════ */}
              <Animated.View entering={FadeIn.delay(300)} style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sub-Total</Text>
                  <Text style={styles.summaryValue}>₹{(subTotal ?? 0).toFixed(2)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Charge</Text>
                  <Text style={[styles.summaryValue, deliveryCharge === 0 && { color: GREEN }]}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={[styles.summaryValue, { color: MUTED }]}>Included</Text>
                </View>

                {savings > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, { color: GREEN }]}>−₹{savings.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.summaryDivider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Cost</Text>
                  <Text style={styles.totalValue}>₹{orderTotal.toFixed(2)}</Text>
                </View>
              </Animated.View>

              {/* ═══════════════════════════════════════════════════════════
                  Delivery Address (signed-in users only)
              ═══════════════════════════════════════════════════════════ */}
              {!isGuest ? (
                <>
                  <Animated.View entering={FadeIn.delay(400)} style={styles.addressSection}>
                    <View style={styles.addressSectionTitleRow}>
                      <Ionicons name="location-outline" size={18} color={RED} />
                      <Text style={styles.addressSectionTitle}>Delivery Address</Text>
                    </View>

                    {selectedAddress ? (
                      <View style={styles.selectedAddressCard}>
                        <View style={styles.selectedAddressIconBox}>
                          <Ionicons name="location" size={20} color={RED} />
                        </View>
                        <View style={{ flex: 1 }}>
                          {selectedAddress.primary && (
                            <View style={[styles.primaryBadge, { marginBottom: 4 }]}>
                              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                            </View>
                          )}
                          <Text style={styles.selectedAddressLine}>
                            {selectedAddress.displayLine}
                          </Text>
                          {!!selectedAddress.addressLine2 && (
                            <Text style={styles.selectedAddressSub}>
                              {selectedAddress.addressLine2}
                            </Text>
                          )}
                          {!!selectedAddress.landmark && (
                            <Text style={styles.selectedAddressSub}>
                              Near: {selectedAddress.landmark}
                            </Text>
                          )}
                          {!!selectedAddress.subLine && (
                            <Text style={styles.selectedAddressSub}>
                              {selectedAddress.subLine}
                            </Text>
                          )}
                          {!!selectedAddress.mobileNumber && (
                            <Text style={styles.selectedAddressPhone}>
                              <Ionicons name="call-outline" size={12} color={MUTED} />{' '}
                              {selectedAddress.mobileNumber}
                            </Text>
                          )}
                        </View>
                        <Pressable
                          style={styles.changeAddressBtn}
                          onPress={() => setAddrModalVisible(true)}
                        >
                          <Text style={styles.changeAddressText}>Change</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.addAddressPrompt}
                        onPress={() => setAddrModalVisible(true)}
                      >
                        <View style={styles.addAddressIconBox}>
                          <Ionicons name="add" size={22} color={RED} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.addAddressPromptTitle}>Add Delivery Address</Text>
                          <Text style={styles.addAddressPromptSub}>
                            Tap to select or add a new address
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={MUTED} />
                      </Pressable>
                    )}
                  </Animated.View>

                  {!!selectedAddress && (
                    <Animated.View entering={FadeIn.delay(450)} style={styles.deliveryInfoStrip}>
                      <Ionicons name="flash" size={14} color={RED} />
                      <Text style={styles.deliveryInfoText}>
                        Express Delivery · Estimated 30–60 min
                      </Text>
                    </Animated.View>
                  )}
                </>
              ) : null}

              {/* ═══════════════════════════════════════════════════════════
                  Payment Method
              ═══════════════════════════════════════════════════════════ */}
              <Animated.View entering={FadeIn.delay(500)} style={styles.paymentSection}>
                <View style={styles.paymentTitleRow}>
                  <Ionicons name="card-outline" size={18} color={RED} />
                  <Text style={styles.paymentSectionTitle}>Payment Method</Text>
                </View>
                <Text style={styles.paymentSectionSubtitle}>
                  Choose how you'd like to pay
                </Text>

                <View style={styles.paymentOptions}>
                  <PaymentOptionCard
                    label="Cash on Delivery" subtitle="Pay when delivered"
                    icon="cash-outline"
                    selected={paymentMethod === 'CASH'}
                    onPress={() => setPaymentMethod('CASH')}
                  />
                  <PaymentOptionCard
                    label="Online Payment" subtitle="Cards, UPI, Wallets"
                    icon="phone-portrait-outline"
                    selected={paymentMethod === 'ONLINE'}
                    onPress={() => setPaymentMethod('ONLINE')}
                  />
                </View>

                {paymentMethod === 'ONLINE' && (
                  <Animated.View
                    entering={FadeInDown.springify()}
                    style={styles.onlinePaymentInfo}
                  >
                    <Ionicons name="shield-checkmark-outline" size={14} color={GREEN} />
                    <Text style={styles.onlinePaymentInfoText}>
                      Secured by 256-bit SSL encryption. Powered by Razorpay.
                    </Text>
                  </Animated.View>
                )}
                {paymentMethod === 'CASH' && (
                  <Animated.View
                    entering={FadeInDown.springify()}
                    style={styles.cashPaymentInfo}
                  >
                    <Ionicons name="information-circle-outline" size={14} color={RED} />
                    <Text style={styles.cashPaymentInfoText}>
                      Please keep exact change ready. Collected upon arrival.
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>

              {/* ── Policy chips ── */}
              <Animated.View entering={FadeIn.delay(600)} style={styles.policyRow}>
                {[
                  { icon: 'refresh-outline',  text: 'Easy Returns'    },
                  { icon: 'shield-outline',    text: 'Secure Checkout' },
                  { icon: 'flash-outline',     text: 'Fast Delivery'   },
                ].map(({ icon, text }) => (
                  <View key={text} style={styles.policyChip}>
                    <Ionicons name={icon as any} size={13} color={RED} />
                    <Text style={styles.policyChipText}>{text}</Text>
                  </View>
                ))}
              </Animated.View>
            </ScrollView>

            {/* ── Bottom CTA ─────────────────────────────────────────────── */}
            <View style={[styles.bottomBar, { paddingBottom: bottomBarPaddingBottom }]}>
              <View style={styles.bottomBarContent}>
                <View>
                  <Text style={styles.bottomBarLabel}>Total Payable</Text>
                  <Text style={styles.bottomBarAmount}>₹{orderTotal.toFixed(2)}</Text>
                </View>
                <Pressable
                  style={[styles.checkoutBtn, placingOrder && { opacity: 0.75 }]}
                  onPress={handlePlaceOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.checkoutBtnText}>Place Order</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </StorefrontHeaderWrapper>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Styles
// ══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Empty state ──
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIconRing: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: RED_LIGHT, borderWidth: 2, borderColor: RED_BORDER,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontFamily: F.sans800, color: '#fff', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  shopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: RED, paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 14,
    shadowColor: RED, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  shopBtnText: { color: '#fff', fontSize: 15, fontFamily: F.sans800 },

  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: 0, paddingTop: 0 },

  // ── Section header ──
  sectionHeaderRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 0, gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: DARK,
    borderBottomWidth: 1, borderBottomColor: BORDER },
  sectionHeaderLabel:     { fontSize: 16, fontFamily: F.sans800, color: '#fff' },
  sectionHeaderBadge:     { backgroundColor: RED_LIGHT, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: RED_BORDER },
  sectionHeaderBadgeText: { fontSize: 11, fontFamily: F.sans700, color: RED },

  // ── Swipe delete action ──
  swipeDeleteAction: {
    width: 76, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#DC2626', gap: 3,
  },
  swipeDeleteText: { fontSize: 10, fontFamily: F.sans800, color: '#fff' },

  // ── Cart item — full width, dense ──
  cartItem: {
    backgroundColor: SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  cartItemRow: { flexDirection: 'row', gap: 11 },

  itemImgWrap: {
    width: 60, height: 60, borderRadius: 10, overflow: 'hidden',
    backgroundColor: MUTED_BG, flexShrink: 0,
    borderWidth: 1, borderColor: BORDER,
  },
  itemImg:            { width: '100%', height: '100%' },
  itemImgPlaceholder: { justifyContent: 'center', alignItems: 'center' },

  itemContent: { flex: 1, minWidth: 0 },
  itemName:    { fontSize: 13, fontFamily: F.sans700, color: '#fff', lineHeight: 18, marginBottom: 1 },
  itemCat:     { fontSize: 11, color: MUTED, marginBottom: 4 },

  badgeRow:         { flexDirection: 'row', gap: 4, marginBottom: 4, flexWrap: 'wrap' },
  variantBadge:     { borderWidth: 1, borderColor: BORDER, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: MUTED_BG },
  variantBadgeText: { fontSize: 9, fontFamily: F.sans600, color: MUTED },

  // Price + stepper — inline compact
  priceStepper: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 5,
  },
  unitPriceTxt:  { fontSize: 10, color: MUTED },
  lineTotalTxt:  { fontSize: 14, fontFamily: F.sans800, color: '#fff', marginTop: 1 },

  // Stepper — compact
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    flexShrink: 0,
  },
  stepperBtn:     { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: MUTED_BG },
  stepperBtnPlus: { backgroundColor: RED },
  stepperBtnOff:  { opacity: 0.3 },
  stepperBtnTxt:  { fontSize: 16, fontFamily: F.sans700, color: '#fff' },
  stepperCount: {
    width: 32, height: 30, justifyContent: 'center', alignItems: 'center',
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER,
    backgroundColor: DARK,
  },
  stepperCountTxt: { fontSize: 13, fontFamily: F.sans800, color: '#fff' },

  // Description
  descBox: {
    marginTop: 8, backgroundColor: MUTED_BG, borderRadius: 6, padding: 8,
    borderLeftWidth: 2.5, borderLeftColor: RED,
  },
  descTxt: { fontSize: 10, color: MUTED, lineHeight: 15 },

  stockWarning: { marginTop: 5, fontSize: 10, color: '#EF4444', fontFamily: F.sans700 },

  // ── Promo code ──
  promoSection: {
    backgroundColor: SURFACE, padding: 14, marginTop: 1,
    borderBottomWidth: 1, borderTopWidth: 1, borderColor: BORDER,
  },
  promoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  promoInput:  {
    flex: 1, height: 44, borderRadius: 10,
    backgroundColor: MUTED_BG, paddingHorizontal: 14,
    fontSize: 13, color: '#fff', borderWidth: 1, borderColor: BORDER,
  },
  promoBtn: {
    height: 44, paddingHorizontal: 18, borderRadius: 10,
    backgroundColor: RED, justifyContent: 'center', alignItems: 'center',
  },
  promoBtnText: { fontSize: 13, fontFamily: F.sans800, color: '#fff' },

  // ── Summary ──
  summarySection: {
    backgroundColor: SURFACE, padding: 18, marginTop: 1,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER,
  },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel:  { fontSize: 13, color: MUTED },
  summaryValue:  { fontSize: 13, fontFamily: F.sans700, color: '#fff' },
  summaryDivider:{ height: 1, backgroundColor: BORDER, marginBottom: 12 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:    { fontSize: 14, fontFamily: F.sans800, color: '#fff' },
  totalValue:    { fontSize: 18, fontFamily: F.sans900, color: RED },

  // ── Address ──
  addressSection: {
    backgroundColor: SURFACE, padding: 18, marginTop: 1,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER,
  },
  addressSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  addressSectionTitle:    { fontSize: 15, fontFamily: F.sans900, color: '#fff' },

  addAddressPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: RED_LIGHT, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: RED_BORDER,
  },
  addAddressIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: MUTED_BG,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: RED_BORDER,
  },
  addAddressPromptTitle: { fontSize: 14, fontFamily: F.sans800, color: '#fff' },
  addAddressPromptSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  selectedAddressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: RED_LIGHT, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: RED_BORDER,
  },
  selectedAddressIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MUTED_BG,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: RED_BORDER,
  },
  selectedAddressLine:  { fontSize: 13, fontFamily: F.sans800, color: '#fff', lineHeight: 19 },
  selectedAddressSub:   { fontSize: 12, color: MUTED, marginTop: 2 },
  selectedAddressPhone: { fontSize: 11, color: MUTED, marginTop: 4 },

  changeAddressBtn: {
    backgroundColor: RED, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
  },
  changeAddressText: { fontSize: 11, fontFamily: F.sans800, color: '#fff' },

  deliveryInfoStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: RED_LIGHT, borderRadius: 12, padding: 12, marginTop: 1,
    borderWidth: 1, borderColor: RED_BORDER,
    marginHorizontal: 16, marginBottom: 1,
  },
  deliveryInfoText: { fontSize: 12, fontFamily: F.sans700, color: RED },

  // ── Payment ──
  paymentSection: {
    backgroundColor: SURFACE, padding: 18, marginTop: 1,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER,
  },
  paymentTitleRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paymentSectionTitle:    { fontSize: 15, fontFamily: F.sans900, color: '#fff' },
  paymentSectionSubtitle: { fontSize: 12, color: MUTED, marginBottom: 14 },
  paymentOptions:         { flexDirection: 'row', gap: 12 },

  paymentCard: {
    padding: 16, borderRadius: 16, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  paymentIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  paymentCardLabel:    { fontSize: 13, fontFamily: F.sans900, textAlign: 'center', marginBottom: 3, color: '#fff' },
  paymentCardSubtitle: { fontSize: 10, color: MUTED, textAlign: 'center' },
  paymentCheckmark:    { position: 'absolute', top: 8, right: 8 },

  onlinePaymentInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    backgroundColor: GREEN_LIGHT, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: GREEN_BORDER,
  },
  onlinePaymentInfoText: { fontSize: 11, color: GREEN, flex: 1 },
  cashPaymentInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    backgroundColor: RED_LIGHT, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: RED_BORDER,
  },
  cashPaymentInfoText: { fontSize: 11, color: RED, flex: 1 },

  // ── Policy chips ──
  policyRow: {
    flexDirection: 'row', gap: 8, justifyContent: 'center',
    marginTop: 1, marginBottom: 0, flexWrap: 'wrap',
    backgroundColor: SURFACE, padding: 14,
  },
  policyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: MUTED_BG, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  policyChipText: { fontSize: 11, fontFamily: F.sans700, color: MUTED },

  // ── Bottom bar — black + orange ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BLACK,
    borderTopWidth: 2, borderTopColor: RED,
    paddingHorizontal: 20, paddingTop: 14,
    ...Platform.select({ ios: { shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: -4 } } }),
    elevation: 16,
  },
  bottomBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomBarLabel:   { fontSize: 11, color: MUTED, fontFamily: F.sans600, letterSpacing: 0.3 },
  bottomBarAmount:  { fontSize: 24, fontFamily: F.sans900, color: '#fff', paddingTop: 10 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: RED, paddingVertical: 16, paddingHorizontal: 26,
    borderRadius: 28,
    shadowColor: RED, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontFamily: F.sans900, letterSpacing: 0.4 },

  // ── Guest banner ──
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: DARK, paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: RED_BORDER,
  },
  guestBannerText: {
    flex: 1, fontSize: 12, fontFamily: F.sans600, color: MUTED, letterSpacing: 0.1,
  },
});