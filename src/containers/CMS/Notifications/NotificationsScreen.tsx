import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCmsTheme } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { NOTIFICATION_TABS } from './tabs';
import type { NotificationTabKey } from './tabs';

/** Nested shell for the Notifications tab — same recipe as `CmsShell` one
 * level deeper: a registry of sub-tabs + conditional mounting, except the
 * sub-tab switcher is a horizontal strip rather than a drawer (the top-level
 * CmsDrawer already owns tab-switching for the whole CMS; this is a second,
 * smaller switcher scoped to Notifications' own 8 sub-sections). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationsScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [activeTab, setActiveTab] = React.useState<NotificationTabKey>('channels');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={st.tabScroll}
        contentContainerStyle={st.tabRow}
      >
        {NOTIFICATION_TABS.map((tab) => {
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
        {NOTIFICATION_TABS.map(
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
