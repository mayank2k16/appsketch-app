import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { ChannelsScreen } from './Channels/ChannelsScreen';
import { CustomersScreen } from './Customers/CustomersScreen';
import { EmailTemplatesScreen } from './EmailTemplates/EmailTemplatesScreen';
import { LogsScreen } from './Logs/LogsScreen';
import { RulesScreen } from './Rules/RulesScreen';
import { SmsTemplatesScreen } from './SmsTemplates/SmsTemplatesScreen';
import { VariablesScreen } from './Variables/VariablesScreen';

/**
 * Notifications' own sub-tab registry — mirrors the top-level `CMS_TABS`
 * pattern one level deeper, matching the Vite reference's 8-tab structure
 * (Channels, Variables, Email Templates, SMS Templates, Rules, Campaigns,
 * Customers, Logs) and its ordering. Built in phases — Phase 1 shipped Logs
 * and Customers, Phase 2 added Channels and Variables, Phase 3 added Email
 * and SMS Templates, Phase 4 adds Rules; only Campaigns remains.
 */
export type NotificationTabKey =
  | 'channels'
  | 'variables'
  | 'emailTemplates'
  | 'smsTemplates'
  | 'rules'
  | 'customers'
  | 'logs';

export type NotificationTab = {
  key: NotificationTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType;
};

export const NOTIFICATION_TABS: NotificationTab[] = [
  { key: 'channels', label: 'Channels', icon: 'settings-outline', Component: ChannelsScreen },
  { key: 'variables', label: 'Variables', icon: 'code-slash-outline', Component: VariablesScreen },
  { key: 'emailTemplates', label: 'Email Templates', icon: 'mail-outline', Component: EmailTemplatesScreen },
  { key: 'smsTemplates', label: 'SMS Templates', icon: 'chatbubble-outline', Component: SmsTemplatesScreen },
  { key: 'rules', label: 'Event Rules', icon: 'git-branch-outline', Component: RulesScreen },
  { key: 'customers', label: 'Customers', icon: 'people-outline', Component: CustomersScreen },
  { key: 'logs', label: 'Logs', icon: 'time-outline', Component: LogsScreen },
];
