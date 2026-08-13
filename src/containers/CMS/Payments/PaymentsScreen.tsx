import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from '../theme';
import { DEFAULT_PAYMENT_TABS, MARKETPLACE_PAYMENT_TABS } from './tabs';
import type { PaymentTabKey } from './tabs';
import { useStudio } from '@/lib/store/studio-store';

/** Nested shell for the Payments tab — same recipe as `CmsShell` /
 * `Notifications/NotificationsScreen.tsx` one level deeper: a registry of
 * sub-tabs (Regular Payments, Bulk Payments, Vendor Settlements) + conditional
 * mounting. Unlike Notifications' horizontal strip, this one is a fixed-width
 * vertical rail on the left — same `sidebarBg`/`sidebarActiveBg`/`sidebarText`
 * color roles the top-level `CmsDrawer` uses, just permanently docked instead
 * of a slide-in overlay, since there are only 2–3 sub-tabs to show at once. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PaymentsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeTab, setActiveTab] = React.useState<PaymentTabKey>('regularPayments');
  const tenantType = useStudio.use.attachedTenant()?.tenant_type;

  const paymentTabs = tenantType === 'marketplace' ? MARKETPLACE_PAYMENT_TABS : DEFAULT_PAYMENT_TABS;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={[st.sidebar, { backgroundColor: colors.sidebarBg, borderColor: colors.border }]}>
        {paymentTabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[st.tab, active && { backgroundColor: colors.sidebarActiveBg }]}
            >
              <Ionicons name={tab.icon} size={20} color={active ? colors.accent : colors.sidebarText} />
              <Text style={[st.tabLabel, { color: active ? colors.accent : colors.sidebarText }]} numberOfLines={2}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {paymentTabs.map(
          (tab) => activeTab === tab.key && <tab.Component key={tab.key} />
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  sidebar: {
    width: 70,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 0,
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 0,
  },
  tabLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
});
