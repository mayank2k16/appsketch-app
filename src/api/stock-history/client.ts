import { authenticatedClient } from '@/api/common/client';

import type { StockHistoryPage } from './types';

export async function fetchStockHistory(offset = 0, limit = 10): Promise<StockHistoryPage> {
  const { data } = await authenticatedClient.get<StockHistoryPage>('api/shop/stocks/', {
    params: { limit, offset },
  });
  return { results: data.results ?? [], next: data.next ?? null, count: data.count ?? 0 };
}
