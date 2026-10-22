/**
 * Settings — sub-tab switcher, ported from `Studio/Settings/index.jsx`.
 */
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PressableScale } from '@/components/ui';
import { useCoderTheme } from '@/lib/theme';

import { DomainsScreen } from './Domains/DomainsScreen';
import { PaymentsScreen } from './Payments/PaymentsScreen';

type SettingsSubTab = 'domains' | 'payments';

const SUB_TABS: {
  key: SettingsSubTab;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'domains', label: 'Domains', icon: 'globe-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
];

export function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);
  const [tab, setTab] = React.useState<SettingsSubTab>('domains');
  // White: chips are INSET wells and the selected one is an ink pill (a white
  // chip on paper does not read). Dark keeps the palette's own values.
  const chip =
    colorScheme === 'dark'
      ? { idleBg: t.surface, activeBg: t.accentSoft, activeText: t.accent }
      : { idleBg: '#F4F4F2', activeBg: '#0B0B0C', activeText: '#FFFFFF' };

  return (
    <View style={{ flex: 1 }}>
      <View style={st.tabRow}>
        {SUB_TABS.map((s) => {
          const active = s.key === tab;
          return (
            <PressableScale
              key={s.key}
              onPress={() => setTab(s.key)}
              accessibilityState={{ selected: active }}
              style={[
                st.tab,
                { backgroundColor: chip.idleBg },
                active && { backgroundColor: chip.activeBg },
              ]}
            >
              <Ionicons
                name={s.icon}
                size={14}
                color={active ? chip.activeText : t.textMuted}
              />
              <Text
                style={[
                  st.tabText,
                  { color: t.textMuted },
                  active && { color: chip.activeText },
                ]}
              >
                {s.label}
              </Text>
            </PressableScale>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
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
