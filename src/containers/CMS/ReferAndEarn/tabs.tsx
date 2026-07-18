import type * as React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { LinkSettingsScreen } from './LinkSettings/LinkSettingsScreen';
import { ReferralsListScreen } from './ReferralsList/ReferralsListScreen';
import { RulesScreen } from './Rules/RulesScreen';

/**
 * Refer & Earn's own sub-tab registry — mirrors `Notifications/tabs.tsx` and
 * `Payments/tabs.tsx` one level deeper. Merges Vite's two separate tabs
 * (`ReferralRules`, `Referrals`) into one, matching what Vite's own sidebar
 * already groups together (`openReferralsMenu`). Vite's `Referrals.jsx` did
 * analytics+list+link-settings on one page — split into their own sub-tabs
 * here, same reasoning as Payments' Regular/Bulk/Vendor Settlements split.
 */
export type ReferAndEarnTabKey = 'rules' | 'referrals' | 'linkSettings';

export type ReferAndEarnTab = {
  key: ReferAndEarnTabKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  Component: React.ComponentType;
};

export const REFER_AND_EARN_TABS: ReferAndEarnTab[] = [
  { key: 'rules', label: 'Rules', icon: 'options-outline', Component: RulesScreen },
  { key: 'referrals', label: 'Referrals', icon: 'people-outline', Component: ReferralsListScreen },
  { key: 'linkSettings', label: 'Link Settings', icon: 'link-outline', Component: LinkSettingsScreen },
];
