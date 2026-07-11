import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';

export type CmsVariableOption = { name: string; label: string };

type Selection = { start: number; end: number };

/** Detects an unterminated `{{` immediately before the cursor — e.g. typing
 * `Hi {{first` with the cursor at the end returns `{start: 3, query: 'first'}`.
 * Returns null once the `}}` closes it, or if a newline/second `{{` breaks the
 * run (keeps the popup from lingering after the user's moved on). */
function detectTrigger(text: string, cursor: number): { start: number; query: string } | null {
  const uptoCursor = text.slice(0, cursor);
  const lastOpen = uptoCursor.lastIndexOf('{{');
  if (lastOpen === -1) return null;
  const between = uptoCursor.slice(lastOpen + 2);
  if (between.includes('}}') || between.includes('{{') || /\n/.test(between)) return null;
  return { start: lastOpen, query: between };
}

type Props = {
  colors: CmsThemeColors;
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  variables: CmsVariableOption[];
  placeholder?: string;
  numberOfLines?: number;
  error?: string;
  editable?: boolean;
};

/** Multiline text field with `{{variable}}` autocomplete — shared by the
 * Email and SMS template editors so the trigger-detection/cursor-insertion
 * logic (RN's `TextInput` selection state, not the DOM's `selectionStart`)
 * lives in one place. */
export function CmsVariableInput({
  colors,
  label,
  value,
  onChangeText,
  variables,
  placeholder,
  numberOfLines = 6,
  error,
  editable = true,
}: Props) {
  const [selection, setSelection] = React.useState<Selection>({ start: 0, end: 0 });

  const trigger = React.useMemo(() => detectTrigger(value, selection.start), [value, selection.start]);

  const suggestions = React.useMemo(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    if (!q) return variables.slice(0, 6);
    return variables
      .filter((v) => v.name.toLowerCase().includes(q) || v.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [trigger, variables]);

  function insertVariable(v: CmsVariableOption) {
    if (!trigger) return;
    const before = value.slice(0, trigger.start);
    const after = value.slice(selection.start);
    const inserted = `{{${v.name}}}`;
    onChangeText(before + inserted + after);
    const newCursor = before.length + inserted.length;
    setSelection({ start: newCursor, end: newCursor });
  }

  return (
    <View style={st.group}>
      {label ? <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        multiline
        editable={editable}
        numberOfLines={numberOfLines}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        textAlignVertical="top"
        style={[
          st.field,
          {
            minHeight: numberOfLines * 20,
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
            color: colors.textPrimary,
            opacity: editable ? 1 : 0.7,
          },
        ]}
        selectionColor={colors.accent}
      />
      {error ? <Text style={[st.error, { color: colors.danger }]}>{error}</Text> : null}

      {editable && suggestions.length > 0 && (
        <View style={[st.suggestBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {suggestions.map((v) => (
            <Pressable key={v.name} onPress={() => insertVariable(v)} style={[st.suggestRow, { borderColor: colors.border }]}>
              <Text style={[st.suggestName, { color: colors.accent }]}>{`{{${v.name}}}`}</Text>
              <Text style={[st.suggestLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {v.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...cmsType.inputValue,
  },
  error: cmsType.inputError,
  suggestBox: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestName: { ...cmsType.listMeta, fontWeight: '700' },
  suggestLabel: { ...cmsType.listMeta, flex: 1 },
});
