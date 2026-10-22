import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppTypeKey } from '@/api/coder';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

import { PressableScale } from './pressable-scale';

const TYPE_PILLS: {
  key: AppTypeKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'web', label: 'Web', icon: 'globe-outline' },
  { key: 'mobile', label: 'App', icon: 'phone-portrait-outline' },
];

type Props = {
  t: AppColors;
  value: AppTypeKey;
  onChange: (value: AppTypeKey) => void;
};

// Shared Web/App selector — sits above a `PromptComposer` wherever a
// build's target platform needs picking (the standalone Agent screen, and
// now Home's ClosingCTA composer too).
export function AppTypePills({ t, value, onChange }: Props) {
  const { colorScheme } = useColorScheme();
  // White: the selected pill is ink with white text — no brand-tinted fill
  // (docs/white-theme.md). Dark keeps the palette's active pill.
  const dark = colorScheme === 'dark';
  const activeBg = dark ? t.agentTabActiveBg : '#0B0B0C';
  const activeText = dark ? t.agentTabActiveText : '#FFFFFF';
  return (
    <View style={s.row}>
      {TYPE_PILLS.map((p) => {
        const active = p.key === value;
        return (
          <PressableScale
            haptic={active ? false : 'select'}
            key={p.key}
            onPress={() => onChange(p.key)}
            accessibilityState={{ selected: active }}
            style={[
              s.pill,
              {
                backgroundColor: active ? activeBg : t.agentTabBg,
                borderColor: active ? activeBg : t.agentTabBorder,
              },
            ]}
          >
            <Ionicons
              name={p.icon}
              size={14}
              color={active ? activeText : t.agentTabIcon}
            />
            <Text
              style={[s.label, { color: active ? activeText : t.agentTabText }]}
            >
              {p.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontFamily: F.sans600,
    fontSize: 12,
  },
});
