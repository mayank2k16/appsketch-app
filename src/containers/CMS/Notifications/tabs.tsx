import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { ChannelsScreen } from './Channels/ChannelsScreen';
import { CustomersScreen } from './Customers/CustomersScreen';
import { LogsScreen } from './Logs/LogsScreen';
import { VariablesScreen } from './Variables/VariablesScreen';

/**
 * Notifications' own sub-tab registry — mirrors the top-level `CMS_TABS`
 * pattern one level deeper, matching the Vite reference's 8-tab structure
 * (Channels, Variables, Email Templates, SMS Templates, Rules, Campaigns,
 * Customers, Logs) and its ordering. Built in phases — Phase 1 shipped Logs
 * and Customers, Phase 2 adds Channels and Variables; add further sub-tabs
 * here the same way, one entry each, no new routing.
 */
export type NotificationTabKey = 'channels' | 'variables' | 'customers' | 'logs';

export type NotificationTab = {
  key: NotificationTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType;
};

export const NOTIFICATION_TABS: NotificationTab[] = [
  { key: 'channels', label: 'Channels', icon: 'settings-outline', Component: ChannelsScreen },
  { key: 'variables', label: 'Variables', icon: 'code-slash-outline', Component: VariablesScreen },
  { key: 'customers', label: 'Customers', icon: 'people-outline', Component: CustomersScreen },
  { key: 'logs', label: 'Logs', icon: 'time-outline', Component: LogsScreen },
];
