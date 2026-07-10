import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authenticatedClient } from '@/api/common/client';
import { Ionicons } from '@expo/vector-icons';
import { F } from '@/lib/fonts';

const { width: SW } = Dimensions.get('window');

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#FFF5F7',
  card:     '#FFFFFF',
  black:    '#0D0D0D',
  orange:   '#C41230',
  muted:    '#8A8A8A',
  border:   '#FFD5D8',
  pill:     '#FFF0F3',
  danger:   '#EF4444',
  success:  '#10B981',
  warn:     '#F59E0B',
  info:     '#60A5FA',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type OrderItem = {
  id: number;
  title: string;
  photo: string;
  quantity: string;
  final_price: string;
  brand?: string;
  size?: string;
  color?: string;
};

type Order = {
  id: number;
  items: OrderItem[];
  created_on: string;
  total_price: string;
  delivery_charge: string;
  status: string;
  fulfilment_address?: string;
  delivery_address?: string;
  payment_method?: string;
  tracking_id?: string;
  estimated_delivery?: string;
};

// ── Status config ─────────────────────────────────────────────────────────────
type StatusMeta = { label: string; color: string; iconName: React.ComponentProps<typeof Ionicons>['name']; step: number };
const STATUS_META: Record<string, StatusMeta> = {
  PENDING:          { label: 'Pending',          color: C.warn,    iconName: 'time-outline',            step: 1 },
  CONFIRMED:        { label: 'Confirmed',         color: C.success, iconName: 'checkmark-circle-outline', step: 2 },
  PROCESSING:       { label: 'Processing',        color: C.info,    iconName: 'reload-circle-outline',    step: 2 },
  SHIPPED:          { label: 'Shipped',           color: '#A78BFA', iconName: 'cube-outline',             step: 3 },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: C.success, iconName: 'bicycle-outline',          step: 4 },
  DELIVERED:        { label: 'Delivered',         color: C.success, iconName: 'checkmark-done-circle-outline', step: 5 },
  COMPLETED:        { label: 'Completed',         color: C.success, iconName: 'checkmark-done-circle-outline', step: 5 },
  CANCELLED:        { label: 'Cancelled',         color: C.danger,  iconName: 'close-circle-outline',     step: 0 },
  RETURNED:         { label: 'Returned',          color: C.orange,  iconName: 'return-up-back-outline',   step: 0 },
};

const STEPS = [
  { label: 'Placed',    icon: 'receipt-outline'     },
  { label: 'Confirmed', icon: 'checkmark-outline'   },
  { label: 'Shipped',   icon: 'cube-outline'        },
  { label: 'On Way',    icon: 'bicycle-outline'     },
  { label: 'Delivered', icon: 'home-outline'        },
] as const;

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = memo(({ status }: { status: string }) => {
  const meta = STATUS_META[status] ?? { label: status, color: C.muted, iconName: 'ellipse-outline' as const, step: 1 };
  return (
    <View style={[st.badge, { backgroundColor: meta.color + '18', borderColor: meta.color + '40' }]}>
      <Ionicons name={meta.iconName} size={11} color={meta.color} />
      <Text style={[st.badgeTxt, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
});

// ── Progress Track ────────────────────────────────────────────────────────────
const ProgressTrack = memo(({ status }: { status: string }) => {
  const meta = STATUS_META[status];
  if (!meta || meta.step === 0) return null;

  return (
    <View style={st.trackWrap}>
      {STEPS.map(({ label, icon }, i) => {
        const stepNum = i + 1;
        const done    = stepNum < meta.step;
        const active  = stepNum === meta.step;
        const color   = done || active ? meta.color : C.border;

        return (
          <React.Fragment key={label}>
            <View style={st.trackStep}>
              <View style={[
                st.trackDot,
                { borderColor: color, backgroundColor: done || active ? color : 'transparent' },
                active && { shadowColor: meta.color, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
              ]}>
                <Ionicons
                  name={icon as any}
                  size={10}
                  color={done || active ? '#fff' : C.border}
                />
              </View>
              <Text style={[st.trackLabel, (done || active) && { color: C.black, fontFamily: F.sans700 }]}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[st.trackLine, { backgroundColor: done ? meta.color : C.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});

// ── Item Pill ─────────────────────────────────────────────────────────────────
const ItemPill = memo(({ item }: { item: OrderItem }) => (
  <View style={st.itemPill}>
    <Image
      source={{ uri: item.photo }}
      style={st.itemPillImg}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
    <View style={st.itemPillBody}>
      <Text style={st.itemPillTitle} numberOfLines={2}>{item.title}</Text>
      {!!item.brand && <Text style={st.itemPillBrand} numberOfLines={1}>{item.brand}</Text>}
      <View style={st.itemPillTags}>
        <View style={st.tag}><Text style={st.tagTxt}>×{item.quantity}</Text></View>
        {!!item.size  && <View style={st.tag}><Text style={st.tagTxt}>{item.size}</Text></View>}
        {!!item.color && <View style={st.tag}><Text style={st.tagTxt}>{item.color}</Text></View>}
      </View>
    </View>
    <Text style={st.itemPillPrice}>₹{Number(item.final_price).toFixed(0)}</Text>
  </View>
));

// ── Thumbnail Row ─────────────────────────────────────────────────────────────
const ThumbRow = memo(({ items }: { items: OrderItem[] }) => {
  const visible = items.slice(0, 4);
  const extra   = items.length - visible.length;

  return (
    <View style={st.thumbRow}>
      {visible.map((item, i) => (
        <View key={item.id} style={[st.thumbWrap, { marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }]}>
          <Image
            source={{ uri: item.photo }}
            style={st.thumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
      ))}
      {extra > 0 && (
        <View style={[st.thumbWrap, st.thumbExtra, { marginLeft: -10, zIndex: 0 }]}>
          <Text style={st.thumbExtraTxt}>+{extra}</Text>
        </View>
      )}
    </View>
  );
});

// ── Order Card ────────────────────────────────────────────────────────────────
const OrderCard = memo(({
  order,
  isOpen,
  onToggle,
  primaryColor,
  index,
}: {
  order: Order;
  isOpen: boolean;
  onToggle: () => void;
  primaryColor: string;
  index: number;
}) => {
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim,  { toValue: 1, duration: 360, delay: Math.min(index * 60, 300), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 340, delay: Math.min(index * 60, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const prevOpen    = useRef(isOpen);
  React.useEffect(() => {
    if (prevOpen.current === isOpen) return;
    prevOpen.current = isOpen;
    Animated.spring(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
      damping: 14, stiffness: 180,
    }).start();
  }, [isOpen]);

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const meta        = STATUS_META[order.status] ?? { label: order.status, color: C.muted, iconName: 'ellipse-outline' as const, step: 1 };
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
  const totalItems  = order.items.reduce((s, i) => s + Number(i.quantity || 1), 0);
  const date        = new Date(order.created_on);

  const renderItem = useCallback(({ item }: { item: OrderItem }) => (
    <ItemPill item={item} />
  ), []);

  const keyExtractor = useCallback((item: OrderItem) => String(item.id), []);

  return (
    <Animated.View style={[
      st.card,
      { opacity: cardAnim, transform: [{ translateY: slideAnim }] },
      isOpen && { borderColor: meta.color + '40', shadowColor: meta.color },
    ]}>
      <View style={[st.cardAccent, { backgroundColor: meta.color }]} />

      <Pressable onPress={onToggle} style={st.cardHeader}>
        <ThumbRow items={order.items} />

        <View style={st.cardMeta}>
          <View style={st.cardTopRow}>
            <Text style={st.cardOrderNum}>Order #{order.id}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={st.cardDate}>
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {'  ·  '}
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
          <Text style={st.cardTotal}>₹{Number(order.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        <Animated.View style={{ transform: [{ rotate: chevronRotate }], marginLeft: 4 }}>
          <Ionicons name="chevron-down" size={18} color={C.muted} />
        </Animated.View>
      </Pressable>

      {isOpen && (
        <View>
          <View style={st.divider} />

          {!isCancelled && (
            <View style={st.section}>
              <Text style={st.sectionLabel}>ORDER PROGRESS</Text>
              <ProgressTrack status={order.status} />
            </View>
          )}

          <View style={st.section}>
            <Text style={st.sectionLabel}>
              {order.items.length} {order.items.length === 1 ? 'ITEM' : 'ITEMS'}
            </Text>
            <FlatList
              data={order.items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              ItemSeparatorComponent={() => <View style={st.itemSep} />}
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
            />
          </View>

          <View style={[st.section, st.summaryBox]}>
            <Text style={st.sectionLabel}>PAYMENT SUMMARY</Text>
            <View style={st.summaryRow}>
              <Text style={st.summaryKey}>Items subtotal</Text>
              <Text style={st.summaryVal}>
                ₹{(Number(order.total_price) - Number(order.delivery_charge || 0))
                  .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={st.summaryRow}>
              <Text style={st.summaryKey}>Delivery</Text>
              <Text style={st.summaryVal}>
                {Number(order.delivery_charge || 0) === 0
                  ? <Text style={{ color: C.success }}>FREE</Text>
                  : `₹${Number(order.delivery_charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </Text>
            </View>
            {!!order.payment_method && (
              <View style={st.summaryRow}>
                <Text style={st.summaryKey}>Payment</Text>
                <Text style={st.summaryVal}>{order.payment_method}</Text>
              </View>
            )}
            <View style={st.summaryDivider} />
            <View style={st.summaryRow}>
              <Text style={st.summaryTotalKey}>Total Paid</Text>
              <Text style={[st.summaryTotalVal, { color: C.black }]}>
                ₹{Number(order.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {!!(order.fulfilment_address?.trim() || order.delivery_address?.trim()) && (
            <View style={st.section}>
              <Text style={st.sectionLabel}>DELIVERY ADDRESS</Text>
              <View style={st.addressBox}>
                <Ionicons name="location-outline" size={14} color={C.orange} style={{ marginTop: 1 }} />
                <Text style={st.addressTxt}>
                  {order.fulfilment_address?.trim() || order.delivery_address?.trim()}
                </Text>
              </View>
            </View>
          )}

          {!!order.tracking_id && (
            <View style={st.section}>
              <Text style={st.sectionLabel}>TRACKING ID</Text>
              <View style={st.trackingBox}>
                <Ionicons name="barcode-outline" size={16} color={C.muted} />
                <Text style={st.trackingTxt}>{order.tracking_id}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 12 }} />
        </View>
      )}
    </Animated.View>
  );
});

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={st.emptyWrap}>
      <View style={st.emptyIconCircle}>
        <Ionicons name="bag-outline" size={40} color={C.muted} />
      </View>
      <Text style={st.emptyTitle}>No orders yet</Text>
      <Text style={st.emptyDesc}>Your orders will appear here once placed.</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MyOrdersScreen() {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const primaryColor = C.orange;

  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await authenticatedClient.get('api/shop/recent_order/?page=1');
      const data: Order[] = res?.data?.data || [];
      setOrders(data);
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (e) {
      console.log('orders error', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const toggle = useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const renderOrder = useCallback(({ item, index }: { item: Order; index: number }) => (
    <OrderCard
      order={item}
      isOpen={expandedId === item.id}
      onToggle={() => toggle(item.id)}
      primaryColor={primaryColor}
      index={index}
    />
  ), [expandedId, primaryColor, toggle]);

  const keyExtractor = useCallback((item: Order) => String(item.id), []);

  // ── Fixed header — lives outside FlatList so it's always visible ──
  const Header = (
    <View style={[st.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 14 : 8) }]}>
      <Pressable
        onPress={() => router.replace('/storefront')}
        style={st.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={st.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={st.headerTitle}>My Orders</Text>
      </View>
      {!loading && (
        <View style={st.orderCountBadge}>
          <Text style={st.orderCountNum}>{orders.length}</Text>
          <Text style={st.orderCountLabel}>total</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={st.root}>
        {Header}
        <View style={st.loader}>
          <ActivityIndicator color={primaryColor} size="large" />
          <Text style={st.loaderTxt}>Fetching your orders…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={st.root}>
      {Header}
      <FlatList
        data={orders}
        keyExtractor={keyExtractor}
        renderItem={renderOrder}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={[st.list, { paddingTop: 8, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const THUMB_SIZE = 40;

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header — fixed above FlatList, always visible
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: C.orange,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,0.65)',
    fontFamily: F.sans600, marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30, fontFamily: F.sans900, color: '#FFFFFF', letterSpacing: -1,
  },
  orderCountBadge: { alignItems: 'flex-end' },
  orderCountNum:   { fontSize: 36, fontFamily: F.sans900, letterSpacing: -1, color: '#FFFFFF' },
  orderCountLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: F.sans700, letterSpacing: 1.5, marginTop: -4 },

  // List
  list: { paddingHorizontal: 14 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    gap: 12,
  },

  // Thumbnail row
  thumbRow: { flexDirection: 'row', alignItems: 'center' },
  thumbWrap: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2, borderColor: C.card,
    overflow: 'hidden',
    backgroundColor: C.pill,
  },
  thumbImg:  { width: '100%', height: '100%' },
  thumbExtra: {
    backgroundColor: C.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbExtraTxt: { fontSize: 9, fontFamily: F.sans800, color: C.muted },

  // Card meta
  cardMeta:    { flex: 1, gap: 3 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardOrderNum:{ fontSize: 13, fontFamily: F.sans800, color: C.black, letterSpacing: -0.2 },
  cardDate:    { fontSize: 11.5, color: C.muted, fontFamily: F.sans500 },
  cardTotal:   { fontSize: 17, fontFamily: F.sans900, color: C.black, letterSpacing: -0.5 },

  // Badge
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  badgeTxt: { fontSize: 10.5, fontFamily: F.sans700 },

  // Expanded
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 14 },

  // Section
  section: { paddingHorizontal: 16, paddingVertical: 14 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 2.5, color: '#C0C0C0',
    fontFamily: F.sans800, marginBottom: 12, textTransform: 'uppercase',
  },

  // Progress track
  trackWrap:  { flexDirection: 'row', alignItems: 'flex-start' },
  trackStep:  { alignItems: 'center', gap: 5, flex: 1 },
  trackDot:   {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  trackLine:  { flex: 1, height: 2, marginTop: 12, marginHorizontal: -2 },
  trackLabel: { fontSize: 8.5, color: C.muted, fontFamily: F.sans600, letterSpacing: 0.2, textAlign: 'center' },

  // Item pill
  itemPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemPillImg:  {
    width: 62, height: 72,
    borderRadius: 10,
    backgroundColor: C.pill,
  },
  itemPillBody: { flex: 1, gap: 3 },
  itemPillTitle:{ fontSize: 13, fontFamily: F.sans600, color: C.black, lineHeight: 18 },
  itemPillBrand:{ fontSize: 10.5, color: C.muted },
  itemPillTags: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 4 },
  itemPillPrice:{ fontSize: 14, fontFamily: F.sans900, color: C.black, letterSpacing: -0.3 },
  tag:    { backgroundColor: C.pill, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagTxt: { fontSize: 10, color: C.muted, fontFamily: F.sans700 },
  itemSep:{ height: 14 },

  // Summary
  summaryBox: {
    backgroundColor: '#FFF0F3',
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingTop: 14,
    paddingBottom: 6,
    marginBottom: 4,
  },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 8 },
  summaryKey:      { fontSize: 13, color: C.muted, fontFamily: F.sans500 },
  summaryVal:      { fontSize: 13, color: C.muted, fontFamily: F.sans600 },
  summaryDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 14, marginBottom: 10, marginTop: 2 },
  summaryTotalKey: { fontSize: 14, color: C.black, fontFamily: F.sans700 },
  summaryTotalVal: { fontSize: 17, fontFamily: F.sans900, letterSpacing: -0.5 },

  // Address
  addressBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  addressTxt: { flex: 1, fontSize: 12.5, color: C.muted, lineHeight: 19 },

  // Tracking
  trackingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0F3', padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
  },
  trackingTxt: {
    fontSize: 12, color: C.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1, flex: 1,
  },

  // Loader
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loaderTxt: { color: C.muted, fontSize: 13, fontFamily: F.sans500 },

  // Empty
  emptyWrap:       { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.pill,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: F.sans800, color: C.black },
  emptyDesc:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
});