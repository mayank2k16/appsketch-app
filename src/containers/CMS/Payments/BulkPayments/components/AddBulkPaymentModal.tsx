import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentTransactionType } from '@/api/payments';
import { searchEntities, useCreateBulkPayment, usePendingPaymentsForEntity } from '@/api/payments';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsSwitch } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { money } from '../utils';

const TXN_TYPE_OPTIONS = [
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
];

const EMPTY_FORM = {
  entity: '' as string | number,
  entityLabel: '',
  amount: '',
  date: '',
  type: '' as PaymentTransactionType | '',
  refNo: '',
  comment: '',
};

type Props = { colors: CmsThemeColors; onDone: () => void };

export const AddBulkPaymentModal = React.forwardRef<BottomSheetModal, Props>(({ colors, onDone }, ref) => {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [attachments, setAttachments] = React.useState<{ uri: string; name: string; type: string }[]>([]);
  const [markManually, setMarkManually] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<(string | number)[]>([]);
  const [selectedAmount, setSelectedAmount] = React.useState(0);
  const [error, setError] = React.useState('');

  const pendingQuery = usePendingPaymentsForEntity(form.entity || null);
  const createBulkPayment = useCreateBulkPayment();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setAttachments([]);
    setMarkManually(false);
    setSelectedIds([]);
    setSelectedAmount(0);
    setError('');
  }

  const searchEntityOptions = React.useCallback(async (query: string) => {
    const results = await searchEntities(query);
    return results.map((item) => ({ label: item.title, value: item.id }));
  }, []);

  function toggleMark(id: string | number, amount: string | number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setSelectedAmount((amt) => amt - (Number(amount) || 0));
        return prev.filter((p) => p !== id);
      }
      setSelectedAmount((amt) => amt + (Number(amount) || 0));
      return [...prev, id];
    });
  }

  async function handlePickAttachment() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setAttachments((prev) => [
      ...prev,
      ...result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `attachment-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      })),
    ]);
  }

  function handleSubmit() {
    setError('');
    if (!form.entity || !form.amount.trim() || !form.date.trim() || !form.type) {
      setError('Enter all required details.');
      return;
    }
    if (markManually && selectedAmount < Number(form.amount)) {
      setError('Invoices marked sums less than the payment received.');
      return;
    }
    createBulkPayment.mutate(
      {
        entity: form.entity,
        amount: form.amount,
        payment_date: form.date,
        type: form.type as PaymentTransactionType,
        ref_no: form.refNo,
        comment: form.comment,
        payments_to_mark: selectedIds,
        automated_marking: !markManually,
        attachments,
      },
      { onSuccess: () => { resetForm(); onDone(); } }
    );
  }

  const pendingPayments = pendingQuery.data ?? [];

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title="Add Bulk Payment">
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors}>
          <SearchableSelect
            label="Entity"
            placeholder="Select entity"
            value={form.entity || undefined}
            displayValue={form.entityLabel || undefined}
            onSearch={searchEntityOptions}
            onSelect={(option) => {
              set('entity', option.value);
              set('entityLabel', String(option.label));
              setMarkManually(false);
              setSelectedIds([]);
              setSelectedAmount(0);
            }}
          />

          <CmsSelect
            colors={colors}
            label="Select Txn Type"
            placeholder="Select type"
            value={form.type}
            options={TXN_TYPE_OPTIONS}
            onSelect={(v) => set('type', v as PaymentTransactionType)}
          />

          <CmsInput colors={colors} label="Amount" keyboardType="decimal-pad" placeholder="Amount" value={form.amount} onChangeText={(v) => set('amount', v)} />
          <CmsInput colors={colors} label="Date (YYYY-MM-DD)" placeholder="Select date" value={form.date} onChangeText={(v) => set('date', v)} />
          <CmsInput colors={colors} label="Payment Ref No." placeholder="Enter ref no" value={form.refNo} onChangeText={(v) => set('refNo', v)} />
          <CmsInput colors={colors} label="Comments" placeholder="Write a comment…" value={form.comment} onChangeText={(v) => set('comment', v)} />

          <View style={st.group}>
            <Text style={[st.label, { color: colors.textSecondary }]}>Attachments</Text>
            <View style={st.attachmentsRow}>
              {attachments.map((a, i) => (
                <View key={`${a.uri}-${i}`} style={[st.attachmentChip, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.textPrimary, fontSize: 11 }} numberOfLines={1}>
                    {a.name}
                  </Text>
                </View>
              ))}
              <Pressable onPress={handlePickAttachment} style={[st.addAttachmentBtn, { borderColor: colors.border }]}>
                <Ionicons name="attach" size={15} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>Add</Text>
              </Pressable>
            </View>
          </View>

          <CmsSwitch
            colors={colors}
            label="Mark Manually"
            value={markManually}
            onChange={setMarkManually}
          />
          <Text style={[st.hint, { color: colors.textSecondary }]}>
            {markManually ? 'Payments are being marked manually.' : 'Payments will be marked automatically.'}
          </Text>
        </CmsCard>

        {markManually && form.entity ? (
          <CmsCard colors={colors} title="Pending Invoices">
            {pendingQuery.isLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : pendingPayments.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No pending payments for this entity.</Text>
            ) : (
              <>
                {pendingPayments.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggleMark(p.id, p.amount)}
                      style={[st.pendingRow, { borderColor: colors.border }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                          {p.invoice_details?.title ?? 'NA'}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>
                          Rs. {money(p.amount)} · {p.status}
                        </Text>
                      </View>
                      <Ionicons
                        name={checked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={checked ? colors.accent : colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
                <Text style={[st.hint, { color: colors.textSecondary, marginTop: 8 }]}>
                  Marked total: Rs. {money(selectedAmount)}
                </Text>
              </>
            )}
          </CmsCard>
        ) : null}

        {error ? <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: '600' }}>{error}</Text> : null}

        <CmsButton
          colors={colors}
          label={createBulkPayment.isPending ? 'Adding…' : 'Add Bulk Payment'}
          onPress={handleSubmit}
          loading={createBulkPayment.isPending}
        />
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  attachmentChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, maxWidth: 120 },
  addAttachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  hint: { fontSize: 11.5, fontWeight: '600' },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
