import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { OrderDetail } from '@/api/orders';

import { CmsCard, CmsField, CmsModal, CmsStatusBadge as StatusBadge, CmsSummaryRow } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { getOrderStatusMeta, getPaymentStatusMeta } from '../utils';

function money(v: number | string | undefined) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

type Props = { colors: CmsThemeColors; order: OrderDetail | null };

export const OrderDetailModal = React.forwardRef<BottomSheetModal, Props>(({ colors, order }, ref) => {
  if (!order) {
    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Order">
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No order selected.</Text>
        </View>
      </CmsModal>
    );
  }

  const customerObj = typeof order.customer === 'object' ? order.customer : undefined;
  const customerName = order.customer_name ?? customerObj?.name ?? order.user?.name ?? '—';
  const customerPhone = customerObj?.phone_number ?? order.user?.phone ?? '—';

  const addr = order.address ?? { address: '' };
  const addressLine = addr.address || order.delivery_address || order.fulfilment_address || '—';

  const items = order.cart ?? [];
  const subtotal = order.items_subtotal != null
    ? Number(order.items_subtotal)
    : items.reduce((s, it) => s + (Number(it.final_price) || 0), 0);
  const deliveryCharge = Number(order.delivery_charge) || 0;
  const packagingCharge = Number(order.packaging_charge) || 0;
  const total = subtotal + deliveryCharge + packagingCharge;

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={`Order #${order.id}`}>
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={st.scroll}
      >
        <CmsCard colors={colors}>
          <View style={st.badgeRow}>
            <StatusBadge meta={getOrderStatusMeta(order.status)} />
            <StatusBadge meta={getPaymentStatusMeta(order.payment_status)} />
          </View>
          <View style={st.fieldGrid}>
            <CmsField label="Order Date" value={new Date(order.created_on).toLocaleString()} colors={colors} />
            <CmsField label="Fulfilment" value={order.fulfilment_type} colors={colors} />
            <CmsField label="Delivery Type" value={order.delivery_type} colors={colors} />
            <CmsField label="Delivery Date" value={order.delivery_date} colors={colors} />
            <CmsField label="Delivery Time" value={order.delivery_time} colors={colors} />
          </View>
          {order.invoice_url ? (
            <Pressable onPress={() => Linking.openURL(order.invoice_url as string)}>
              <Text style={{ color: colors.accent, marginTop: 8, fontWeight: '700' }}>View invoice</Text>
            </Pressable>
          ) : null}
        </CmsCard>

        <CmsCard colors={colors} title="Customer & Delivery">
          <View style={st.fieldGrid}>
            <CmsField label="Customer" value={customerName} colors={colors} />
            <CmsField label="Phone" value={customerPhone} colors={colors} />
            <CmsField label="Pincode" value={addr.pincode} colors={colors} />
          </View>
          <View style={{ marginTop: 10 }}>
            <CmsField label="Address" value={addressLine} colors={colors} />
          </View>
          {addr.landmark ? (
            <View style={{ marginTop: 10 }}>
              <CmsField label="Landmark" value={addr.landmark} colors={colors} />
            </View>
          ) : null}
          {order.inventory_detail ? (
            <View style={{ marginTop: 10 }}>
              <CmsField
                label="Pickup / Inventory"
                value={`${order.inventory_detail.name ?? ''}${order.inventory_detail.address ? ' — ' + order.inventory_detail.address : ''}`}
                colors={colors}
              />
            </View>
          ) : null}
        </CmsCard>

        <CmsCard colors={colors} title={`Products (${items.length})`}>
          {items.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No products on this order.</Text>
          ) : (
            items.map((item, i) => (
              <View key={item.id ?? i} style={[st.productRow, { borderColor: colors.border }]}>
                <Image
                  source={{ uri: item.images?.[0] || item.photo }}
                  style={[st.productImg, { backgroundColor: colors.background }]}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[st.productTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.product_name || item.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {item.sku ? `SKU: ${item.sku} · ` : ''}Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={[st.productPrice, { color: colors.textPrimary }]}>Rs. {money(item.final_price)}</Text>
              </View>
            ))
          )}

          <View style={[st.summaryDivider, { borderColor: colors.border }]} />
          <CmsSummaryRow label="Items subtotal" value={subtotal} colors={colors} />
          <CmsSummaryRow label="Delivery charge" value={deliveryCharge} colors={colors} />
          <CmsSummaryRow label="Packaging charge" value={packagingCharge} colors={colors} />
          <CmsSummaryRow label="Total" value={total} colors={colors} bold />
        </CmsCard>
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  productImg: { width: 48, height: 48, borderRadius: 8 },
  productTitle: { fontSize: 13.5, fontWeight: '600' },
  productPrice: { fontSize: 13.5, fontWeight: '800' },
  summaryDivider: { borderTopWidth: 1, marginTop: 4, marginBottom: 6 },
});
