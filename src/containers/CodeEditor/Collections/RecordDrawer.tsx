import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  type KeyboardTypeOptions,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  Collection,
  CollectionFieldType,
  CollectionRecord,
} from '@/api/coder';
import {
  createRecord,
  deleteRecord,
  updateRecord,
  uploadAsset,
} from '@/api/coder';
import type { AppColors } from '@/lib/theme';

import { AssetSourceSheet } from './AssetSourceSheet';
import type { AssetSource } from './pickAsset';
import { pickAsset } from './pickAsset';
import { RefPicker } from './RefPicker';

type Values = Record<string, unknown>;

/** Keyboard for a plain-text field — the mobile equivalent of the web's
 * `inputTypeFor`. An `email` field that opens the alphabetic keyboard with
 * autocapitalisation on is a typo waiting to happen. */
const KEYBOARD: Partial<Record<CollectionFieldType, KeyboardTypeOptions>> = {
  number: 'numeric',
  email: 'email-address',
  url: 'url',
};

/** Create/edit panel for a single CMS record — a form generated from the
 * collection's field schema, ported from Vite's `RecordDrawer.jsx`. Image
 * fields upload via the same `upload-asset` endpoint the Inspector uses.
 *
 * Every type the engine validates (`FIELD_TYPES` in dynamic/engine.py) gets a
 * real control here. It used to render four — boolean, richtext, image and
 * "everything else is a text box" — which meant a `select` accepted anything
 * the schema forbade and a `reference` asked you to type a foreign key from
 * memory. */
export const RecordDrawer = React.forwardRef<
  BottomSheetModal,
  {
    tenantId: string;
    collection: Collection | null;
    record: CollectionRecord | null;
    colors: AppColors;
    onSaved: () => void;
    onDeleted: () => void;
  }
>(({ tenantId, collection, record, colors, onSaved, onDeleted }, ref) => {
  const fields = collection?.fields ?? [];
  const isNew = !record;

  const [values, setValues] = React.useState<Values>({});
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [err, setErr] = React.useState('');
  // which field is waiting on a camera/library/files choice
  const [sourceFor, setSourceFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    const init: Values = {};
    fields.forEach((f) => {
      const v = record?.data?.[f.name];
      init[f.name] =
        v === undefined || v === null ? (f.type === 'boolean' ? false : '') : v;
    });
    setValues(init);
    setErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id, collection?.slug]);

  function set(name: string, v: unknown) {
    setValues((prev) => ({ ...prev, [name]: v }));
  }

  async function uploadFrom(name: string, source: AssetSource) {
    setSourceFor(null);
    setErr('');
    let asset;
    try {
      asset = await pickAsset(source);
    } catch (e) {
      // a refused permission is a sentence the user can act on, not a silent
      // no-op — pickAsset throws it rather than returning null
      setErr(e instanceof Error ? e.message : 'Could not open that picker.');
      return;
    }
    if (!asset) return; // cancelled
    setUploading(name);
    try {
      const res = await uploadAsset(tenantId, asset);
      if (res.ok && res.url) set(name, res.url);
      else setErr('Upload failed.');
    } catch {
      setErr('Upload failed.');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!collection) return;
    setSaving(true);
    setErr('');
    const data: Values = {};
    fields.forEach((f) => {
      let v = values[f.name];
      if (f.type === 'number' && v !== '' && v !== null && v !== undefined)
        v = Number(v);
      if (f.type === 'boolean') v = !!v;
      data[f.name] = v;
    });
    try {
      const res = isNew
        ? await createRecord(tenantId, collection.slug, data)
        : await updateRecord(tenantId, collection.slug, record!.id, data);
      if (res.ok) {
        onSaved();
      } else {
        setErr(res.error || "Couldn't save.");
      }
    } catch {
      setErr("Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (isNew || !collection || !record) return;
    setSaving(true);
    setErr('');
    try {
      const res = await deleteRecord(tenantId, collection.slug, record.id);
      if (res.ok) onDeleted();
      else setErr("Couldn't delete.");
    } catch {
      setErr("Couldn't delete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={['85%']}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.codeEditorSurface }}
      handleIndicatorStyle={{ backgroundColor: colors.codeEditorBorder }}
    >
      <View style={[st.head, { borderColor: colors.codeEditorBorder }]}>
        <Text style={[st.title, { color: colors.text }]}>
          {isNew ? 'New record' : 'Edit record'}
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={st.body}>
        {fields.length === 0 && (
          <Text style={{ color: colors.textSub }}>
            This collection has no fields defined.
          </Text>
        )}

        {fields.map((f) => (
          <View key={f.name} style={st.fieldRow}>
            <Text style={[st.label, { color: colors.textSub }]}>
              {f.label || f.name}
              {f.required ? ' *' : ''} ·{' '}
              {f.type === 'reference' && f.collection
                ? `→ ${f.collection}`
                : f.type}
            </Text>

            {f.type === 'boolean' ? (
              <Switch
                value={!!values[f.name]}
                onValueChange={(v) => set(f.name, v)}
                trackColor={{ true: colors.accent }}
              />
            ) : f.type === 'richtext' ? (
              <TextInput
                value={(values[f.name] as string) ?? ''}
                onChangeText={(v) => set(f.name, v)}
                multiline
                numberOfLines={4}
                style={[
                  st.input,
                  st.textarea,
                  { color: colors.text, borderColor: colors.codeEditorBorder },
                ]}
              />
            ) : f.type === 'image' ? (
              <View style={st.imageField}>
                {values[f.name] ? (
                  <Image
                    source={{ uri: values[f.name] as string }}
                    style={st.imagePreview}
                  />
                ) : (
                  <View
                    style={[
                      st.imageEmpty,
                      { borderColor: colors.codeEditorBorder },
                    ]}
                  >
                    <Ionicons
                      name="image-outline"
                      size={20}
                      color={colors.codeEditorTextMuted}
                    />
                  </View>
                )}
                <View style={{ flex: 1, gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setSourceFor(f.name)}
                    disabled={uploading === f.name}
                    style={[
                      st.uploadBtn,
                      {
                        backgroundColor: colors.codeEditorTabBg,
                        borderColor: colors.codeEditorBorder,
                      },
                    ]}
                  >
                    {uploading === f.name ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <View style={st.uploadBtnInner}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={14}
                          color={colors.text}
                        />
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: 12.5,
                            fontWeight: '600',
                          }}
                        >
                          {values[f.name] ? 'Replace image' : 'Upload image'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TextInput
                    value={(values[f.name] as string) ?? ''}
                    onChangeText={(v) => set(f.name, v)}
                    placeholder="or paste image URL"
                    placeholderTextColor={colors.codeEditorTextMuted}
                    style={[
                      st.input,
                      {
                        color: colors.text,
                        borderColor: colors.codeEditorBorder,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : f.type === 'select' ? (
              <SelectField
                value={String(values[f.name] ?? '')}
                options={f.options ?? []}
                colors={colors}
                onChange={(v) => set(f.name, v)}
              />
            ) : f.type === 'reference' ? (
              <RefPicker
                tenantId={tenantId}
                target={f.collection}
                display={f.display}
                value={(values[f.name] as string | number) ?? ''}
                colors={colors}
                onChange={(v) => set(f.name, v)}
              />
            ) : (
              <TextInput
                value={String(values[f.name] ?? '')}
                onChangeText={(v) => set(f.name, v)}
                keyboardType={KEYBOARD[f.type] ?? 'default'}
                placeholder={f.type === 'date' ? 'YYYY-MM-DD' : undefined}
                placeholderTextColor={colors.codeEditorTextMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  st.input,
                  { color: colors.text, borderColor: colors.codeEditorBorder },
                ]}
              />
            )}
          </View>
        ))}

        {err ? (
          <Text style={{ color: colors.codeEditorDanger, fontSize: 12.5 }}>
            {err}
          </Text>
        ) : null}
      </BottomSheetScrollView>

      <AssetSourceSheet
        visible={sourceFor !== null}
        colors={colors}
        onClose={() => setSourceFor(null)}
        onPick={(source) => sourceFor && uploadFrom(sourceFor, source)}
      />

      <View style={[st.foot, { borderColor: colors.codeEditorBorder }]}>
        {!isNew && (
          <TouchableOpacity
            onPress={remove}
            disabled={saving}
            style={[st.footBtn, { borderColor: colors.codeEditorDanger }]}
          >
            <Text
              style={{
                color: colors.codeEditorDanger,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Delete
            </Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          style={[
            st.footBtn,
            st.footBtnPrimary,
            { backgroundColor: colors.accent },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={st.footBtnPrimaryText}>
              {isNew ? 'Create' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
});
RecordDrawer.displayName = 'RecordDrawer';

/** A `select`'s declared options as tappable chips. There is no native picker
 * worth the dependency here and these lists are short by construction — the
 * schema author enumerated them.
 *
 * A value the schema no longer offers stays visible and selected rather than
 * being silently rewritten to blank by the first save (same rule as the web's
 * "(not in options)" entry). */
function SelectField({
  value,
  options,
  colors,
  onChange,
}: {
  value: string;
  options: string[];
  colors: AppColors;
  onChange: (v: string) => void;
}) {
  const orphan = !!value && !options.includes(value);
  const all = orphan ? [...options, value] : options;

  return (
    <View style={st.chipWrap}>
      {all.map((o) => {
        const on = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(on ? '' : o)}
            style={[
              st.chip,
              {
                backgroundColor: on
                  ? colors.accentSoft
                  : colors.codeEditorTabBg,
                borderColor: on ? colors.accent : colors.codeEditorBorder,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '600',
                color: on ? colors.codeEditorAccentText : colors.text,
              }}
            >
              {o}
              {orphan && o === value ? ' (not in options)' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
      {all.length === 0 ? (
        <Text style={{ color: colors.textSub, fontSize: 12.5 }}>
          This field declares no options.
        </Text>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  head: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 15.5, fontWeight: '700' },
  body: { padding: 18, gap: 16 },
  fieldRow: { gap: 8 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  imageField: { flexDirection: 'row', gap: 12 },
  imagePreview: { width: 64, height: 64, borderRadius: 10 },
  imageEmpty: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footBtnPrimary: { borderWidth: 0 },
  footBtnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },
});
