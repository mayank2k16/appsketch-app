import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Collection, CollectionRecord } from '@/api/coder';
import {
  createRecord,
  deleteRecord,
  updateRecord,
  uploadAsset,
} from '@/api/coder';
import type { AppColors } from '@/lib/theme';
import { toast } from '@/lib/toast';

type Values = Record<string, unknown>;

/** Create/edit panel for a single CMS record — a form generated from the
 * collection's field schema, ported from Vite's `RecordDrawer.jsx`. Image
 * fields upload via the same `upload-asset` endpoint the Inspector uses. */
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

  async function uploadImage(name: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to upload an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(name);
    setErr('');
    try {
      const res = await uploadAsset(tenantId, {
        uri: asset.uri,
        name: asset.fileName || `upload-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
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
              {f.name}
              {f.required ? ' *' : ''} · {f.type}
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
                    onPress={() => uploadImage(f.name)}
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
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 12.5,
                          fontWeight: '600',
                        }}
                      >
                        Upload image
                      </Text>
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
            ) : (
              <TextInput
                value={String(values[f.name] ?? '')}
                onChangeText={(v) => set(f.name, v)}
                keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                autoCapitalize="none"
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
