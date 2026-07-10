import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Modal, useModal } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';

import { cmsThemeOrder, cmsThemes } from './cms-theme';
import type { CmsThemeName } from './cms-theme';
import { useCmsTheme } from './use-cms-theme';

export function ThemeSwitcherButton() {
  const { colors } = useCmsTheme();
  const modal = useModal();

  return (
    <>
      <Pressable
        onPress={modal.present}
        style={[st.trigger, { backgroundColor: colors.sidebarActiveBg }]}
        hitSlop={8}
        accessibilityLabel="Change CMS theme"
      >
        <Ionicons name="color-palette-outline" size={18} color={colors.sidebarText} />
      </Pressable>
      <ThemeSwitcherSheet ref={modal.ref} onSelect={modal.dismiss} />
    </>
  );
}

const ThemeSwitcherSheet = React.forwardRef<BottomSheetModal, { onSelect: () => void }>(
  ({ onSelect }, ref) => {
    const { themeName, colors, setThemeName } = useCmsTheme();

    const snapPoints = React.useMemo(() => [cmsThemeOrder.length * 68 + 140], []);

    const choose = React.useCallback(
      (name: CmsThemeName) => {
        setThemeName(name);
        onSelect();
      },
      [setThemeName, onSelect]
    );

    return (
      <Modal ref={ref} title="CMS Theme" snapPoints={snapPoints}>
        <View style={[st.sheet, { backgroundColor: colors.surface }]}>
          {cmsThemeOrder.map((name) => {
            const meta = cmsThemes[name];
            const selected = name === themeName;
            return (
              <Pressable
                key={name}
                onPress={() => choose(name)}
                style={[st.row, { borderColor: colors.border }]}
              >
                <View style={st.swatchGroup}>
                  <View style={[st.swatch, { backgroundColor: meta.colors.sidebarBg }]} />
                  <View style={[st.swatch, { backgroundColor: meta.colors.accent }]} />
                  <View
                    style={[st.swatch, { backgroundColor: meta.colors.surface, borderWidth: 1, borderColor: '#00000022' }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.label, { color: colors.textPrimary }]}>{meta.label}</Text>
                  <Text style={[st.kind, { color: colors.textSecondary }]}>
                    {meta.kind === 'dark' ? 'Dark' : 'Light'}
                  </Text>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    );
  }
);

const st = StyleSheet.create({
  trigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swatchGroup: {
    flexDirection: 'row',
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  kind: {
    fontSize: 11,
    marginTop: 1,
  },
});
