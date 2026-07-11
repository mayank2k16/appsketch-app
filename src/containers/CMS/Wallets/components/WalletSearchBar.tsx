import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CmsThemeColors } from '../../theme';

export function WalletSearchBar({
  value,
  onChangeText,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  colors: CmsThemeColors;
}) {
  return (
    <View style={[st.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="search" size={16} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by name, phone or email…"
        placeholderTextColor={colors.textSecondary}
        style={[st.input, { color: colors.textPrimary }]}
        returnKeyType="search"
      />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
});
