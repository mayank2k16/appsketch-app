import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { AppColors } from '@/lib/theme';

import type { AssetSource } from './pickAsset';

const SOURCES: {
  key: AssetSource;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    key: 'camera',
    label: 'Take a photo',
    hint: 'Shoot it now with the camera',
    icon: 'camera-outline',
  },
  {
    key: 'library',
    label: 'Photo library',
    hint: 'Pick an existing photo',
    icon: 'images-outline',
  },
  {
    key: 'files',
    label: 'Files',
    hint: 'Browse images and video on this device',
    icon: 'folder-open-outline',
  },
];

/** Where should this upload come from? A native action sheet would be the
 * obvious answer, but it is iOS-only and system-coloured — this is the same
 * achromatic surface as the rest of the coder screens. */
export function AssetSourceSheet({
  visible,
  colors,
  onPick,
  onClose,
}: {
  visible: boolean;
  colors: AppColors;
  onPick: (source: AssetSource) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={st.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            st.sheet,
            {
              backgroundColor: colors.codeEditorSurface,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Text style={[st.title, { color: colors.textSub }]}>
            Add an image
          </Text>
          {SOURCES.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => onPick(s.key)}
              style={[st.row, { borderColor: colors.codeEditorBorder }]}
            >
              <View
                style={[st.icon, { backgroundColor: colors.codeEditorTabBg }]}
              >
                <Ionicons name={s.icon} size={18} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[st.rowLabel, { color: colors.text }]}>
                  {s.label}
                </Text>
                <Text style={[st.rowHint, { color: colors.textSub }]}>
                  {s.hint}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={colors.codeEditorTextMuted}
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} style={st.cancel}>
            <Text style={{ color: colors.textSub, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 28,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14.5, fontWeight: '600' },
  rowHint: { fontSize: 11.5, marginTop: 1 },
  cancel: { alignItems: 'center', paddingTop: 16 },
});
