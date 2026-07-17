import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { PAYMENT_TABS } from './tabs';
import type { PaymentTabKey } from './tabs';

/** Nested shell for the Payments tab — same recipe as `CmsShell` /
 * `Notifications/NotificationsScreen.tsx` one level deeper: a registry of
 * sub-tabs (Regular Payments, Bulk Payments, Vendor Settlements) + conditional
 * mounting, with a horizontal sub-tab strip instead of opening the main
 * drawer again. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PaymentsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeTab, setActiveTab] = React.useState<PaymentTabKey>('regularPayments');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.tabScroll}
        contentContainerStyle={st.tabRow}
      >
        {PAYMENT_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                st.tab,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Ionicons name={tab.icon} size={14} color={active ? colors.accentText : colors.textSecondary} />
              <Text style={[st.tabLabel, { color: active ? colors.accentText : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {PAYMENT_TABS.map(
          (tab) => activeTab === tab.key && <tab.Component key={tab.key} />
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  tabScroll: { flexGrow: 0 },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: cmsType.listBadge,
});
