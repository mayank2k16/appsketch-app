import * as React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import type { StockHistoryEntry } from '@/api/stock-history';
import { useStockHistory } from '@/api/stock-history';

import { useCmsTheme } from '../theme';
import { StockHistoryCard } from './components/StockHistoryCard';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StockHistoryScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const stockQuery = useStockHistory();
  const rows = React.useMemo(() => stockQuery.data?.pages.flatMap((p) => p.results) ?? [], [stockQuery.data]);

  const renderItem = React.useCallback(
    ({ item }: { item: StockHistoryEntry }) => <StockHistoryCard entry={item} colors={colors} />,
    [colors]
  );

  if (stockQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Loading Stock History…</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
          There are no stock history records available at the moment.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (stockQuery.hasNextPage && !stockQuery.isFetchingNextPage) {
          stockQuery.fetchNextPage();
        }
      }}
      ListFooterComponent={
        stockQuery.isFetchingNextPage ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : null
      }
    />
  );
}
