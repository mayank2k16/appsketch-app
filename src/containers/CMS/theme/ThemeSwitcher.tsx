import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useModal } from '@/components/ui/modal';

import { CmsModal } from '../components';
import { cmsThemeOrder, cmsThemes } from './cms-theme';
import type { CmsThemeGroup, CmsThemeName } from './cms-theme';
import { useCmsTheme } from './use-cms-theme';

const MAX_SHEET_HEIGHT = 560;
const ROW_HEIGHT = 68;
const SECTION_HEADER_HEIGHT = 32;

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

type ThemeSection = { title: CmsThemeGroup; data: CmsThemeName[] };

const themeSections: ThemeSection[] = (() => {
  const sections: ThemeSection[] = [];
  for (const name of cmsThemeOrder) {
    const group = cmsThemes[name].group;
    const last = sections[sections.length - 1];
    if (last?.title === group) last.data.push(name);
    else sections.push({ title: group, data: [name] });
  }
  return sections;
})();

const ThemeSwitcherSheet = React.forwardRef<BottomSheetModal, { onSelect: () => void }>(
  ({ onSelect }, ref) => {
    const { themeName, colors, setThemeName } = useCmsTheme();

    const height = Math.min(
      cmsThemeOrder.length * ROW_HEIGHT + themeSections.length * SECTION_HEADER_HEIGHT + 140,
      MAX_SHEET_HEIGHT
    );
    const snapPoints = React.useMemo(() => [height], [height]);

    const choose = React.useCallback(
      (name: CmsThemeName) => {
        setThemeName(name);
        onSelect();
      },
      [setThemeName, onSelect]
    );

    return (
      <CmsModal ref={ref} colors={colors} title="CMS Theme" snapPoints={snapPoints}>
        <BottomSheetSectionList
          sections={themeSections}
          keyExtractor={(name) => name}
          contentContainerStyle={st.sheet}
          renderSectionHeader={({ section }) => (
            <Text style={[st.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item: name }) => {
            const meta = cmsThemes[name];
            // Swatches use this theme's own colors (not the active `colors`)
            // so the row previews what picking it would actually look like.
            const preview = colors.kind === 'dark' ? meta.dark : meta.light;
            const selected = name === themeName;
            return (
              <Pressable
                onPress={() => choose(name)}
                style={[st.row, { borderColor: colors.border }]}
              >
                <View style={st.swatchGroup}>
                  <View style={[st.swatch, { backgroundColor: preview.sidebarBg }]} />
                  <View style={[st.swatch, { backgroundColor: preview.accent }]} />
                  <View
                    style={[st.swatch, { backgroundColor: preview.surface, borderWidth: 1, borderColor: '#00000022' }]}
                  />
                </View>
                <Text style={[st.label, { color: colors.textPrimary }]}>{meta.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
              </Pressable>
            );
          }}
        />
      </CmsModal>
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: 14,
    paddingBottom: 6,
  },
});
