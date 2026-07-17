import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { searchInvoices, useCreatePayment } from '@/api/payments';
import type { PaymentTransactionType, PaymentTxnMode } from '@/api/payments';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect } from '../../../components';
import type { CmsThemeColors } from '../../../theme';

const TXN_TYPE_OPTIONS = [
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
];

const TXN_MODE_OPTIONS = [
  { value: 'electronic_cash_on_Delivery', label: 'ECOD' },
  { value: 'wallet', label: 'WALLET' },
  { value: 'Card', label: 'CARD' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'CASH' },
  { value: 'netbanking', label: 'NETBANKING' },
];

const EMPTY_FORM = {
  invoice_id: '' as string | number,
  invoice_label: '',
  amount: '',
  transaction_type: '' as PaymentTransactionType | '',
  mode: '' as PaymentTxnMode | '',
  date: '',
};

type Props = { colors: CmsThemeColors; onDone: () => void };

export const AddPaymentModal = React.forwardRef<BottomSheetModal, Props>(({ colors, onDone }, ref) => {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const createPayment = useCreatePayment();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setErrors((prev) => ({ ...prev, [key]: '' }));
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const searchInvoiceOptions = React.useCallback(async (query: string) => {
    const results = await searchInvoices(query);
    return results.map((item) => ({ label: item.invoice_id, value: item.id }));
  }, []);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.invoice_id) next.invoice_id = 'Invoice is required';
    if (!form.amount.trim()) next.amount = 'Amount is required';
    if (!form.transaction_type) next.transaction_type = 'Transaction type is required';
    if (!form.mode) next.mode = 'Mode is required';
    if (!form.date.trim()) next.date = 'Date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createPayment.mutate(
      {
        invoice_id: form.invoice_id,
        amount: form.amount,
        transaction_type: form.transaction_type as PaymentTransactionType,
        mode: form.mode as PaymentTxnMode,
        date: form.date,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          onDone();
        },
      }
    );
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['80%']} title="Add Payment">
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors}>
          <SearchableSelect
            label="Invoice"
            placeholder="Select invoice"
            value={form.invoice_id || undefined}
            displayValue={form.invoice_label || undefined}
            onSearch={searchInvoiceOptions}
            onSelect={(option) => {
              set('invoice_id', option.value);
              set('invoice_label', String(option.label));
            }}
            error={errors.invoice_id}
          />

          <CmsInput
            colors={colors}
            label="Amount"
            placeholder="Amount"
            keyboardType="decimal-pad"
            value={form.amount}
            onChangeText={(v) => set('amount', v)}
            error={errors.amount}
          />

          <CmsSelect
            colors={colors}
            label="Payment Type"
            placeholder="Select payment type"
            value={form.transaction_type}
            options={TXN_TYPE_OPTIONS}
            onSelect={(v) => set('transaction_type', v as PaymentTransactionType)}
            error={errors.transaction_type}
          />

          <CmsSelect
            colors={colors}
            label="Payment Mode"
            placeholder="Select payment mode"
            value={form.mode}
            options={TXN_MODE_OPTIONS}
            onSelect={(v) => set('mode', v as PaymentTxnMode)}
            error={errors.mode}
          />

          <CmsInput
            colors={colors}
            label="Date (YYYY-MM-DD)"
            placeholder="Select date"
            value={form.date}
            onChangeText={(v) => set('date', v)}
            error={errors.date}
          />
        </CmsCard>

        <CmsButton
          colors={colors}
          label={createPayment.isPending ? 'Adding…' : 'Add Payment'}
          onPress={handleSubmit}
          loading={createPayment.isPending}
        />
      </BottomSheetScrollView>
    </CmsModal>
  );
});
