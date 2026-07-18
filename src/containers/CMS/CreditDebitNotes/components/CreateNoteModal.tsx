import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CreateNoteInvoiceItem, CreateNoteProductItem, NoteType, SellableInstance } from '@/api/credit-debit-notes';
import { fetchSellableInstances, useCreateNote } from '@/api/credit-debit-notes';
import { useCompanyDetails } from '@/api/invoices';
import { searchEntities, searchInvoices } from '@/api/payments';
import type { EntityOption } from '@/api/payments';
import { useProductInventories, useProducts } from '@/api/products';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { CmsButton, CmsCard, CmsField, CmsInput, CmsModal, CmsSelect, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

const NOTE_TYPE_OPTIONS = [
  { value: 'CREDIT', label: 'CREDIT' },
  { value: 'DEBIT', label: 'DEBIT' },
];

const APPLY_ON_OPTIONS = [
  { value: 'INVOICES', label: 'Invoice' },
  { value: 'PRODUCTS', label: 'Product' },
];

type InvoiceRow = { invoiceId: string | number | ''; invoiceLabel: string; amount: string };
const EMPTY_INVOICE_ROW: InvoiceRow = { invoiceId: '', invoiceLabel: '', amount: '' };

type ProductRow = {
  productId: number | '';
  productName: string;
  quantity: string;
  hsnCode: string;
  gst: string;
  mrp: string;
  rate: string;
  finalPrice: string;
  batchNo: string;
  serialNo: string;
  availableSellables: SellableInstance[];
  selectedSellableIndex: number | null;
  sellablesLoading: boolean;
};
const EMPTY_PRODUCT_ROW: ProductRow = {
  productId: '',
  productName: '',
  quantity: '',
  hsnCode: '',
  gst: '',
  mrp: '',
  rate: '',
  finalPrice: '',
  batchNo: '',
  serialNo: '',
  availableSellables: [],
  selectedSellableIndex: null,
  sellablesLoading: false,
};

function computeFinalPrice(quantity: string, rate: string, gst: string): string {
  const q = Number(quantity) || 0;
  const r = Number(rate) || 0;
  const g = Number(gst) || 0;
  return (q * (r + (g / 100) * r)).toFixed(2);
}

type Props = { colors: CmsThemeColors; onDone: () => void };

export const CreateNoteModal = React.forwardRef<BottomSheetModal, Props>(({ colors, onDone }, ref) => {
  const [noteType, setNoteType] = React.useState<NoteType>('CREDIT');
  const [refNo, setRefNo] = React.useState('');
  const [inventoryId, setInventoryId] = React.useState<number | ''>('');
  const [entity, setEntity] = React.useState<EntityOption | null>(null);
  const [applyOn, setApplyOn] = React.useState<'INVOICES' | 'PRODUCTS'>('INVOICES');
  const [updateSellable, setUpdateSellable] = React.useState(false);
  const [invoiceRows, setInvoiceRows] = React.useState<InvoiceRow[]>([{ ...EMPTY_INVOICE_ROW }]);
  const [productRows, setProductRows] = React.useState<ProductRow[]>([{ ...EMPTY_PRODUCT_ROW }]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const companyDetails = useCompanyDetails();
  const inventoriesQuery = useProductInventories();
  const productsQuery = useProducts();
  const createNote = useCreateNote();

  const inventoryOptions = React.useMemo(
    () => (inventoriesQuery.data ?? []).map((inv) => ({ value: inv.id, label: inv.name })),
    [inventoriesQuery.data]
  );

  function resetForm() {
    setNoteType('CREDIT');
    setRefNo('');
    setInventoryId('');
    setEntity(null);
    setApplyOn('INVOICES');
    setUpdateSellable(false);
    setInvoiceRows([{ ...EMPTY_INVOICE_ROW }]);
    setProductRows([{ ...EMPTY_PRODUCT_ROW }]);
    setErrors({});
  }

  const searchEntityOptions = React.useCallback(async (query: string) => {
    const results = await searchEntities(query);
    return results.map((item) => ({ label: item.title, value: item.id, ...item }));
  }, []);

  const searchInvoiceOptions = React.useCallback(async (query: string) => {
    const results = await searchInvoices(query);
    return results.map((item) => ({ label: item.invoice_id, value: item.id }));
  }, []);

  const searchProductOptions = React.useCallback(
    async (query: string) => {
      const products = productsQuery.data ?? [];
      const q = query.trim().toLowerCase();
      const filtered = q ? products.filter((p) => p.product_name?.toLowerCase().includes(q)) : products;
      return filtered.slice(0, 30).map((p) => ({ label: p.product_name, value: p.id }));
    },
    [productsQuery.data]
  );

  // ── Invoice rows ──────────────────────────────────────────────────────
  function updateInvoiceRow(index: number, patch: Partial<InvoiceRow>) {
    setInvoiceRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addInvoiceRow() {
    setInvoiceRows((prev) => [...prev, { ...EMPTY_INVOICE_ROW }]);
  }
  function removeInvoiceRow(index: number) {
    if (index === 0) return;
    setInvoiceRows((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Product rows ──────────────────────────────────────────────────────
  function updateProductRow(index: number, patch: Partial<ProductRow>) {
    setProductRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addProductRow() {
    setProductRows((prev) => [...prev, { ...EMPTY_PRODUCT_ROW }]);
  }
  function removeProductRow(index: number) {
    if (index === 0) return;
    setProductRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSelectProduct(index: number, option: { value: string | number; label: string }) {
    updateProductRow(index, {
      productId: option.value as number,
      productName: option.label,
      batchNo: '',
      serialNo: '',
      mrp: '',
      rate: '',
      finalPrice: '',
      availableSellables: [],
      selectedSellableIndex: null,
      sellablesLoading: Boolean(entity && inventoryId),
    });
    if (!entity || !inventoryId) return;
    try {
      const sellables = await fetchSellableInstances({
        entityId: entity.id,
        productId: option.value as number,
        inventoryId: Number(inventoryId),
      });
      updateProductRow(index, { availableSellables: sellables, sellablesLoading: false });
    } catch {
      updateProductRow(index, { sellablesLoading: false });
    }
  }

  function handleSelectSellable(index: number, sellableIndex: number) {
    setProductRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const sellable = row.availableSellables[sellableIndex];
        return {
          ...row,
          selectedSellableIndex: sellableIndex,
          batchNo: sellable?.batch_number ?? '',
          serialNo: sellable?.serial_number ?? '',
          mrp: '',
          rate: '',
          finalPrice: '',
        };
      })
    );
  }

  function handleSelectRate(index: number, rateIndex: number) {
    setProductRows((prev) =>
      prev.map((row, i) => {
        if (i !== index || row.selectedSellableIndex === null) return row;
        const rate = row.availableSellables[row.selectedSellableIndex]?.rates?.[rateIndex];
        if (!rate) return row;
        const nextRate = String(rate.price ?? '');
        const nextMrp = String(rate.market_price ?? '');
        return {
          ...row,
          rate: nextRate,
          mrp: nextMrp,
          finalPrice: computeFinalPrice(row.quantity, nextRate, row.gst),
        };
      })
    );
  }

  function handleQuantityRateGstChange(index: number, patch: Partial<Pick<ProductRow, 'quantity' | 'rate' | 'gst'>>) {
    setProductRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        return { ...next, finalPrice: computeFinalPrice(next.quantity, next.rate, next.gst) };
      })
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!inventoryId) next.inventory = 'Select an inventory';
    if (!entity) next.entity = 'Select an entity';
    if (!refNo.trim()) next.refNo = 'Enter a reference number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate() || !entity || !inventoryId) return;

    const note_items: CreateNoteInvoiceItem[] | CreateNoteProductItem[] =
      applyOn === 'INVOICES'
        ? invoiceRows
            .filter((r) => r.invoiceId !== '')
            .map((r) => ({ invoice_id: r.invoiceId, rate: r.amount }))
        : productRows
            .filter((r) => r.productId !== '')
            .map((r) => ({
              product_id: r.productId as number,
              batch_number: r.batchNo,
              serial_number: r.serialNo,
              quantity: r.quantity,
              rate: r.rate,
              mrp: r.mrp,
              hsn_code: r.hsnCode,
            }));

    createNote.mutate(
      {
        inventory_id: Number(inventoryId),
        update_sellable: updateSellable,
        note: {
          applied_on: applyOn,
          reference_number: refNo,
          type: noteType,
          entity_id: entity.id,
        },
        note_items,
      },
      {
        onSuccess: () => {
          resetForm();
          onDone();
        },
      }
    );
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['92%']} title="Create Debit/Credit Note">
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors}>
          <CmsSelect
            colors={colors}
            label="Note Type"
            value={noteType}
            options={NOTE_TYPE_OPTIONS}
            onSelect={(v) => setNoteType(v as NoteType)}
          />
          <CmsInput
            colors={colors}
            label="Reference Number"
            placeholder="Enter Ref No."
            value={refNo}
            onChangeText={setRefNo}
            error={errors.refNo}
          />
          <CmsSelect
            colors={colors}
            label="Inventory"
            placeholder="Select inventory"
            value={inventoryId}
            options={inventoryOptions}
            onSelect={(v) => setInventoryId(v as number)}
            error={errors.inventory}
          />
        </CmsCard>

        {companyDetails.data ? (
          <CmsCard colors={colors} title="Tenant Details">
            <CmsField colors={colors} label="Name" value={companyDetails.data.title} />
            <CmsField colors={colors} label="Address" value={companyDetails.data.address} />
          </CmsCard>
        ) : null}

        <CmsCard colors={colors} title="Entity Details">
          <SearchableSelect
            label="Entity"
            placeholder="Search entity…"
            value={entity?.id}
            displayValue={entity?.title}
            onSearch={searchEntityOptions}
            onSelect={(option) => setEntity(option as unknown as EntityOption)}
            error={errors.entity}
          />
          {entity ? (
            <View style={st.entityDetail}>
              <CmsField colors={colors} label="Address" value={entity.address} />
              <CmsField colors={colors} label="DL No" value={entity.dl_no} />
              <CmsField colors={colors} label="GSTIN" value={entity.gstin} />
              <CmsField colors={colors} label="Phone" value={entity.phone_number} />
            </View>
          ) : null}
        </CmsCard>

        <CmsCard colors={colors}>
          <CmsSelect
            colors={colors}
            label="Apply On"
            value={applyOn}
            options={APPLY_ON_OPTIONS}
            onSelect={(v) => setApplyOn(v as 'INVOICES' | 'PRODUCTS')}
          />
        </CmsCard>

        {applyOn === 'INVOICES' ? (
          <CmsCard colors={colors} title="Invoices">
            {invoiceRows.map((row, index) => (
              <View key={index} style={st.row}>
                <View style={{ flex: 1 }}>
                  <SearchableSelect
                    placeholder="Select invoice"
                    value={row.invoiceId || undefined}
                    displayValue={row.invoiceLabel || undefined}
                    onSearch={searchInvoiceOptions}
                    onSelect={(option) =>
                      updateInvoiceRow(index, { invoiceId: option.value, invoiceLabel: String(option.label) })
                    }
                  />
                </View>
                <View style={{ width: 100 }}>
                  <CmsInput
                    colors={colors}
                    placeholder="Amount"
                    keyboardType="decimal-pad"
                    value={row.amount}
                    onChangeText={(v) => updateInvoiceRow(index, { amount: v })}
                  />
                </View>
                {index > 0 ? (
                  <Pressable onPress={() => removeInvoiceRow(index)} style={st.removeBtn} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Pressable onPress={addInvoiceRow} style={[st.addBtn, { borderColor: colors.accent }]}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Add Invoice</Text>
            </Pressable>
          </CmsCard>
        ) : (
          <CmsCard colors={colors} title="Products">
            {productRows.map((row, index) => {
              const sellableOptions = row.availableSellables.map((s, i) => ({
                value: i,
                label: `Batch ${s.batch_number || '-'} · Serial ${s.serial_number || '-'}`,
              }));
              const rateOptions =
                row.selectedSellableIndex !== null
                  ? (row.availableSellables[row.selectedSellableIndex]?.rates ?? []).map((r, i) => ({
                      value: i,
                      label: `₹${r.price ?? '-'} (MRP ₹${r.market_price ?? '-'})${r.contract_title ? ` — ${r.contract_title}` : ''}`,
                    }))
                  : [];

              return (
                <View key={index} style={[st.productCard, { borderColor: colors.border }]}>
                  <View style={st.productCardHeader}>
                    <Text style={[st.productCardTitle, { color: colors.textSecondary }]}>Product {index + 1}</Text>
                    {index > 0 ? (
                      <Pressable onPress={() => removeProductRow(index)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>

                  <SearchableSelect
                    placeholder="Select product"
                    value={row.productId || undefined}
                    displayValue={row.productName || undefined}
                    onSearch={searchProductOptions}
                    onSelect={(option) => handleSelectProduct(index, option)}
                  />

                  <View style={st.row}>
                    <View style={{ flex: 1 }}>
                      <CmsInput
                        colors={colors}
                        label="Quantity"
                        keyboardType="numeric"
                        value={row.quantity}
                        onChangeText={(v) => handleQuantityRateGstChange(index, { quantity: v })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CmsInput
                        colors={colors}
                        label="HSN Code"
                        value={row.hsnCode}
                        onChangeText={(v) => updateProductRow(index, { hsnCode: v })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CmsInput
                        colors={colors}
                        label="GST"
                        keyboardType="numeric"
                        value={row.gst}
                        onChangeText={(v) => handleQuantityRateGstChange(index, { gst: v })}
                      />
                    </View>
                  </View>

                  {row.sellablesLoading ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Loading stock…</Text>
                  ) : sellableOptions.length > 0 ? (
                    <CmsSelect
                      colors={colors}
                      label="Batch / Serial"
                      placeholder="Select batch / serial"
                      value={row.selectedSellableIndex ?? undefined}
                      options={sellableOptions}
                      onSelect={(v) => handleSelectSellable(index, v as number)}
                    />
                  ) : null}

                  {rateOptions.length > 0 ? (
                    <CmsSelect
                      colors={colors}
                      label="Rate / MRP (contract)"
                      placeholder="Pick a contract rate"
                      options={rateOptions}
                      onSelect={(v) => handleSelectRate(index, v as number)}
                    />
                  ) : null}

                  <View style={st.row}>
                    <View style={{ flex: 1 }}>
                      <CmsInput
                        colors={colors}
                        label="MRP"
                        keyboardType="decimal-pad"
                        value={row.mrp}
                        onChangeText={(v) => updateProductRow(index, { mrp: v })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CmsInput
                        colors={colors}
                        label="Rate"
                        keyboardType="decimal-pad"
                        value={row.rate}
                        onChangeText={(v) => handleQuantityRateGstChange(index, { rate: v })}
                      />
                    </View>
                  </View>

                  <CmsField colors={colors} label="Final Price" value={row.finalPrice || '0.00'} />
                </View>
              );
            })}
            <Pressable onPress={addProductRow} style={[st.addBtn, { borderColor: colors.accent }]}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>Add Product</Text>
            </Pressable>
          </CmsCard>
        )}

        <CmsCard colors={colors}>
          <CmsSwitch colors={colors} label="Update Sellable" value={updateSellable} onChange={setUpdateSellable} />
        </CmsCard>

        <CmsButton
          colors={colors}
          label={createNote.isPending ? 'Saving…' : `Save ${noteType === 'CREDIT' ? 'Credit' : 'Debit'} Note`}
          onPress={handleSubmit}
          loading={createNote.isPending}
        />
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  entityDetail: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  productCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productCardTitle: cmsType.fieldLabel,
});
