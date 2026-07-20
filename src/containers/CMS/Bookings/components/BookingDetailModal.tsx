import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { BookingListItem, BookingStatus } from '@/api/bookings';
import { useDeleteBooking, useUpdateBooking } from '@/api/bookings';
import { ConfirmModal, useModal } from '@/components/ui';

import { CmsButton, CmsCard, CmsField, CmsInput, CmsModal, CmsSelect, CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { fmtDateTime, fmtTime, getBookingStatusMeta } from '../utils';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

type Props = {
  colors: CmsThemeColors;
  booking: BookingListItem | null;
  onClosed: () => void;
};

export const BookingDetailModal = React.forwardRef<BottomSheetModal, Props>(({ colors, booking, onClosed }, ref) => {
  const [status, setStatus] = React.useState<BookingStatus>('pending');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (booking) {
      setStatus((booking.status as BookingStatus) || 'pending');
      setNotes(booking.notes || '');
    }
  }, [booking]);

  const updateBooking = useUpdateBooking();
  const deleteBooking = useDeleteBooking();
  const confirmDeleteModal = useModal();

  function handleSave() {
    if (!booking) return;
    updateBooking.mutate(
      { id: booking.id, payload: { status, notes } },
      { onSuccess: onClosed }
    );
  }

  function confirmDelete() {
    if (!booking) return;
    deleteBooking.mutate(booking.id, {
      onSuccess: () => {
        confirmDeleteModal.dismiss();
        onClosed();
      },
    });
  }

  return (
    <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title="Booking Details">
      {!booking ? (
        <View style={{ padding: 24 }}>
          <Text style={{ color: colors.textSecondary }}>No booking selected.</Text>
        </View>
      ) : (
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[st.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[st.heroName, { color: colors.textPrimary }]} numberOfLines={1}>
                {booking.doctor_name || booking.entity_title || 'N/A'}
              </Text>
              {booking.specialization ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{booking.specialization}</Text>
              ) : null}
            </View>
            <CmsStatusBadge meta={getBookingStatusMeta(booking.status)} />
          </View>

          <CmsCard colors={colors} title="Appointment">
            <View style={st.fieldGrid}>
              <CmsField
                colors={colors}
                label="Slot"
                value={`${fmtDateTime(booking.slot_start)}${booking.slot_end ? ` – ${fmtTime(booking.slot_end)}` : ''}`}
              />
              <CmsField colors={colors} label="Booked On" value={fmtDateTime(booking.booked_at)} />
              {booking.consultation_price != null ? (
                <CmsField
                  colors={colors}
                  label="Consultation Fee"
                  value={`₹${Number(booking.consultation_price).toFixed(2)}${booking.quantity ? ` · qty ${booking.quantity}` : ''}`}
                />
              ) : null}
            </View>
          </CmsCard>

          <CmsCard colors={colors} title="Patient">
            <View style={st.fieldGrid}>
              <CmsField colors={colors} label="Name" value={booking.patient_name} />
            </View>
            {booking.patient_phone ? (
              <Row
                colors={colors}
                icon="call-outline"
                label={booking.patient_phone}
                onPress={() => Linking.openURL(`tel:${booking.patient_phone}`)}
              />
            ) : null}
            {booking.patient_email ? (
              <Row
                colors={colors}
                icon="mail-outline"
                label={booking.patient_email}
                onPress={() => Linking.openURL(`mailto:${booking.patient_email}`)}
              />
            ) : null}
          </CmsCard>

          {booking.hospital_name || booking.hospital_address || booking.map_link ? (
            <CmsCard colors={colors} title="Hospital">
              <View style={st.fieldGrid}>
                <CmsField colors={colors} label="Name" value={booking.hospital_name} />
                <CmsField colors={colors} label="Address" value={booking.hospital_address} />
              </View>
              {booking.map_link ? (
                <CmsButton
                  colors={colors}
                  variant="ghost"
                  label="Open in Maps"
                  onPress={() => Linking.openURL(booking.map_link!)}
                />
              ) : null}
            </CmsCard>
          ) : null}

          <CmsCard colors={colors} title="Manage">
            <CmsSelect
              colors={colors}
              label="Status"
              value={status}
              options={STATUS_OPTIONS}
              onSelect={(v) => setStatus(v as BookingStatus)}
            />
            <CmsInput
              colors={colors}
              label="Notes"
              placeholder="Reason for visit / internal notes…"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </CmsCard>

          <View style={st.footer}>
            <CmsButton
              colors={colors}
              variant="danger"
              label="Delete"
              onPress={confirmDeleteModal.present}
              style={{ flex: 1 }}
            />
            <CmsButton
              colors={colors}
              label={updateBooking.isPending ? 'Saving…' : 'Save changes'}
              onPress={handleSave}
              loading={updateBooking.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </BottomSheetScrollView>
      )}

      <ConfirmModal
        ref={confirmDeleteModal.ref}
        title="Delete this booking?"
        description="This booking will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={deleteBooking.isPending}
        onConfirm={confirmDelete}
      />
    </CmsModal>
  );
});

function Row({
  colors,
  icon,
  label,
  onPress,
}: {
  colors: CmsThemeColors;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={st.linkRow}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={{ color: colors.accent, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  heroName: cmsType.listTitle,
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  footer: { flexDirection: 'row', gap: 10, marginTop: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
});
