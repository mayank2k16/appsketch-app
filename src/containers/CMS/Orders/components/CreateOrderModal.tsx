import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  searchProducts,
  useCreateOrder,
  useDiscounts,
  useInventories,
  usePreviewOrder,
  useTenantUsersSearch,
  useUpdateOrder,
} from '@/api/orders';
import type { CreateOrderPayload, DeliveryType, FulfilmentType, OrderDetail, OrderStatus, PaymentStatus } from '@/api/orders';
import type { SearchOption } from '@/components/ui/searchable-select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsSummaryRow } from '../../components';
import type { CmsThemeColors } from '../../theme';
import {
  DELIVERY_TYPE_OPTIONS,
  FULFILMENT_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../utils';

type ProductLine = { id: number | ''; quantity: string; name: string };

type FormState = {
  customer_id: string | number;
  customer_name: string;
  phone_number: string;
  address: string;
  landmark: string;
  pincode: string;
  latitude: string;
  longitude: string;
  inv_id: string | number;
  order_status: OrderStatus | '';
  payment_status: PaymentStatus | '';
  fulfilment_type: FulfilmentType;
  delivery_type: DeliveryType;
  delivery_date: string;
  delivery_time: string;
  delivery_charge: string;
  packaging_charge: string;
  products: ProductLine[];
  discount_id: string | number | '';
};

const EMPTY_FORM: FormState = {
  customer_id: '',
  customer_name: '',
  phone_number: '',
  address: '',
  landmark: '',
  pincode: '',
  latitude: '',
  longitude: '',
  inv_id: '',
  order_status: '',
  payment_status: '',
  fulfilment_type: 'DELIVERY',
  delivery_type: 'EXPRESS',
  delivery_date: '',
  delivery_time: '',
  delivery_charge: '0',
  packaging_charge: '0',
  products: [{ id: '', quantity: '', name: '' }],
  discount_id: '',
};

function formFromOrder(order: OrderDetail): FormState {
  const addr = order.address ?? { address: '' };
  // `customer` is a bare id on some responses, a nested object on others (see
  // the type comment in `@/api/orders/types`) — handle both.
  const isCustomerObject = typeof order.customer === 'object' && order.customer !== null;
  const customerId = isCustomerObject ? '' : (order.customer as number) ?? '';
  const customerObj = isCustomerObject ? (order.customer as { name?: string; phone_number?: string }) : undefined;
  return {
    customer_id: customerId,
    customer_name: order.customer_name ?? customerObj?.name ?? order.user?.name ?? '',
    phone_number: customerObj?.phone_number ?? order.user?.phone ?? '',
    address: addr.address?.trim() || order.fulfilment_address?.trim() || order.delivery_address?.trim() || '',
    landmark: addr.landmark?.trim() || '',
    pincode: addr.pincode?.trim() || '',
    latitude: addr.latitude != null ? String(addr.latitude) : '',
    longitude: addr.longitude != null ? String(addr.longitude) : '',
    inv_id: order.inventory ?? '',
    order_status: order.status,
    payment_status: order.payment_status,
    fulfilment_type: order.fulfilment_type ?? 'DELIVERY',
    delivery_type: order.delivery_type ?? 'EXPRESS',
    delivery_date: order.delivery_date ?? '',
    delivery_time: order.delivery_time ?? '',
    delivery_charge: String(order.delivery_charge ?? 0),
    packaging_charge: String(order.packaging_charge ?? 0),
    products: (order.cart ?? []).map((item) => ({
      id: item.product_id,
      quantity: String(item.quantity),
      name: item.title || item.product_name || '',
    })),
    discount_id: order.discount ?? '',
  };
}

type Props = {
  colors: CmsThemeColors;
  selectedOrder: OrderDetail | null;
  onSuccess: () => void;
};

export const CreateOrderModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, selectedOrder, onSuccess }, ref) => {
    const isEdit = Boolean(selectedOrder);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(selectedOrder ? formFromOrder(selectedOrder) : EMPTY_FORM);
      setErrors({});
    }, [selectedOrder]);

    const inventories = useInventories();
    const discounts = useDiscounts();
    const tenantUsers = useTenantUsersSearch();
    const createOrder = useCreateOrder();
    const updateOrder = useUpdateOrder();
    const preview = usePreviewOrder();

    const inventoryOptions = React.useMemo(
      () => (inventories.data ?? []).map((i) => ({ value: i.id, label: i.address })),
      [inventories.data]
    );

    const discountOptions: SearchOption[] = React.useMemo(
      () =>
        (discounts.data ?? [])
          .filter((d) => d.is_active)
          .map((d) => {
            const isPct = ['P', 'PERCENTAGE'].includes(d.discount_code_type);
            const valueLabel = isPct ? `${Number(d.value)}% off` : `Rs.${Number(d.value)} off`;
            return { value: d.id, label: `${d.code} — ${valueLabel}` };
          }),
      [discounts.data]
    );

    const customerOptions: SearchOption[] = React.useMemo(
      () =>
        (tenantUsers.data ?? []).map((u) => ({
          value: u.id,
          label: `${u.name} (${u.phone_number})`,
          name: u.name,
          phone_number: u.phone_number,
        })),
      [tenantUsers.data]
    );

    const searchCustomers = React.useCallback(
      async (query: string) => {
        const q = query.trim().toLowerCase();
        if (!q) return customerOptions;
        return customerOptions.filter((o) => o.label.toLowerCase().includes(q));
      },
      [customerOptions]
    );

    const searchDiscounts = React.useCallback(
      async (query: string) => {
        const q = query.trim().toLowerCase();
        if (!q) return discountOptions;
        return discountOptions.filter((o) => o.label.toLowerCase().includes(q));
      },
      [discountOptions]
    );

    const searchProductOptions = React.useCallback(async (query: string) => {
      const results = await searchProducts(query);
      return results.map((p) => ({ value: p.id, label: p.product_name }));
    }, []);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }

    function setProduct(index: number, patch: Partial<ProductLine>) {
      setForm((prev) => {
        const products = [...prev.products];
        products[index] = { ...products[index], ...patch };
        return { ...prev, products };
      });
    }

    function addProductRow() {
      setForm((prev) => ({ ...prev, products: [...prev.products, { id: '', quantity: '', name: '' }] }));
    }

    function removeProductRow(index: number) {
      setForm((prev) => {
        if (prev.products.length === 1) return prev;
        const products = [...prev.products];
        products.splice(index, 1);
        return { ...prev, products };
      });
    }

    const validOrderList = React.useMemo(
      () =>
        form.products
          .filter((p) => p.id !== '' && Number(p.quantity) > 0)
          .map((p) => ({ product_id: p.id as number, quantity: Number(p.quantity) })),
      [form.products]
    );

    const debouncedPreviewKey = useDebouncedValue(
      JSON.stringify({
        inv_id: form.inv_id,
        list: validOrderList,
        dc: form.delivery_charge,
        pc: form.packaging_charge,
        discount: form.discount_id,
      }),
      500
    );

    React.useEffect(() => {
      if (!form.inv_id || validOrderList.length === 0) return;
      preview.mutate({
        inv_id: form.inv_id,
        order_list: validOrderList,
        delivery_charge: Number(form.delivery_charge) || 0,
        packaging_charge: Number(form.packaging_charge) || 0,
        discount_id: form.discount_id || null,
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedPreviewKey]);

    function buildPayload(): CreateOrderPayload {
      return {
        customer_id: form.customer_id,
        customer_name: form.customer_name,
        phone_number: form.phone_number,
        delivery_charge: Number(form.delivery_charge) || 0,
        packaging_charge: Number(form.packaging_charge) || 0,
        address: {
          address: form.address,
          landmark: form.landmark || '',
          pincode: form.pincode || '',
          latitude: form.latitude !== '' ? Number(form.latitude) : null,
          longitude: form.longitude !== '' ? Number(form.longitude) : null,
          label: 'primary',
          primary: true,
          verified: true,
        },
        inv_id: form.inv_id,
        order_status: form.order_status as OrderStatus,
        payment_status: form.payment_status as PaymentStatus,
        fulfilment_type: form.fulfilment_type,
        delivery_type: form.delivery_type,
        ...(form.delivery_date ? { delivery_date: form.delivery_date } : {}),
        ...(form.delivery_time ? { delivery_time: form.delivery_time } : {}),
        order_list: form.products
          .filter((p) => p.id !== '')
          .map((p) => ({ product_id: p.id as number, quantity: p.quantity })),
        discount_id: form.discount_id || null,
        ...(selectedOrder ? { order_id: selectedOrder.id } : {}),
      };
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!String(form.inv_id).trim()) next.inv_id = 'Inventory is required';
      if (!form.order_status) next.order_status = 'Order status is required';
      if (!form.payment_status) next.payment_status = 'Payment status is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    async function handleSubmit() {
      if (!validate()) return;
      const payload = buildPayload();
      const mutation = isEdit ? updateOrder : createOrder;
      mutation.mutate(payload, {
        onSuccess: () => onSuccess(),
      });
    }

    const isSubmitting = createOrder.isPending || updateOrder.isPending;
    const breakdown = preview.data;

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['85%']} title={isEdit ? 'Edit Order' : 'Create Order'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Customer Details">
            <SearchableSelect
              label="Customer"
              placeholder="Select customer"
              value={form.customer_id || undefined}
              displayValue={form.customer_name || undefined}
              onSearch={searchCustomers}
              onSelect={(option) =>
                setForm((prev) => ({
                  ...prev,
                  customer_id: option.value,
                  customer_name: String(option.name ?? option.label),
                  phone_number: String(option.phone_number ?? prev.phone_number),
                }))
              }
            />
            <CmsInput colors={colors} label="Contact Number" value={form.phone_number} onChangeText={(v) => set('phone_number', v)} keyboardType="phone-pad" />
            <CmsInput colors={colors} label="Customer Name" value={form.customer_name} onChangeText={(v) => set('customer_name', v)} />
            <CmsInput colors={colors} label="Address" value={form.address} onChangeText={(v) => set('address', v)} />
            <CmsInput colors={colors} label="Landmark" value={form.landmark} onChangeText={(v) => set('landmark', v)} />
            <CmsInput colors={colors} label="Pincode" value={form.pincode} onChangeText={(v) => set('pincode', v)} keyboardType="number-pad" />
            <CmsInput colors={colors} label="Latitude" value={form.latitude} onChangeText={(v) => set('latitude', v)} keyboardType="numeric" />
            <CmsInput colors={colors} label="Longitude" value={form.longitude} onChangeText={(v) => set('longitude', v)} keyboardType="numeric" />
          </CmsCard>

          <CmsCard colors={colors} title="Order Details">
            <CmsSelect
              colors={colors}
              label="Inventory"
              placeholder="Select inventory"
              value={form.inv_id || undefined}
              options={inventoryOptions}
              onSelect={(v) => set('inv_id', v)}
              error={errors.inv_id}
            />
            <CmsSelect
              colors={colors}
              label="Order Status"
              placeholder="Select order status"
              value={form.order_status || undefined}
              options={ORDER_STATUS_OPTIONS}
              onSelect={(v) => set('order_status', v as OrderStatus)}
              error={errors.order_status}
            />
            <CmsSelect
              colors={colors}
              label="Payment Status"
              placeholder="Select payment status"
              value={form.payment_status || undefined}
              options={PAYMENT_STATUS_OPTIONS}
              onSelect={(v) => set('payment_status', v as PaymentStatus)}
              error={errors.payment_status}
            />
            <CmsSelect
              colors={colors}
              label="Fulfilment Type"
              value={form.fulfilment_type}
              options={[...FULFILMENT_TYPE_OPTIONS]}
              onSelect={(v) => set('fulfilment_type', v as FulfilmentType)}
            />
            <CmsSelect
              colors={colors}
              label="Delivery Type"
              value={form.delivery_type}
              options={[...DELIVERY_TYPE_OPTIONS]}
              onSelect={(v) => set('delivery_type', v as DeliveryType)}
            />
            <CmsInput colors={colors} label="Delivery Date (YYYY-MM-DD)" value={form.delivery_date} onChangeText={(v) => set('delivery_date', v)} />
            <CmsInput colors={colors} label="Delivery Time (HH:mm)" value={form.delivery_time} onChangeText={(v) => set('delivery_time', v)} />
            <CmsInput colors={colors} label="Delivery Charge" value={form.delivery_charge} onChangeText={(v) => set('delivery_charge', v)} keyboardType="numeric" />
            <CmsInput colors={colors} label="Packaging Charge" value={form.packaging_charge} onChangeText={(v) => set('packaging_charge', v)} keyboardType="numeric" />
          </CmsCard>

          <CmsCard colors={colors} title="Products">
            {form.products.map((product, index) => (
              <View key={index} style={st.productRow}>
                <View style={{ flex: 1 }}>
                  <SearchableSelect
                    placeholder="Select product"
                    value={product.id || undefined}
                    displayValue={product.name || undefined}
                    onSearch={searchProductOptions}
                    onSelect={(option) =>
                      setProduct(index, { id: option.value as number, name: option.label })
                    }
                  />
                </View>
                <View style={{ width: 90 }}>
                  <CmsInput
                    colors={colors}
                    placeholder="Qty"
                    value={product.quantity}
                    onChangeText={(v) => setProduct(index, { quantity: v })}
                    keyboardType="numeric"
                  />
                </View>
                <Pressable onPress={() => removeProductRow(index)} style={st.removeBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addProductRow} style={[st.addBtn, { borderColor: colors.accent }]}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Add Product</Text>
            </Pressable>
          </CmsCard>

          <CmsCard colors={colors} title="Discount & Summary">
            <SearchableSelect
              placeholder="Select discount code"
              value={form.discount_id || undefined}
              onSearch={searchDiscounts}
              onSelect={(option) => set('discount_id', option.value)}
            />
            <View style={[st.summaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {breakdown ? (
                <>
                  <CmsSummaryRow label="Subtotal" value={breakdown.subtotal} colors={colors} />
                  {breakdown.discount_amount > 0 && (
                    <CmsSummaryRow label="Discount" value={-breakdown.discount_amount} colors={colors} />
                  )}
                  <CmsSummaryRow label="Delivery Charge" value={breakdown.delivery_charge} colors={colors} />
                  <CmsSummaryRow label="Packaging Charge" value={breakdown.packaging_charge} colors={colors} />
                  <CmsSummaryRow label="Total" value={breakdown.total} colors={colors} bold />
                </>
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Add products and select an inventory to see the price.
                </Text>
              )}
            </View>
          </CmsCard>

          <CmsButton
            colors={colors}
            label={isEdit ? 'Update Order' : 'Create Order'}
            onPress={handleSubmit}
            loading={isSubmitting}
            style={st.submitBtn}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeBtn: {
    padding: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  submitBtn: { marginTop: 4 },
});
