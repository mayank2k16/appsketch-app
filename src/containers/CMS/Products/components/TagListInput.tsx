import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
};

/** Generic repeatable single-line list — replaces Vite's `MultiAddInput`
 * for alternate names / features / tags: one row per value with a way to
 * edit, remove, or add another. */
export function TagListInput({ colors, label, placeholder, values, onChange }: Props) {
  function setAt(index: number, text: string) {
    onChange(values.map((v, i) => (i === index ? text : v)));
  }
  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...values, '']);
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      {values.map((value, i) => (
        <View key={i} style={st.row}>
          <TextInput
            value={value}
            onChangeText={(t) => setAt(i, t)}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[st.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
          />
          <Pressable onPress={() => removeAt(i)} hitSlop={8} style={st.iconBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={add} style={st.addRow} hitSlop={4}>
        <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
        <Text style={[st.addLabel, { color: colors.accent }]}>Add {label}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 8 },
  label: cmsType.inputLabel,
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...cmsType.inputValue,
  },
  iconBtn: { padding: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  addLabel: { fontSize: 12.5, fontWeight: '700' },
});
