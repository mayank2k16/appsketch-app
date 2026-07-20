import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { BookingFilters, BookingListItem } from '@/api/bookings';
import { useBookings, useDoctors } from '@/api/bookings';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsSelect } from '../components';
import { useCmsTheme } from '../theme';
import { BookingCard } from './components/BookingCard';
import { BookingDetailModal } from './components/BookingDetailModal';
import { MiniCalendar } from './components/MiniCalendar';
import { sameDay } from './utils';

const TIME_FILTERS: { label: string; value: 'upcoming' | 'past' | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BookingsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [view, setView] = React.useState<'list' | 'calendar'>('list');
  const [timeFilter, setTimeFilter] = React.useState<'upcoming' | 'past' | ''>('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [doctorFilter, setDoctorFilter] = React.useState<string | number>('');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [calDate, setCalDate] = React.useState(new Date());
  const [selected, setSelected] = React.useState<BookingListItem | null>(null);

  const filters: BookingFilters = {
    filter: timeFilter || undefined,
    status: statusFilter || undefined,
    doctor: doctorFilter || undefined,
    search: debouncedSearch || undefined,
  };

  const bookingsQuery = useBookings(filters);
  const doctorsQuery = useDoctors();
  const bookings = bookingsQuery.data ?? [];
  const doctorOptions = [
    { value: '', label: 'All doctors' },
    ...(doctorsQuery.data ?? []).map((d) => ({ value: d.id, label: d.title })),
  ];

  const detailModal = useModal();

  const stats = React.useMemo(() => {
    const s = { total: bookings.length, confirmed: 0, pending: 0, cancelled: 0 };
    bookings.forEach((b) => {
      if (b.status === 'confirmed') s.confirmed += 1;
      else if (b.status === 'pending') s.pending += 1;
      else if (b.status === 'cancelled') s.cancelled += 1;
    });
    return s;
  }, [bookings]);

  const highlightDates = React.useMemo(
    () =>
      bookings
        .map((b) => (b.slot_start ? new Date(b.slot_start) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime())),
    [bookings]
  );

  const dayBookings = React.useMemo(
    () =>
      bookings
        .filter((b) => sameDay(b.slot_start, calDate))
        .sort((a, b) => new Date(a.slot_start ?? 0).getTime() - new Date(b.slot_start ?? 0).getTime()),
    [bookings, calDate]
  );

  function openBooking(booking: BookingListItem) {
    setSelected(booking);
    detailModal.present();
  }

  const renderItem = React.useCallback(
    ({ item }: { item: BookingListItem }) => (
      <BookingCard booking={item} colors={colors} onPress={() => openBooking(item)} />
    ),
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.statRow}>
        <StatChip label="Total" value={stats.total} color={colors.textPrimary} colors={colors} />
        <StatChip label="Confirmed" value={stats.confirmed} color={colors.success} colors={colors} />
        <StatChip label="Pending" value={stats.pending} color={colors.warning} colors={colors} />
        <StatChip label="Cancelled" value={stats.cancelled} color={colors.danger} colors={colors} />
      </View>

      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search patient, phone or doctor…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <View style={st.filterRow}>
        {TIME_FILTERS.map((f) => {
          const active = timeFilter === f.value;
          return (
            <Pressable
              key={f.value}
              onPress={() => setTimeFilter(f.value)}
              style={[
                st.filterBtn,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text style={{ color: active ? colors.accentText : colors.textPrimary, fontSize: 12.5, fontWeight: '700' }}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setView(view === 'list' ? 'calendar' : 'list')}
          style={[st.viewToggleBtn, { borderColor: colors.border }]}
        >
          <Ionicons name={view === 'list' ? 'calendar-outline' : 'list-outline'} size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={st.selectRow}>
        <View style={{ flex: 1 }}>
          <CmsSelect
            colors={colors}
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onSelect={(v) => setStatusFilter(String(v))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CmsSelect
            colors={colors}
            label="Doctor"
            value={doctorFilter}
            options={doctorOptions}
            onSelect={(v) => setDoctorFilter(v)}
          />
        </View>
      </View>

      {bookingsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading bookings…</Text>
        </View>
      ) : view === 'list' ? (
        bookings.length === 0 ? (
          <View style={st.center}>
            <Text style={{ color: colors.textSecondary }}>No bookings found</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          />
        )
      ) : (
        <FlatList
          data={dayBookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              <MiniCalendar colors={colors} selectedDate={calDate} onSelectDate={setCalDate} highlightDates={highlightDates} />
              <Text style={[st.dayTitle, { color: colors.textPrimary }]}>
                {calDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                {'  '}
                <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>{dayBookings.length} appointment(s)</Text>
              </Text>
            </>
          }
          ListEmptyComponent={
            <Text style={[st.noItems, { color: colors.textSecondary }]}>No appointments this day</Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <BookingDetailModal
        ref={detailModal.ref}
        colors={colors}
        booking={selected}
        onClosed={() => {
          detailModal.dismiss();
          setSelected(null);
        }}
      />
    </View>
  );
}

function StatChip({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: { surface: string; border: string; textSecondary: string };
}) {
  return (
    <View style={[st.statChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={[st.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  statChip: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 10.5, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  filterBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  viewToggleBtn: { marginLeft: 'auto', borderWidth: 1, borderRadius: 8, padding: 8 },
  selectRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 10, marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  dayTitle: { fontSize: 14, fontWeight: '700', marginHorizontal: 16, marginBottom: 8 },
  noItems: { textAlign: 'center', marginTop: 20 },
});
