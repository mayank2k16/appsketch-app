import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

type Mode = 'date' | 'datetime';

type Props = {
  colors: CmsThemeColors;
  label: string;
  /** "YYYY-MM-DD" in `mode="date"`, "YYYY-MM-DDTHH:mm" in `mode="datetime"`
   * (the default) — the same wire formats these forms already send, so
   * swapping this in for a plain `CmsInput` doesn't touch the payload. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Disallow picking a moment before this — e.g. an End Time field passing
   * the parsed Start Time, so the two can't be picked out of order. */
  minimumDate?: Date;
  /** 'date' drops the time step entirely (single date dialog on Android, a
   * date-only wheel on iOS) for fields like Invoice Date that only ever
   * carry a calendar date. Defaults to 'datetime'. */
  mode?: Mode;
};

/** Parses either wire format this input reads/writes ("YYYY-MM-DD" or
 * "YYYY-MM-DDTHH:mm") — exported so callers can derive things like a
 * `minimumDate` for a paired field (e.g. an End Time picker that can't
 * precede its Start Time) without re-implementing the same parse. */
export function parseValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatValue(date: Date, mode: Mode): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === 'date' ? datePart : `${datePart}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(date: Date, mode: Mode): string {
  return date.toLocaleString(
    undefined,
    mode === 'date'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
}

/** Android has no combined date+time mode — its picker only ever shows one
 * of the two. In `datetime` mode this opens the date dialog, then chains
 * into the time dialog carrying the date just picked, committing once both
 * are confirmed; in `date` mode it's just the one dialog. */
function openAndroidPicker({
  current,
  minimumDate,
  mode,
  onDone,
}: {
  current: Date;
  minimumDate: Date | undefined;
  mode: Mode;
  onDone: (date: Date) => void;
}) {
  if (mode === 'date') {
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      minimumDate,
      onChange: (event: DateTimePickerEvent, picked?: Date) => {
        if (event.type === 'set' && picked) onDone(picked);
      },
    });
    return;
  }
  DateTimePickerAndroid.open({
    value: current,
    mode: 'date',
    minimumDate,
    onChange: (event: DateTimePickerEvent, pickedDate?: Date) => {
      if (event.type !== 'set' || !pickedDate) return;
      DateTimePickerAndroid.open({
        value: current,
        mode: 'time',
        onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
          if (timeEvent.type !== 'set' || !pickedTime) return;
          const combined = new Date(pickedDate);
          combined.setHours(pickedTime.getHours(), pickedTime.getMinutes());
          onDone(combined);
        },
      });
    },
  });
}

/** Native date (+ time) picker for CMS forms — replaces free-text
 * "YYYY-MM-DD"/"YYYY-MM-DDTHH:mm" entry with the platform's own picker UI.
 * iOS shows one inline wheel (date-only or combined, per `mode`); Android
 * chains its separate date/time dialogs via `DateTimePickerAndroid` (see
 * `openAndroidPicker`) — skipping the time step entirely in `mode="date"`. */
export function CmsDateTimeInput({ colors, label, value, onChange, error, required, disabled, minimumDate, mode = 'datetime' }: Props) {
  const [iosOpen, setIosOpen] = React.useState(false);
  const parsed = parseValue(value);
  const current = parsed ?? new Date();

  function open() {
    if (disabled) return;
    if (Platform.OS === 'android') {
      openAndroidPicker({ current, minimumDate, mode, onDone: (date) => onChange(formatValue(date, mode)) });
    } else {
      setIosOpen((prev) => !prev);
    }
  }

  function handleIosChange(_event: DateTimePickerEvent, picked?: Date) {
    if (picked) onChange(formatValue(picked, mode));
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <Pressable
        onPress={open}
        disabled={disabled}
        style={[
          st.field,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text style={[st.value, { color: parsed ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
          {parsed ? formatDisplay(parsed, mode) : mode === 'date' ? 'Select date' : 'Select date & time'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={[st.error, { color: colors.danger }]}>{error}</Text> : null}

      {Platform.OS === 'ios' && iosOpen ? (
        <View style={[st.iosPicker, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <DateTimePicker
            mode={mode}
            display="spinner"
            value={current}
            minimumDate={minimumDate}
            onChange={handleIosChange}
            themeVariant={colors.kind}
          />
          <Pressable onPress={() => setIosOpen(false)} style={st.doneBtn}>
            <Text style={[st.doneLabel, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: cmsType.inputValue,
  error: cmsType.inputError,
  iosPicker: {
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingBottom: 10 },
  doneLabel: { fontSize: 14, fontWeight: '700' },
});
