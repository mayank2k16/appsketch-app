import { accountClient } from '@/api/common/client';
import type { AuthUser } from '@/api/auth/types';

import type { UpdateOwnProfilePayload } from './types';

export async function updateOwnProfile(payload: UpdateOwnProfilePayload): Promise<AuthUser> {
  const { data } = await accountClient.patch<AuthUser>('account/tenant/users', payload);
  return data;
}
