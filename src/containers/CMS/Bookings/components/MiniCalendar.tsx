import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  highlightDates: Date[];
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Hand-rolled month grid — no calendar dependency exists in this app yet and
 * this is a self-contained UI piece (no new endpoint), so it doesn't warrant
 * adding one just for Bookings' calendar view. */
export function MiniCalendar({ colors, selectedDate, onSelectDate, highlightDates }: Props) {
  const [monthCursor, setMonthCursor] = React.useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const highlightSet = React.useMemo(
    () => new Set(highlightDates.map((d) => d.toDateString())),
    [highlightDates]
  );

  const weeks = React.useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = firstDay.getDay();

    const cells: (Date | null)[] = [...Array(leading).fill(null)];
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [monthCursor]);

  function changeMonth(delta: number) {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <View style={[st.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={st.header}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[st.headerLabel, { color: colors.textPrimary }]}>
          {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={st.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={[st.weekdayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={st.weekRow}>
          {week.map((date, di) => {
            if (!date) return <View key={di} style={st.cell} />;
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const hasBookings = highlightSet.has(date.toDateString());
            return (
              <Pressable key={di} onPress={() => onSelectDate(date)} style={st.cell}>
                <View
                  style={[
                    st.cellInner,
                    isSelected && { backgroundColor: colors.accent },
                  ]}
                >
                  <Text style={[st.cellLabel, { color: isSelected ? colors.accentText : colors.textPrimary }]}>
                    {date.getDate()}
                  </Text>
                </View>
                {hasBookings && !isSelected ? (
                  <View style={[st.dot, { backgroundColor: colors.accent }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLabel: { fontSize: 14, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  cellInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cellLabel: { fontSize: 12.5, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
