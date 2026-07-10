import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { NotificationLog, NotificationLogStatus } from '@/api/notifications';
import { useNotificationLogs } from '@/api/notifications';

import { useCmsTheme } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { LogRow } from './components/LogRow';
import { LOG_STATUS_OPTIONS } from './utils';

export function LogsScreen() {
  const { colors } = useCmsTheme();
  const [statusFilter, setStatusFilter] = React.useState<NotificationLogStatus | null>(null);

  const logsQuery = useNotificationLogs(statusFilter ? { status: statusFilter } : {});
  const logs = logsQuery.data ?? [];

  const renderItem = React.useCallback(
    ({ item }: { item: NotificationLog }) => <LogRow log={item} colors={colors} />,
    [colors]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexShrink: 0 }}
        data={[{ value: null, label: 'All' }, ...LOG_STATUS_OPTIONS]}
        keyExtractor={(item) => String(item.value)}
        renderItem={({ item }) => {
          const active = item.value === statusFilter;
          return (
            <Pressable
              onPress={() => setStatusFilter(item.value)}
              style={[
                st.chip,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text style={[st.chipLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {logsQuery.isLoading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading logs…</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No notification logs found</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  filterRow: { flexGrow: 0, marginBottom: 10, flexShrink: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: cmsType.listBadge,
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
});
