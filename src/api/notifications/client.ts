import { authenticatedClient } from '@/api/common/client';

import type {
  CustomVariable,
  CustomVariablePayload,
  EmailTemplate,
  EmailTemplatePayload,
  NotificationConfig,
  NotificationConfigPayload,
  NotificationCustomer,
  NotificationCustomerFilters,
  NotificationEvent,
  NotificationLog,
  NotificationLogFilters,
  NotificationRule,
  NotificationRulePayload,
  SmsTemplate,
  SmsTemplatePayload,
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

export async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  const { data } = await authenticatedClient.get<{ templates: EmailTemplate[] }>(
    'api/notifications/templates/email/'
  );
  return data.templates ?? [];
}

export async function createEmailTemplate(payload: EmailTemplatePayload): Promise<EmailTemplate> {
  const { data } = await authenticatedClient.post<EmailTemplate>('api/notifications/templates/email/', payload);
  return data;
}

export async function updateEmailTemplate(id: number, payload: EmailTemplatePayload): Promise<EmailTemplate> {
  const { data } = await authenticatedClient.put<EmailTemplate>(
    `api/notifications/templates/email/${id}/`,
    payload
  );
  return data;
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  await authenticatedClient.delete(`api/notifications/templates/email/${id}/`);
}

export async function fetchSMSTemplates(): Promise<SmsTemplate[]> {
  const { data } = await authenticatedClient.get<{ templates: SmsTemplate[] }>(
    'api/notifications/templates/sms/'
  );
  return data.templates ?? [];
}

export async function createSMSTemplate(payload: SmsTemplatePayload): Promise<SmsTemplate> {
  const { data } = await authenticatedClient.post<SmsTemplate>('api/notifications/templates/sms/', payload);
  return data;
}

export async function updateSMSTemplate(id: number, payload: SmsTemplatePayload): Promise<SmsTemplate> {
  const { data } = await authenticatedClient.put<SmsTemplate>(`api/notifications/templates/sms/${id}/`, payload);
  return data;
}

export async function deleteSMSTemplate(id: number): Promise<void> {
  await authenticatedClient.delete(`api/notifications/templates/sms/${id}/`);
}

export async function fetchNotificationEvents(): Promise<NotificationEvent[]> {
  const { data } = await authenticatedClient.get<{ events: NotificationEvent[] }>(
    'api/notifications/events/'
  );
  return data.events ?? [];
}

export async function fetchNotificationRules(): Promise<NotificationRule[]> {
  const { data } = await authenticatedClient.get<{ rules: NotificationRule[] }>(
    'api/notifications/rules/'
  );
  return data.rules ?? [];
}

export async function upsertNotificationRule(payload: NotificationRulePayload): Promise<NotificationRule> {
  const { data } = await authenticatedClient.post<NotificationRule>('api/notifications/rules/', payload);
  return data;
}

export async function deleteNotificationRule(id: number): Promise<void> {
  await authenticatedClient.delete(`api/notifications/rules/${id}/`);
}
