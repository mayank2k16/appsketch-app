import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from '../theme';
import { CART_TABS } from './tabs';
import type { CartTabKey } from './tabs';

/** Nested shell for the Cart tab — same recipe as `Payments`/`Notifications`
 * one level deeper: a registry of sub-tabs (Abandoned Carts, Checkout
 * Orders) + conditional mounting, with a fixed-width vertical rail on the
 * left — same treatment as `Payments/PaymentsScreen.tsx`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CartScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeTab, setActiveTab] = React.useState<CartTabKey>('abandonedCarts');

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={[st.sidebar, { backgroundColor: colors.sidebarBg, borderColor: colors.border }]}>
        {CART_TABS.map((tab) => {
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
        {CART_TABS.map(
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
    paddingVertical: 0,
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
