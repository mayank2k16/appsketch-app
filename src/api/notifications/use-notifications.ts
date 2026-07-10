import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createCustomVariable,
  createEmailTemplate,
  createSMSTemplate,
  deleteCustomVariable,
  deleteEmailTemplate,
  deleteNotificationRule,
  deleteSMSTemplate,
  fetchCustomVariables,
  fetchEmailTemplates,
  fetchNotificationConfig,
  fetchNotificationCustomers,
  fetchNotificationEvents,
  fetchNotificationLogs,
  fetchNotificationRules,
  fetchSMSTemplates,
  fetchSystemVariables,
  updateCustomVariable,
  updateEmailTemplate,
  updateNotificationConfig,
  updateSMSTemplate,
  upsertNotificationRule,
} from './client';
import type {
  CustomVariablePayload,
  EmailTemplatePayload,
  NotificationConfigPayload,
  NotificationCustomerFilters,
  NotificationLogFilters,
  NotificationRulePayload,
  SmsTemplatePayload,
} from './types';

export const notificationKeys = {
  all: ['notifications'] as const,
  logs: (filters: NotificationLogFilters) => [...notificationKeys.all, 'logs', filters] as const,
  customers: (filters: NotificationCustomerFilters) =>
    [...notificationKeys.all, 'customers', filters] as const,
  config: () => [...notificationKeys.all, 'config'] as const,
  systemVariables: () => [...notificationKeys.all, 'system-variables'] as const,
  customVariables: () => [...notificationKeys.all, 'custom-variables'] as const,
  emailTemplates: () => [...notificationKeys.all, 'email-templates'] as const,
  smsTemplates: () => [...notificationKeys.all, 'sms-templates'] as const,
  events: () => [...notificationKeys.all, 'events'] as const,
  rules: () => [...notificationKeys.all, 'rules'] as const,
};

export function useNotificationLogs(filters: NotificationLogFilters = {}) {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationLogs>>, AxiosError>({
    queryKey: notificationKeys.logs(filters),
    queryFn: () => fetchNotificationLogs(filters),
  });
}

export function useNotificationCustomers(filters: NotificationCustomerFilters = {}) {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationCustomers>>, AxiosError>({
    queryKey: notificationKeys.customers(filters),
    queryFn: () => fetchNotificationCustomers(filters),
  });
}

export function useNotificationConfig() {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationConfig>>, AxiosError>({
    queryKey: notificationKeys.config(),
    queryFn: fetchNotificationConfig,
  });
}

export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationConfigPayload) => updateNotificationConfig(payload),
    onSuccess: () => {
      toast.success('Channel settings saved');
      queryClient.invalidateQueries({ queryKey: notificationKeys.config() });
    },
    onError: () => toast.error('Failed to save channel settings'),
  });
}

export function useSystemVariables() {
  return useQuery<Awaited<ReturnType<typeof fetchSystemVariables>>, AxiosError>({
    queryKey: notificationKeys.systemVariables(),
    queryFn: fetchSystemVariables,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomVariables() {
  return useQuery<Awaited<ReturnType<typeof fetchCustomVariables>>, AxiosError>({
    queryKey: notificationKeys.customVariables(),
    queryFn: fetchCustomVariables,
  });
}

export function useCreateCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomVariablePayload) => createCustomVariable(payload),
    onSuccess: () => {
      toast.success('Variable added');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to add variable'),
  });
}

export function useUpdateCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomVariablePayload }) =>
      updateCustomVariable(id, payload),
    onSuccess: () => {
      toast.success('Variable updated');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to update variable'),
  });
}

export function useDeleteCustomVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomVariable(id),
    onSuccess: () => {
      toast.success('Variable deleted');
      queryClient.invalidateQueries({ queryKey: notificationKeys.customVariables() });
    },
    onError: () => toast.error('Failed to delete variable'),
  });
}

export function useEmailTemplates() {
  return useQuery<Awaited<ReturnType<typeof fetchEmailTemplates>>, AxiosError>({
    queryKey: notificationKeys.emailTemplates(),
    queryFn: fetchEmailTemplates,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmailTemplatePayload) => createEmailTemplate(payload),
    onSuccess: () => {
      toast.success('Email template added');
      queryClient.invalidateQueries({ queryKey: notificationKeys.emailTemplates() });
    },
    onError: () => toast.error('Failed to add email template'),
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmailTemplatePayload }) =>
      updateEmailTemplate(id, payload),
    onSuccess: () => {
      toast.success('Email template updated');
      queryClient.invalidateQueries({ queryKey: notificationKeys.emailTemplates() });
    },
    onError: () => toast.error('Failed to update email template'),
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEmailTemplate(id),
    onSuccess: () => {
      toast.success('Email template deleted');
      queryClient.invalidateQueries({ queryKey: notificationKeys.emailTemplates() });
    },
    onError: () => toast.error('Failed to delete email template'),
  });
}

export function useSMSTemplates() {
  return useQuery<Awaited<ReturnType<typeof fetchSMSTemplates>>, AxiosError>({
    queryKey: notificationKeys.smsTemplates(),
    queryFn: fetchSMSTemplates,
  });
}

export function useCreateSMSTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SmsTemplatePayload) => createSMSTemplate(payload),
    onSuccess: () => {
      toast.success('SMS template added');
      queryClient.invalidateQueries({ queryKey: notificationKeys.smsTemplates() });
    },
    onError: () => toast.error('Failed to add SMS template'),
  });
}

export function useUpdateSMSTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SmsTemplatePayload }) =>
      updateSMSTemplate(id, payload),
    onSuccess: () => {
      toast.success('SMS template updated');
      queryClient.invalidateQueries({ queryKey: notificationKeys.smsTemplates() });
    },
    onError: () => toast.error('Failed to update SMS template'),
  });
}

export function useDeleteSMSTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSMSTemplate(id),
    onSuccess: () => {
      toast.success('SMS template deleted');
      queryClient.invalidateQueries({ queryKey: notificationKeys.smsTemplates() });
    },
    onError: () => toast.error('Failed to delete SMS template'),
  });
}

export function useNotificationEvents() {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationEvents>>, AxiosError>({
    queryKey: notificationKeys.events(),
    queryFn: fetchNotificationEvents,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotificationRules() {
  return useQuery<Awaited<ReturnType<typeof fetchNotificationRules>>, AxiosError>({
    queryKey: notificationKeys.rules(),
    queryFn: fetchNotificationRules,
  });
}

/** Same backend endpoint handles both create and update — one hook, not a
 * create/update pair, matching the API's own "upsert" shape. */
export function useUpsertNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationRulePayload) => upsertNotificationRule(payload),
    onSuccess: () => {
      toast.success('Rule saved');
      queryClient.invalidateQueries({ queryKey: notificationKeys.rules() });
    },
    onError: () => toast.error('Failed to save rule'),
  });
}

export function useDeleteNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteNotificationRule(id),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: notificationKeys.rules() });
    },
    onError: () => toast.error('Failed to delete rule'),
  });
}
