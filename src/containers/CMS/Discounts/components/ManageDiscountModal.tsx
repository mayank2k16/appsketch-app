import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useAllEntities, useInvoiceInventories } from '@/api/invoices';
import { useTenantUsersSearch } from '@/api/orders';
import { useLeafCategories, useProducts } from '@/api/products';
import type { DiscountAppliedOn, DiscountAttribute, DiscountCodeItem, DiscountPayload } from '@/api/discounts';
import { useAllInvoicesForDiscount, useCreateDiscount, useUpdateDiscount } from '@/api/discounts';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { ScopedItemsMultiSelect } from './ScopedItemsMultiSelect';

// Help text ported from Vite's `FIELD_INFO` — shown as an always-visible
// caption under each field instead of a hover-triggered `InfoTip` (no hover
// on mobile; a per-field icon+popover would be more component than 15
// one-line hints warrant).
const FIELD_INFO = {
  discountCode: 'The code customers type at checkout to redeem this offer, e.g. SAVE40. Must be unique — stored and matched in uppercase.',
  codeDesc: 'A short, customer-facing description of the offer, shown wherever the coupon is displayed.',
  discountStartTime: 'Date and time the code becomes usable. Before this moment the code is not yet active.',
  discountEndTime: 'Date and time the code stops working. After this moment the code is expired.',
  maxDiscount: 'Upper cap on the rupee amount this code can take off a single order.',
  minOrderValue: 'Minimum cart value required before the code can be applied.',
  discountType: 'Percentage takes a % off the eligible total (capped by Maximum Discount). Absolute takes a fixed rupee amount off.',
  discountValue: 'The number used with Discount Type — percent for Percentage, rupee amount for Absolute.',
  applyType: 'Cart spreads the discount across the whole eligible cart total. Items applies it per-eligible-item.',
  recursionDepth: 'For recurring discounts, how many times it may repeat. Leave at 0 unless this is a recurring offer.',
  appliedOn: 'What the discount is scoped to. Pick specific records below, or use "Apply For All".',
  applyOnAllItems: 'When on, the discount applies to every record of the selected scope and you don’t need to pick specific items below.',
  isActive: 'Master on/off switch — turn off to disable the code without deleting it.',
  isRecurring: 'Allows the discount to apply repeatedly (used with Recursion Depth) rather than once per order.',
  oneTimePerUser: 'Each customer can redeem this code only once, ever.',
  firstOrderPerUser: 'Restricts the code to a customer’s very first order.',
};

const APPLIED_ON_OPTIONS: { value: DiscountAppliedOn; label: string }[] = [
  { value: 'inventory', label: 'Inventory' },
  { value: 'products', label: 'Products' },
  { value: 'customer', label: 'Customer' },
  { value: 'category', label: 'Category' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'entity', label: 'Entity' },
];

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type FormState = {
  discountCode: string;
  codeDesc: string;
  discountStartTime: string;
  discountEndTime: string;
  maxDiscount: string;
  minOrderValue: string;
  appliedOn: DiscountAppliedOn | '';
  discountType: 'Percentage' | 'Absolute';
  discountValue: string;
  applyType: 'cart' | 'items';
  firstOrderPerUser: boolean;
  oneTimePerUser: boolean;
  applyOnAllItems: boolean;
  selectedItems: (string | number)[];
  isActive: boolean;
  isRecurring: boolean;
  recursionDepth: string;
};

function getDefaultForm(): FormState {
  return {
    discountCode: '',
    codeDesc: '',
    discountStartTime: formatDateTimeLocal(new Date()),
    discountEndTime: '',
    maxDiscount: '',
    minOrderValue: '',
    appliedOn: '',
    discountType: 'Percentage',
    discountValue: '',
    applyType: 'cart',
    firstOrderPerUser: false,
    oneTimePerUser: false,
    applyOnAllItems: false,
    selectedItems: [],
    isActive: true,
    isRecurring: false,
    recursionDepth: '0',
  };
}

const APPLIED_ON_KEY_BY_VALUE: Record<DiscountAppliedOn, keyof Pick<DiscountAttribute, 'category' | 'inventory' | 'product' | 'invoice' | 'customer' | 'entity'>> = {
  inventory: 'inventory',
  products: 'product',
  customer: 'customer',
  category: 'category',
  invoices: 'invoice',
  entity: 'entity',
};

type Props = {
  colors: CmsThemeColors;
  discount: DiscountCodeItem | null;
  openKey: number;
  onDone: () => void;
};

export const ManageDiscountModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, discount, openKey, onDone }, ref) => {
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const isEdit = discount !== null;

    React.useEffect(() => {
      if (discount) {
        const attr = discount.discount_attributes?.[0];
        const appliedOn = (attr?.applied_on as DiscountAppliedOn) || '';
        const selectedItems = appliedOn ? (attr?.[APPLIED_ON_KEY_BY_VALUE[appliedOn]] ?? []) : [];
        setForm({
          discountCode: discount.code || '',
          codeDesc: discount.code_description || '',
          discountStartTime: discount.start_time ? formatDateTimeLocal(new Date(discount.start_time)) : formatDateTimeLocal(new Date()),
          discountEndTime: discount.end_time ? formatDateTimeLocal(new Date(discount.end_time)) : '',
          maxDiscount: String(discount.maximum_discount ?? ''),
          minOrderValue: String(discount.minimum_order_value ?? ''),
          appliedOn,
          discountType: discount.discount_code_type === 'ABSOLUTE' ? 'Absolute' : 'Percentage',
          discountValue: String(discount.value ?? ''),
          applyType: (discount.apply_type as 'cart' | 'items') || 'cart',
          firstOrderPerUser: attr?.first_order_per_user || false,
          oneTimePerUser: attr?.one_time_per_user || false,
          applyOnAllItems: attr?.apply_on_all || false,
          selectedItems,
          isActive: discount.is_active ?? true,
          isRecurring: attr?.recurring || false,
          recursionDepth: String(attr?.recursion_depth ?? 0),
        });
      } else {
        setForm(getDefaultForm());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, discount]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    const inventoriesQuery = useInvoiceInventories();
    const productsQuery = useProducts();
    const categoriesQuery = useLeafCategories();
    const customersQuery = useTenantUsersSearch();
    const entitiesQuery = useAllEntities();
    const invoicesQuery = useAllInvoicesForDiscount(form.appliedOn === 'invoices');

    const createDiscount = useCreateDiscount();
    const updateDiscount = useUpdateDiscount();

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    function validate() {
      const next: Record<string, string> = {};
      if (!form.discountCode.trim()) next.discountCode = 'Discount Code is required';
      if (!form.maxDiscount.trim()) next.maxDiscount = 'Max Discount is required';
      if (!form.discountValue.trim()) next.discountValue = 'Discount Value is required';
      if (!form.appliedOn) next.appliedOn = 'Discount to be applied on is required';
      if (!form.minOrderValue.trim()) next.minOrderValue = 'Minimum Order Value is required';
      if (!form.discountStartTime.trim()) next.discountStartTime = 'Discount Start Time is required';
      if (!form.discountEndTime.trim()) next.discountEndTime = 'Discount End Time is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function buildPayload(): DiscountPayload {
      const scopeKey = form.appliedOn ? APPLIED_ON_KEY_BY_VALUE[form.appliedOn] : null;
      return {
        start_time: form.discountStartTime,
        end_time: form.discountEndTime,
        discount_code_type: form.discountType.toUpperCase(),
        value: form.discountValue,
        maximum_discount: form.maxDiscount,
        code: form.discountCode,
        code_description: form.codeDesc,
        is_active: form.isActive,
        minimum_order_value: form.minOrderValue,
        apply_type: form.applyType,
        discount_attributes: [
          {
            applied_on: form.appliedOn,
            apply_on_all: form.applyOnAllItems,
            category: scopeKey === 'category' ? form.selectedItems : [],
            inventory: scopeKey === 'inventory' ? form.selectedItems : [],
            product: scopeKey === 'product' ? form.selectedItems : [],
            invoice: scopeKey === 'invoice' ? form.selectedItems : [],
            customer: scopeKey === 'customer' ? form.selectedItems : [],
            entity: scopeKey === 'entity' ? form.selectedItems : [],
            first_order_per_user: form.firstOrderPerUser,
            one_time_per_user: form.oneTimePerUser,
            recurring: form.isRecurring,
            recursion_depth: Number(form.recursionDepth) || 0,
            attribute_type: 'transactional',
          },
        ],
      };
    }

    function handleSave() {
      if (!validate()) return;
      const payload = buildPayload();
      if (isEdit && discount) {
        updateDiscount.mutate({ id: discount.id, payload }, { onSuccess: () => onDone() });
      } else {
        createDiscount.mutate(payload, { onSuccess: () => onDone() });
      }
    }

    function renderScopedItemsPicker() {
      const scopeLabel = APPLIED_ON_OPTIONS.find((o) => o.value === form.appliedOn)?.label ?? 'items';
      const label = `Select ${scopeLabel}`;
      const commonProps = {
        colors,
        label,
        value: form.selectedItems,
        onChange: (v: (string | number)[]) => set('selectedItems', v),
        disabled: form.applyOnAllItems,
      };
      switch (form.appliedOn) {
        case 'inventory':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={inventoriesQuery.data ?? []}
              loading={inventoriesQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.name}
            />
          );
        case 'products':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={productsQuery.data ?? []}
              loading={productsQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.product_name}
            />
          );
        case 'category':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={categoriesQuery.data ?? []}
              loading={categoriesQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.name}
            />
          );
        case 'customer':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={customersQuery.data ?? []}
              loading={customersQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.name}
            />
          );
        case 'invoices':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={invoicesQuery.data ?? []}
              loading={invoicesQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.invoice_id}
            />
          );
        case 'entity':
          return (
            <ScopedItemsMultiSelect
              {...commonProps}
              items={entitiesQuery.data ?? []}
              loading={entitiesQuery.isLoading}
              getId={(i) => i.id}
              getLabel={(i) => i.title}
            />
          );
        default:
          return null;
      }
    }

    const isSubmitting = createDiscount.isPending || updateDiscount.isPending;

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['95%']} title={isEdit ? 'Update Discount Code' : 'Create Discount Code'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Basic Info">
            <CmsInput colors={colors} label="Discount Code" placeholder="Enter discount code" value={form.discountCode} onChangeText={(v) => set('discountCode', v)} error={errors.discountCode} />
            <Hint text={FIELD_INFO.discountCode} colors={colors} />
            <CmsInput colors={colors} label="Description" placeholder="Enter description" value={form.codeDesc} onChangeText={(v) => set('codeDesc', v)} />
            <Hint text={FIELD_INFO.codeDesc} colors={colors} />
          </CmsCard>

          <CmsCard colors={colors} title="Timing">
            <CmsInput colors={colors} label="Start Time (YYYY-MM-DDTHH:mm)" value={form.discountStartTime} onChangeText={(v) => set('discountStartTime', v)} error={errors.discountStartTime} />
            <Hint text={FIELD_INFO.discountStartTime} colors={colors} />
            <CmsInput colors={colors} label="End Time (YYYY-MM-DDTHH:mm)" value={form.discountEndTime} onChangeText={(v) => set('discountEndTime', v)} error={errors.discountEndTime} />
            <Hint text={FIELD_INFO.discountEndTime} colors={colors} />
          </CmsCard>

          <CmsCard colors={colors} title="Value">
            <CmsSelect colors={colors} label="Discount Type" value={form.discountType} options={[{ value: 'Percentage', label: 'Percentage' }, { value: 'Absolute', label: 'Absolute' }]} onSelect={(v) => set('discountType', v as 'Percentage' | 'Absolute')} />
            <Hint text={FIELD_INFO.discountType} colors={colors} />
            <CmsInput colors={colors} label="Discount Value" keyboardType="decimal-pad" value={form.discountValue} onChangeText={(v) => set('discountValue', v)} error={errors.discountValue} />
            <Hint text={FIELD_INFO.discountValue} colors={colors} />
            <CmsInput colors={colors} label="Maximum Discount" keyboardType="decimal-pad" value={form.maxDiscount} onChangeText={(v) => set('maxDiscount', v)} error={errors.maxDiscount} />
            <Hint text={FIELD_INFO.maxDiscount} colors={colors} />
            <CmsInput colors={colors} label="Minimum Order Value" keyboardType="decimal-pad" value={form.minOrderValue} onChangeText={(v) => set('minOrderValue', v)} error={errors.minOrderValue} />
            <Hint text={FIELD_INFO.minOrderValue} colors={colors} />
            <CmsSelect colors={colors} label="Apply Type" value={form.applyType} options={[{ value: 'cart', label: 'Cart' }, { value: 'items', label: 'Items' }]} onSelect={(v) => set('applyType', v as 'cart' | 'items')} />
            <Hint text={FIELD_INFO.applyType} colors={colors} />
            <CmsInput colors={colors} label="Recursion Depth" keyboardType="number-pad" value={form.recursionDepth} onChangeText={(v) => set('recursionDepth', v)} />
            <Hint text={FIELD_INFO.recursionDepth} colors={colors} />
          </CmsCard>

          <CmsCard colors={colors} title="Scope">
            <CmsSelect colors={colors} label="Apply On" placeholder="Select scope" value={form.appliedOn} options={APPLIED_ON_OPTIONS} onSelect={(v) => set('appliedOn', v as DiscountAppliedOn)} error={errors.appliedOn} />
            <Hint text={FIELD_INFO.appliedOn} colors={colors} />
            <CmsSwitch colors={colors} label="Apply For All" value={form.applyOnAllItems} onChange={(v) => set('applyOnAllItems', v)} />
            <Hint text={FIELD_INFO.applyOnAllItems} colors={colors} />
            {renderScopedItemsPicker()}
          </CmsCard>

          <CmsCard colors={colors} title="Rules">
            <CmsSwitch colors={colors} label="Is Active" value={form.isActive} onChange={(v) => set('isActive', v)} />
            <Hint text={FIELD_INFO.isActive} colors={colors} />
            <CmsSwitch colors={colors} label="Recurring" value={form.isRecurring} onChange={(v) => set('isRecurring', v)} />
            <Hint text={FIELD_INFO.isRecurring} colors={colors} />
            <CmsSwitch colors={colors} label="One Time Per User" value={form.oneTimePerUser} onChange={(v) => set('oneTimePerUser', v)} />
            <Hint text={FIELD_INFO.oneTimePerUser} colors={colors} />
            <CmsSwitch colors={colors} label="First Order Per User" value={form.firstOrderPerUser} onChange={(v) => set('firstOrderPerUser', v)} />
            <Hint text={FIELD_INFO.firstOrderPerUser} colors={colors} />
          </CmsCard>

          <CmsButton
            colors={colors}
            label={isSubmitting ? 'Processing…' : isEdit ? 'Update Discount' : 'Create Discount'}
            onPress={handleSave}
            loading={isSubmitting}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

function Hint({ text, colors }: { text: string; colors: CmsThemeColors }) {
  return <Text style={[st.hint, { color: colors.textSecondary }]}>{text}</Text>;
}

const st = StyleSheet.create({
  hint: { fontSize: 11, lineHeight: 15, marginTop: -6 },
});
