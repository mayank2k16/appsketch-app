import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BookingListItem } from '@/api/bookings';

import { CmsStatusBadge } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { fmtDateTime, fmtTime, getBookingStatusMeta } from '../utils';

type Props = {
  booking: BookingListItem;
  colors: CmsThemeColors;
  onPress: () => void;
};

export const BookingCard = React.memo(function BookingCard({ booking, colors, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={st.headerRow}>
        <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {booking.patient_name || 'N/A'}
        </Text>
        <CmsStatusBadge meta={getBookingStatusMeta(booking.status)} />
      </View>

      {booking.patient_phone ? (
        <Text style={[st.meta, { color: colors.textSecondary }]}>{booking.patient_phone}</Text>
      ) : null}

      <Text style={[st.meta, { color: colors.textSecondary }]} numberOfLines={1}>
        {booking.doctor_name || booking.entity_title || 'N/A'}
        {booking.specialization ? ` · ${booking.specialization}` : ''}
      </Text>

      <View style={st.footerRow}>
        <Text style={[st.time, { color: colors.textPrimary }]}>
          {fmtDateTime(booking.slot_start)}
          {booking.slot_end ? ` – ${fmtTime(booking.slot_end)}` : ''}
        </Text>
        {booking.consultation_price != null ? (
          <Text style={[st.fee, { color: colors.accent }]}>₹{Number(booking.consultation_price).toFixed(2)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const st = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { ...cmsType.listTitle, flex: 1 },
  meta: cmsType.listMeta,
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: 12.5, fontWeight: '600' },
  fee: { fontSize: 13.5, fontWeight: '800' },
});
