import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { F } from '@/lib/fonts';
import { haptic } from '@/lib/haptics';
import type { AppColors } from '@/lib/theme';

import { PressableScale } from './pressable-scale';

export type ModelOption = { value: string; label: string; context: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  t: AppColors;
  models: ModelOption[];
  value: string;
  onChange: (value: string) => void;
  formatContext: (tokens: number) => string;
  /** Ids the caller may run. `null`/`undefined` (quota not loaded yet, or the
   * fetch failed) fails OPEN — nothing is locked, matching the web
   * `ModelPicker`'s `isLocked` predicate. */
  allowedModels?: string[] | null;
  /** Tapping a locked model calls this instead of selecting it. */
  onLockedPress?: (model: ModelOption) => void;
};

// Shared model-picker bottom sheet — used by both the Home hero surface
// (AgentV2) and the standalone Agent tab (via PromptComposer), so lock
// awareness only needs to be built once instead of patched into two
// near-identical inline <Modal>s.
export function ModelPickerModal({
  visible,
  onClose,
  t,
  models,
  value,
  onChange,
  formatContext,
  allowedModels,
  onLockedPress,
}: Props) {
  const { colorScheme } = useColorScheme();
  // White (docs/white-theme.md): ink scrim, hairline sheet edge, ink check.
  const dark = colorScheme === 'dark';
  const sheetBorder = dark ? t.agentInputBorder : '#E7E7E4';
  const checkColor = dark ? t.accent : '#0B0B0C';

  function isLocked(m: ModelOption) {
    return Array.isArray(allowedModels) && !allowedModels.includes(m.value);
  }

  return (
    <Modal
      onShow={haptic.soft}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPressIn={haptic.tap}
        style={[s.modalBackdrop, !dark && s.whiteScrim]}
        onPress={onClose}
      >
        <Pressable
          style={[
            s.modelSheet,
            { backgroundColor: t.sheetBg, borderColor: sheetBorder },
          ]}
        >
          <Text style={[s.modelSheetTitle, { color: t.text }]}>AI model</Text>
          {models.map((m) => {
            const selected = m.value === value;
            const locked = isLocked(m);
            return (
              <ModelRow
                key={m.value}
                m={m}
                t={t}
                selected={selected}
                locked={locked}
                checkColor={checkColor}
                formatContext={formatContext}
                onPress={() => {
                  onClose();
                  if (locked) {
                    onLockedPress?.(m);
                    return;
                  }
                  onChange(m.value);
                }}
              />
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ModelRow({
  m,
  t,
  selected,
  locked,
  checkColor,
  formatContext,
  onPress,
}: {
  m: ModelOption;
  t: AppColors;
  selected: boolean;
  locked: boolean;
  checkColor: string;
  formatContext: (tokens: number) => string;
  onPress: () => void;
}) {
  return (
    <PressableScale scaleTo={0.98} onPress={onPress} style={s.modelOption}>
      <View style={{ flex: 1 }}>
        <Text
          style={[s.modelOptionLabel, { color: locked ? t.textMuted : t.text }]}
        >
          {m.label}
        </Text>
        <Text style={[s.modelOptionMeta, { color: t.textSub }]}>
          {formatContext(m.context)}
        </Text>
      </View>
      {locked ? (
        <Ionicons name="lock-closed-outline" size={16} color={t.textMuted} />
      ) : (
        selected && (
          <Ionicons name="checkmark-circle" size={18} color={checkColor} />
        )
      )}
    </PressableScale>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  whiteScrim: {
    backgroundColor: 'rgba(11,11,12,0.32)',
  },
  modelSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 18,
    paddingBottom: 34,
    gap: 4,
  },
  modelSheetTitle: {
    fontFamily: F.sans700,
    fontSize: 15,
    marginBottom: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modelOptionLabel: {
    fontFamily: F.sans600,
    fontSize: 13.5,
  },
  modelOptionMeta: {
    fontFamily: F.sans400,
    fontSize: 11.5,
    marginTop: 2,
  },
});
