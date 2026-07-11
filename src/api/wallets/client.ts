import { authenticatedClient } from '@/api/common/client';

import type {
  AdjustWalletPayload,
  WalletListParams,
  WalletListResponse,
  WalletTransactionsParams,
  WalletTransactionsResponse,
} from './types';

export async function fetchWallets(params: WalletListParams = {}): Promise<WalletListResponse> {
  const { data } = await authenticatedClient.get<WalletListResponse>('api/account/wallet/admin/list/', {
    params,
  });
  return data;
}

export async function adjustWalletBalance(payload: AdjustWalletPayload): Promise<unknown> {
  const { data } = await authenticatedClient.post('api/account/wallet/admin/adjust/', payload);
  return data;
}

export async function fetchWalletTransactions(
  params: WalletTransactionsParams
): Promise<WalletTransactionsResponse> {
  const { data } = await authenticatedClient.get<WalletTransactionsResponse>(
    'api/account/wallet/transactions/',
    { params }
  );
  return data;
}
