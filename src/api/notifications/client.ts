import { authenticatedClient } from '@/api/common/client';

import type {
  CustomVariable,
  CustomVariablePayload,
  NotificationConfig,
  NotificationConfigPayload,
  NotificationCustomer,
  NotificationCustomerFilters,
  NotificationLog,
  NotificationLogFilters,
  SystemVariable,
} from './types';

export async function fetchNotificationLogs(
  filters: NotificationLogFilters = {}
): Promise<NotificationLog[]> {
  const { data } = await authenticatedClient.get<{ logs: NotificationLog[]; total: number }>(
    'api/notifications/logs/',
    { params: filters }
  );
  return data.logs ?? [];
}

export async function fetchNotificationCustomers(
  filters: NotificationCustomerFilters = {}
): Promise<NotificationCustomer[]> {
  const { data } = await authenticatedClient.get<{ customers: NotificationCustomer[]; total: number }>(
    'api/notifications/customers/',
    { params: filters }
  );
  return data.customers ?? [];
}

export async function fetchNotificationConfig(): Promise<NotificationConfig> {
  const { data } = await authenticatedClient.get<NotificationConfig>('api/notifications/config/');
  return data;
}

export async function updateNotificationConfig(
  payload: NotificationConfigPayload
): Promise<NotificationConfig> {
  const { data } = await authenticatedClient.put<NotificationConfig>('api/notifications/config/', payload);
  return data;
}

export async function fetchSystemVariables(): Promise<SystemVariable[]> {
  const { data } = await authenticatedClient.get<{ variables: SystemVariable[] }>(
    'api/notifications/variables/system/'
  );
  return data.variables ?? [];
}

export async function fetchCustomVariables(): Promise<CustomVariable[]> {
  const { data } = await authenticatedClient.get<{ variables: CustomVariable[] }>(
    'api/notifications/variables/custom/'
  );
  return data.variables ?? [];
}

export async function createCustomVariable(payload: CustomVariablePayload): Promise<CustomVariable> {
  const { data } = await authenticatedClient.post<CustomVariable>('api/notifications/variables/custom/', payload);
  return data;
}

export async function updateCustomVariable(
  id: number,
  payload: CustomVariablePayload
): Promise<CustomVariable> {
  const { data } = await authenticatedClient.put<CustomVariable>(
    `api/notifications/variables/custom/${id}/`,
    payload
  );
  return data;
}

export async function deleteCustomVariable(id: number): Promise<void> {
  await authenticatedClient.delete(`api/notifications/variables/custom/${id}/`);
}
