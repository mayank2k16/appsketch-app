import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { InvoiceType } from '@/api/invoices';
import {
  searchChallans,
  useCompanyDetails,
  useCreateInvoice,
  useInvoiceDetails,
  useInvoiceInventories,
  useInvoiceProducts,
  useUpdateInvoice,
  useUpdateInvoiceDateAndNo,
} from '@/api/invoices';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsField, CmsInput, CmsModal, CmsSelect, CmsSummaryRow, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';
import {
  EMPTY_PRODUCT_ROW,
  getDefaultInvoiceFormData,
  getHeaderFieldsForInvoiceType,
  INVOICE_TYPE_OPTIONS,
} from '../invoiceTypeConfig';
import type { InvoiceFormData, InvoiceProductRow } from '../invoiceTypeConfig';

type Props = {
  colors: CmsThemeColors;
  invoiceId: number | null;
  openKey: number;
  onDone: () => void;
};

function computeTotals(products: InvoiceProductRow[]) {
  let subtotal = 0;
  let totalFinal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  for (const p of products) {
    subtotal += (Number(p.rate) || 0) * (Number(p.quantity) || 0);
    totalFinal += Number(p.finalPrice) || 0;
    totalCgst += Number(p.cgst) || 0;
    totalSgst += Number(p.sgst) || 0;
  }
  return { subtotal, totalFinal, totalCgst, totalSgst };
}

export const ManageInvoiceModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, invoiceId, openKey, onDone }, ref) => {
    const [form, setForm] = React.useState<InvoiceFormData>(getDefaultInvoiceFormData());
    const isEdit = invoiceId !== null;

    const inventoriesQuery = useInvoiceInventories();
    const companyQuery = useCompanyDetails();
    const detailsQuery = useInvoiceDetails(invoiceId);
    const productsQuery = useInvoiceProducts(form.inventoryId);
    const createInvoice = useCreateInvoice();
    const updateInvoice = useUpdateInvoice();
    const updateDateAndNo = useUpdateInvoiceDateAndNo();

    const inventoryOptions = (inventoriesQuery.data ?? []).map((i) => ({ value: i.id, label: i.name }));
    const productOptions = (productsQuery.data ?? []).map((p) => ({
      value: p.id,
      label: p.product_name,
      rate: p.price?.[0],
      mrp: p.market_price,
    }));

    // Reset the form every time a create/edit target is opened (`openKey`
    // changes on every `present()` call, not just when `invoiceId` changes —
    // two back-to-back "Generate Invoice" taps both have `invoiceId === null`
    // but must not reuse stale entries from a cancelled attempt).
    React.useEffect(() => {
      if (!isEdit) {
        setForm(getDefaultInvoiceFormData());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, isEdit]);

    React.useEffect(() => {
      const invData = detailsQuery.data?.data;
      if (!invData) return;

      let cancelled = false;
      async function populate() {
        let challan: string | number | null = null;
        let challanLabel = '';
        const challanId = invData!.challan_details?.challan_id;
        if (challanId) {
          try {
            const results = await searchChallans(String(challanId));
            if (!cancelled && results[0]) {
              challan = results[0].id;
              challanLabel = results[0].challan_id;
            }
          } catch {
            // no-op — challan field just stays empty if lookup fails
          }
        }

        const items = detailsQuery.data?.items ?? [];
        const addedProducts: InvoiceProductRow[] =
          items.length > 0
            ? items.map((item) => ({
                productId: item.product_id,
                quantity: String(Math.trunc(Number(item.quantity)) || 0),
                mrp: String(item.price ?? ''),
                rate: String(item.price ?? ''),
                cgst: String(item.cgst ?? ''),
                sgst: String(item.sgst ?? ''),
                igst: String(item.igst ?? ''),
                finalPrice: String(item.final_price ?? ''),
              }))
            : [{ ...EMPTY_PRODUCT_ROW }];

        if (cancelled) return;
        setForm({
          invoiceType: (invData!.type as InvoiceType) || 'PROFORMA',
          inventoryId: invData!.inventory ?? null,
          invoiceDate: invData!.invoice_date || new Date(invData!.created_on).toISOString().split('T')[0],
          invoiceNo: invData!.invoice_id || '',
          customerName: invData!.customer_details?.customer_details?.customer_name || '',
          challan,
          challanLabel,
          addedProducts,
          updateSellableInventory: true,
        });
      }
      populate();
      return () => {
        cancelled = true;
      };
    }, [detailsQuery.data]);

    function set<K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    const searchChallanOptions = React.useCallback(async (query: string) => {
      const results = await searchChallans(query);
      return results.map((c) => ({ label: c.challan_id, value: c.id }));
    }, []);

    function handleProductChange(index: number, field: keyof InvoiceProductRow, value: string) {
      setForm((prev) => {
        const rows = [...prev.addedProducts];
        const row = { ...rows[index], [field]: value };
        if (field === 'productId') {
          const selected = productOptions.find((p) => p.value === Number(value));
          if (selected) {
            row.rate = selected.rate !== undefined ? String(selected.rate) : row.rate;
            row.mrp = selected.mrp !== undefined ? String(selected.mrp) : row.mrp;
          }
        }
        const rate = Number(row.rate) || 0;
        const quantity = Number(row.quantity) || 0;
        row.finalPrice = (rate * quantity).toFixed(2);
        rows[index] = row;
        return { ...prev, addedProducts: rows };
      });
    }

    function addProductRow() {
      setForm((prev) => ({ ...prev, addedProducts: [...prev.addedProducts, { ...EMPTY_PRODUCT_ROW }] }));
    }

    function deleteProductRow(index: number) {
      if (index === 0) return;
      setForm((prev) => ({ ...prev, addedProducts: prev.addedProducts.filter((_, i) => i !== index) }));
    }

    function buildPayload() {
      return {
        update_sellable: form.updateSellableInventory,
        inventory_id: form.inventoryId as string | number,
        invoice: {
          type: form.invoiceType,
          customer_name: form.customerName,
          invoice_date: form.invoiceDate,
          invoice_id: form.invoiceNo,
          challan_id: form.challan,
        },
        invoice_items: form.addedProducts.map((p) => ({
          product_id: p.productId,
          quantity: p.quantity,
          rate: p.rate,
          mrp: p.mrp,
          cgst: p.cgst,
          sgst: p.sgst,
          igst: p.igst,
        })),
      };
    }

    function validate() {
      if (!form.inventoryId) {
        toast.error('Select an Inventory');
        return false;
      }
      const challanRequired = getHeaderFieldsForInvoiceType(form.invoiceType).some(
        (f) => f.name === 'challan' && f.required
      );
      if (challanRequired && !form.challan) {
        toast.error('Select a Challan');
        return false;
      }
      return true;
    }

    function handleGenerate() {
      if (!validate()) return;
      createInvoice.mutate(buildPayload(), { onSuccess: () => onDone() });
    }

    function handleUpdate() {
      if (!validate() || invoiceId === null) return;
      updateInvoice.mutate({ id: invoiceId, payload: buildPayload() }, { onSuccess: () => onDone() });
    }

    function handleSaveDateAndNo() {
      if (invoiceId === null) return;
      updateDateAndNo.mutate({
        id: invoiceId,
        payload: { invoice_id: form.invoiceNo, invoice_date: form.invoiceDate, challan_id: form.challan },
      });
    }

    const invData = detailsQuery.data?.data;
    const totals = computeTotals(form.addedProducts);
    const headerFields = getHeaderFieldsForInvoiceType(form.invoiceType);

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['95%']}
        title={isEdit ? `Update ${form.invoiceType} Invoice` : `Generate ${form.invoiceType} Invoice`}
      >
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors}>
            <CmsSelect
              colors={colors}
              label="Invoice Type"
              placeholder="Select invoice type"
              value={form.invoiceType}
              options={INVOICE_TYPE_OPTIONS}
              onSelect={(v) => set('invoiceType', v as InvoiceType)}
            />
            {!isEdit ? (
              <CmsSelect
                colors={colors}
                label="Inventory"
                placeholder="Select inventory"
                value={form.inventoryId ?? undefined}
                options={inventoryOptions}
                onSelect={(v) => set('inventoryId', v)}
              />
            ) : (
              <CmsField label="Inventory" value={inventoryOptions.find((o) => o.value === form.inventoryId)?.label} colors={colors} />
            )}
          </CmsCard>

          {isEdit ? (
            <CmsCard colors={colors}>
              <View style={st.fieldGrid}>
                <CmsField label="Order ID" value={invData?.order_id ? `#${invData.order_id}` : 'NA'} colors={colors} />
                <CmsField label="Invoice Number" value={invData?.invoice_id ?? 'NA'} colors={colors} />
                <CmsField label="Tenant Name" value={companyQuery.data?.title ?? 'NA'} colors={colors} />
                <CmsField label="Tenant Address" value={companyQuery.data?.address ?? 'NA'} colors={colors} />
              </View>
            </CmsCard>
          ) : null}

          <CmsCard colors={colors} title="Invoice Details">
            {headerFields.map((field) => {
              if (field.type === 'date' || field.type === 'text') {
                return (
                  <CmsInput
                    key={field.name}
                    colors={colors}
                    label={field.type === 'date' ? `${field.label} (YYYY-MM-DD)` : field.label}
                    value={form[field.name] as string}
                    onChangeText={(v) => set(field.name as 'invoiceDate' | 'invoiceNo', v)}
                  />
                );
              }
              if (field.type === 'searchable-select') {
                return (
                  <SearchableSelect
                    key={field.name}
                    label={field.label}
                    placeholder="Search challan"
                    value={form.challan ?? undefined}
                    displayValue={form.challanLabel || undefined}
                    onSearch={searchChallanOptions}
                    onSelect={(opt) => {
                      set('challan', opt.value);
                      set('challanLabel', String(opt.label));
                    }}
                    disabled={isEdit}
                  />
                );
              }
              if (field.type === 'checkbox') {
                return (
                  <CmsSwitch
                    key={field.name}
                    colors={colors}
                    label={field.label}
                    value={form.updateSellableInventory}
                    onChange={(v) => set('updateSellableInventory', v)}
                  />
                );
              }
              return null;
            })}
          </CmsCard>

          <CmsCard colors={colors} title="Products">
            {form.addedProducts.map((product, index) => (
              <View key={index} style={[st.productRow, { borderColor: colors.border }]}>
                <CmsSelect
                  colors={colors}
                  label="Product"
                  placeholder={form.inventoryId ? 'Select product' : 'Select an inventory first'}
                  value={product.productId || undefined}
                  options={productOptions}
                  onSelect={(v) => handleProductChange(index, 'productId', String(v))}
                />
                <View style={st.productFieldsGrid}>
                  <CmsInput colors={colors} label="Quantity" keyboardType="number-pad" value={product.quantity} onChangeText={(v) => handleProductChange(index, 'quantity', v)} />
                  <CmsInput colors={colors} label="MRP" keyboardType="decimal-pad" value={product.mrp} onChangeText={(v) => handleProductChange(index, 'mrp', v)} />
                  <CmsInput colors={colors} label="Rate" keyboardType="decimal-pad" value={product.rate} onChangeText={(v) => handleProductChange(index, 'rate', v)} />
                  <CmsInput colors={colors} label="CGST" keyboardType="decimal-pad" value={product.cgst} editable={false} onChangeText={() => {}} />
                  <CmsInput colors={colors} label="SGST" keyboardType="decimal-pad" value={product.sgst} editable={false} onChangeText={() => {}} />
                  <CmsInput colors={colors} label="IGST" keyboardType="decimal-pad" value={product.igst} editable={false} onChangeText={() => {}} />
                  <CmsInput colors={colors} label="Total" value={product.finalPrice} editable={false} onChangeText={() => {}} />
                </View>
                {index > 0 ? (
                  <Pressable onPress={() => deleteProductRow(index)} style={st.deleteRowBtn} hitSlop={6}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {!isEdit ? (
              <CmsButton colors={colors} label="Add Product" variant="ghost" onPress={addProductRow} />
            ) : null}
          </CmsCard>

          <CmsCard colors={colors} title="Summary">
            <CmsSummaryRow
              colors={colors}
              label="Sub Total"
              value={isEdit ? Number(invData?.sub_total ?? invData?.subtotal ?? 0) : totals.subtotal}
            />
            <CmsSummaryRow colors={colors} label="CGST" value={isEdit ? Number(invData?.cgst ?? 0) : totals.totalCgst} />
            <CmsSummaryRow colors={colors} label="SGST" value={isEdit ? Number(invData?.sgst ?? 0) : totals.totalSgst} />
            <CmsSummaryRow
              colors={colors}
              bold
              label="Grand Total"
              value={isEdit ? Number(invData?.final_price ?? 0) : totals.totalFinal}
            />
          </CmsCard>

          {isEdit ? (
            <CmsButton
              colors={colors}
              variant="ghost"
              label={updateDateAndNo.isPending ? 'Saving…' : 'Save Invoice Details'}
              onPress={handleSaveDateAndNo}
              loading={updateDateAndNo.isPending}
            />
          ) : null}

          <CmsButton
            colors={colors}
            label={
              isEdit
                ? updateInvoice.isPending
                  ? 'Updating…'
                  : 'Update Invoice'
                : createInvoice.isPending
                  ? 'Generating…'
                  : 'Generate Invoice'
            }
            onPress={isEdit ? handleUpdate : handleGenerate}
            loading={isEdit ? updateInvoice.isPending : createInvoice.isPending}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productRow: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 10, marginBottom: 10 },
  productFieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deleteRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
});
