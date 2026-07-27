/**
 * Settings — sub-tab switcher, ported from `Studio/Settings/index.jsx`.
 */
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/lib/theme';

import { DomainsScreen } from './Domains/DomainsScreen';
import { PaymentsScreen } from './Payments/PaymentsScreen';

type SettingsSubTab = 'domains' | 'payments';

const SUB_TABS: { key: SettingsSubTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'domains', label: 'Domains', icon: 'globe-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
];

export function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const [tab, setTab] = React.useState<SettingsSubTab>('domains');

  return (
    <View style={{ flex: 1 }}>
      <View style={st.tabRow}>
        {SUB_TABS.map((s) => {
          const active = s.key === tab;
          return (
            <Pressable
              key={s.key}
              onPress={() => setTab(s.key)}
              style={[st.tab, { backgroundColor: t.surface }, active && { backgroundColor: t.accentSoft }]}
            >
              <Ionicons name={s.icon} size={14} color={active ? t.accent : t.textMuted} />
              <Text style={[st.tabText, { color: t.textMuted }, active && { color: t.accent }]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'domains' && <DomainsScreen />}
        {tab === 'payments' && <PaymentsScreen />}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
});
