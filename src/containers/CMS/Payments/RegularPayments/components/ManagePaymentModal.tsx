import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PaymentListItem } from '@/api/payments';
import {
  useCreatePaymentComment,
  useDeletePaymentAttachment,
  usePaymentAttachments,
  usePaymentComments,
  useUpdatePayment,
  useUploadPaymentAttachment,
} from '@/api/payments';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsStatusBadge } from '../../../components';
import type { CmsThemeColors } from '../../../theme';
import { cmsType } from '../../../theme/cms-typography';
import { getPaymentStatusMeta } from '../../../Orders/utils';
import { money } from '../utils';

const TXN_MODE_OPTIONS = [
  { value: 'electronic_cash_on_Delivery', label: 'ECOD' },
  { value: 'wallet', label: 'WALLET' },
  { value: 'Card', label: 'CARD' },
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'CASH' },
  { value: 'netbanking', label: 'NETBANKING' },
];

type Props = { colors: CmsThemeColors; payment: PaymentListItem | null };

/** Merges Vite's `PaymentModal.jsx` (update amount/ref/txn-mode/date +
 * attachments) and `CreateComment.jsx` (comment thread) into one modal —
 * they were only ever shown together in Vite (`CreateComment` was rendered
 * inline at the bottom of `PaymentModal`). */
export const ManagePaymentModal = React.forwardRef<BottomSheetModal, Props>(({ colors, payment }, ref) => {
  const [refNo, setRefNo] = React.useState('');
  const [txnMode, setTxnMode] = React.useState('');
  const [date, setDate] = React.useState('');
  const [remaining, setRemaining] = React.useState(0);
  const [paid, setPaid] = React.useState(0);
  const [isPaid, setIsPaid] = React.useState(false);
  const [comment, setComment] = React.useState('');

  React.useEffect(() => {
    if (!payment) return;
    setRefNo(payment.ref_no ?? '');
    setTxnMode(payment.txn_mode ?? '');
    setDate('');
    const amount = Number(payment.amount) || 0;
    const partial = Number(payment.partial_amount) || 0;
    setRemaining(amount - partial);
    setPaid(partial);
    setIsPaid(payment.status === 'SUCCESS');
  }, [payment]);

  const updatePayment = useUpdatePayment();
  const attachmentsQuery = usePaymentAttachments(payment?.id ?? null);
  const uploadAttachment = useUploadPaymentAttachment();
  const deleteAttachment = useDeletePaymentAttachment();
  const commentsQuery = usePaymentComments(payment?.id ?? null);
  const createComment = useCreatePaymentComment();

  if (!payment) {
    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['40%']} title="Payment">
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No payment selected.</Text>
        </View>
      </CmsModal>
    );
  }

  const paymentId = payment.id;
  const totalAmount = Number(payment.amount) || 0;

  function handleSave() {
    if (!refNo.trim() || !txnMode || !date.trim()) {
      toast.error('Enter all details');
      return;
    }
    const fullyPaid = remaining >= totalAmount;
    updatePayment.mutate(
      {
        payment_id: paymentId,
        ref_no: refNo,
        txn_mode: txnMode,
        date,
        ...(fullyPaid ? { amount: remaining, status: 'SUCCESS' } : { partial_amount: remaining, status: 'PENDING' }),
      },
      {
        onSuccess: () => {
          if (fullyPaid) {
            setIsPaid(true);
          } else {
            setPaid((prev) => prev + remaining);
          }
        },
      }
    );
  }

  async function handleAddAttachment() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    uploadAttachment.mutate({
      paymentId,
      asset: {
        uri: asset.uri,
        name: asset.fileName ?? `attachment-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      },
    });
  }

  function handlePostComment() {
    if (!comment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    createComment.mutate(
      { paymentId, comment },
      { onSuccess: () => setComment('') }
    );
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title="Update Payment Details">
      <BottomSheetScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CmsCard colors={colors}>
          <View style={st.badgeRow}>
            <CmsStatusBadge meta={getPaymentStatusMeta(isPaid ? 'SUCCESS' : payment.status)} />
          </View>

          <CmsInput
            colors={colors}
            label="Payment Amount"
            keyboardType="decimal-pad"
            placeholder={isPaid ? "You won't be able to pay" : 'Enter amount here'}
            value={isPaid ? '' : String(remaining)}
            onChangeText={(v) => setRemaining(Number(v) || 0)}
            editable={!isPaid}
          />

          <CmsInput
            colors={colors}
            label="Payment Ref No."
            placeholder="Enter payment ref. no."
            value={refNo}
            onChangeText={setRefNo}
            editable={!isPaid}
          />

          <CmsSelect
            colors={colors}
            label="Select Txn Mode"
            placeholder="Select mode"
            value={txnMode}
            options={TXN_MODE_OPTIONS}
            onSelect={(v) => setTxnMode(String(v))}
          />

          <CmsInput
            colors={colors}
            label="Date (YYYY-MM-DD)"
            placeholder="Select date"
            value={date}
            onChangeText={setDate}
            editable={!isPaid}
          />

          {!isPaid ? (
            <CmsButton colors={colors} label="Update Payment" onPress={handleSave} loading={updatePayment.isPending} />
          ) : (
            <Text style={[st.paidText, { color: colors.success }]}>
              ✅ This payment of Rs. {money(payment.amount)} is completely paid.
            </Text>
          )}

          {!isPaid ? (
            <View style={st.amountsRow}>
              <Text style={[st.amountText, { color: colors.textSecondary }]}>
                Remaining: Rs. {money(remaining)}
              </Text>
              <Text style={[st.amountText, { color: colors.textSecondary }]}>Paid: Rs. {money(paid)}</Text>
            </View>
          ) : null}
        </CmsCard>

        <CmsCard colors={colors} title="Attachments">
          <View style={st.attachmentsGrid}>
            {(attachmentsQuery.data ?? []).map((file) => (
              <View key={file.id} style={[st.attachmentTile, { borderColor: colors.border }]}>
                <Image source={{ uri: file.url }} style={st.attachmentImg} contentFit="cover" />
                <Pressable
                  onPress={() => deleteAttachment.mutate({ attachmentId: file.id, paymentId })}
                  style={[st.removeBtn, { backgroundColor: colors.danger }]}
                  hitSlop={6}
                >
                  <Ionicons name="close" size={11} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handleAddAttachment}
              disabled={uploadAttachment.isPending}
              style={[st.attachmentTile, st.addTile, { borderColor: colors.border }]}
            >
              {uploadAttachment.isPending ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="add" size={20} color={colors.accent} />
              )}
            </Pressable>
          </View>
        </CmsCard>

        <CmsCard colors={colors} title="Comments">
          {(commentsQuery.data ?? []).map((c, i) => (
            <View key={i} style={[st.commentRow, { borderColor: colors.border }]}>
              <Text style={[st.commentAuthor, { color: colors.textPrimary }]}>{c.commented_by}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{c.message}</Text>
            </View>
          ))}
          <CmsInput
            colors={colors}
            placeholder="Write a comment…"
            value={comment}
            onChangeText={setComment}
          />
          <CmsButton
            colors={colors}
            label="Post"
            variant="ghost"
            onPress={handlePostComment}
            loading={createComment.isPending}
          />
        </CmsCard>
      </BottomSheetScrollView>
    </CmsModal>
  );
});

const st = StyleSheet.create({
  badgeRow: { flexDirection: 'row', marginBottom: 4 },
  paidText: { fontSize: 14, fontWeight: '700' },
  amountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  amountText: { fontSize: 12.5, fontWeight: '600' },
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachmentTile: { width: 72, height: 72, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  attachmentImg: { width: '100%', height: '100%' },
  addTile: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  commentAuthor: { ...cmsType.listSubtitle },
});
