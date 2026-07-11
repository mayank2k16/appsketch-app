import { authenticatedClient } from '@/api/common/client';

import type { SalesAnalytics, SalesAnalyticsParams } from './types';

export async function fetchSalesAnalytics(params: SalesAnalyticsParams): Promise<SalesAnalytics> {
  const { data } = await authenticatedClient.get<{ data: SalesAnalytics }>(
    'api/dashboard/analytics/get_order_sales_data',
    { params }
  );
  return data.data ?? {};
}
