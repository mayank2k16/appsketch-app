import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useModal } from '@/components/ui';

import { CmsButton, CmsInput, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { MediaGalleryField } from './MediaGalleryField';

export type AttributeListFieldConfig = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'textarea' | 'image';
};

type Item = Record<string, string>;

type Props = {
  colors: CmsThemeColors;
  items: Item[];
  onChange: (items: Item[]) => void;
  fields: AttributeListFieldConfig[];
  displayKey?: string;
  renderDisplay?: (item: Item) => string;
  renderSub?: (item: Item) => string | undefined;
  addLabel: string;
  modalTitle: string;
  emptyLabel: string;
};

/** Config-driven repeatable list + add/edit popup — mirrors Vite's generic
 * `ListEditor` (`AddProductModal/ListEditor/index.jsx`), one component
 * instead of five near-identical ports (Amenities, FAQs, Key Benefits,
 * Specifications, and the Ingredients table all use this). */
export function AttributeListEditor({
  colors,
  items,
  onChange,
  fields,
  displayKey,
  renderDisplay,
  renderSub,
  addLabel,
  modalTitle,
  emptyLabel,
}: Props) {
  const modal = useModal();
  const [draft, setDraft] = React.useState<Item>({});
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function openAdd() {
    const blank: Item = {};
    fields.forEach((f) => {
      blank[f.key] = '';
    });
    setDraft(blank);
    setEditIndex(null);
    setErrors({});
    modal.present();
  }

  function openEdit(index: number) {
    setDraft({ ...items[index] });
    setEditIndex(index);
    setErrors({});
    modal.present();
  }

  function setField(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required && !(draft[f.key] ?? '').trim()) {
        nextErrors[f.key] = `${f.label} is required`;
      }
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const next = editIndex !== null ? items.map((it, i) => (i === editIndex ? draft : it)) : [...items, draft];
    onChange(next);
    modal.dismiss();
  }

  function handleDelete(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const display = (it: Item) => (renderDisplay ? renderDisplay(it) : it?.[displayKey ?? ''] || '—');

  return (
    <View style={{ gap: 8 }}>
      {items.length > 0 ? (
        items.map((it, idx) => (
          <View key={idx} style={[st.row, { borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[st.rowText, { color: colors.textPrimary }]} numberOfLines={1}>
                {display(it)}
              </Text>
              {renderSub?.(it) ? (
                <Text style={[st.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {renderSub(it)}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => openEdit(idx)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => handleDelete(idx)} hitSlop={8} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={17} color={colors.danger} />
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>{emptyLabel}</Text>
      )}

      <Pressable onPress={openAdd} style={[st.addBtn, { borderColor: colors.accent }]}>
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={[st.addLabel, { color: colors.accent }]}>{addLabel}</Text>
      </Pressable>

      <CmsModal ref={modal.ref} colors={colors} snapPoints={['75%']} title={editIndex !== null ? `Edit ${modalTitle}` : `Add ${modalTitle}`}>
        <View style={st.popupBody}>
          {fields.map((f) =>
            f.type === 'image' ? (
              <MediaGalleryField
                key={f.key}
                colors={colors}
                label={f.label}
                kind="image"
                value={draft[f.key] ? [draft[f.key]] : []}
                onChange={(v) => setField(f.key, v[0] ?? '')}
              />
            ) : (
              <CmsInput
                key={f.key}
                colors={colors}
                label={f.label}
                placeholder={f.placeholder}
                value={draft[f.key] ?? ''}
                onChangeText={(v) => setField(f.key, v)}
                multiline={f.type === 'textarea'}
                numberOfLines={f.type === 'textarea' ? 3 : undefined}
                error={errors[f.key]}
              />
            )
          )}
          <CmsButton
            colors={colors}
            label={editIndex !== null ? 'Save Changes' : `Add ${modalTitle}`}
            onPress={handleSave}
          />
        </View>
      </CmsModal>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  rowText: { ...cmsType.listSubtitle },
  rowSub: { fontSize: 11.5, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  addLabel: { fontSize: 12.5, fontWeight: '700' },
  popupBody: { padding: 16, gap: 12 },
});
