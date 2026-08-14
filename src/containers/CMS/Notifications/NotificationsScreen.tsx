import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from '../theme';
import { NOTIFICATION_TABS } from './tabs';
import type { NotificationTabKey } from './tabs';

export function NotificationsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeTab, setActiveTab] = React.useState<NotificationTabKey>('channels');

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <ScrollView
        style={[st.sidebar, { backgroundColor: colors.sidebarBg, borderColor: colors.border }]}
        contentContainerStyle={st.sidebarContent}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATION_TABS.map((tab) => {
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
      </ScrollView>

      <View style={{ flex: 1 }}>
        {NOTIFICATION_TABS.map(
          (tab) => activeTab === tab.key && <tab.Component key={tab.key} />
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  sidebar: {
    width: 70,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 70,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sidebarContent: {
    paddingVertical: 0,
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
