import * as React from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NotificationCustomer } from '@/api/notifications';
import { useNotificationCustomers } from '@/api/notifications';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { CustomerRow } from './components/CustomerRow';

export function CustomersScreen() {
  const { colors } = useCmsTheme();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  const customersQuery = useNotificationCustomers(debouncedQuery.trim() ? { q: debouncedQuery.trim() } : {});
  const customers = customersQuery.data ?? [];

  const renderItem = React.useCallback(
    ({ item }: { item: NotificationCustomer }) => <CustomerRow customer={item} colors={colors} />,
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.searchWrap}>
        <View style={[st.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers…"
            placeholderTextColor={colors.textSecondary}
            style={[st.searchInput, { color: colors.textPrimary }]}
          />
        </View>
      </View>

      {customersQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading customers…</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No customers found</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, ...cmsType.inputValue, paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
