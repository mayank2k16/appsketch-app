import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppTypeKey } from '@/api/coder';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

const TYPE_PILLS: {
  key: AppTypeKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { key: 'web', label: 'Web', icon: 'globe-outline' },
  { key: 'mobile', label: 'App', icon: 'phone-portrait-outline' },
  { key: 'game', label: 'Game', icon: 'game-controller-outline' },
];

type Props = {
  t: AppColors;
  value: AppTypeKey;
  onChange: (value: AppTypeKey) => void;
};

// Shared Web/App/Game selector — sits above a `PromptComposer` wherever a
// build's target platform needs picking (the standalone Agent screen, and
// now Home's ClosingCTA composer too).
export function AppTypePills({ t, value, onChange }: Props) {
  return (
    <View style={s.row}>
      {TYPE_PILLS.map((p) => {
        const active = p.key === value;
        return (
          <TouchableOpacity
            key={p.key}
            onPress={() => onChange(p.key)}
            activeOpacity={0.8}
            style={[
              s.pill,
              {
                backgroundColor: active ? t.agentTabActiveBg : t.agentTabBg,
                borderColor: active ? t.agentTabActiveBg : t.agentTabBorder,
              },
            ]}
          >
            <Ionicons name={p.icon} size={14} color={active ? t.agentTabActiveText : t.agentTabIcon} />
            <Text style={[s.label, { color: active ? t.agentTabActiveText : t.agentTabText }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
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
