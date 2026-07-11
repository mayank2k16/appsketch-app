import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { uploadProductMedia } from '@/api/products';
import { toast } from '@/lib/toast';

import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type Props = {
  colors: CmsThemeColors;
  label: string;
  kind: 'image' | 'video';
  /** Single mode replaces the one value in place (primary image); multiple
   * mode appends to a gallery. */
  multiple?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
};

/** Shared picker+uploader for the primary image, the images gallery, and
 * the videos gallery — each item is uploaded to `api/shop/upload_image/`
 * immediately on pick (matching Vite's per-file upload-then-store-URL
 * flow) so `value` only ever holds already-hosted URLs. */
export function MediaGalleryField({ colors, label, kind, multiple, value, onChange }: Props) {
  const [isUploading, setIsUploading] = React.useState(false);

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      toast.error('Media library permission is required to upload.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'image' ? 'images' : 'videos',
      allowsMultipleSelection: multiple,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await Promise.all(
        result.assets.map((asset) =>
          uploadProductMedia({
            uri: asset.uri,
            name: asset.fileName ?? `upload-${Date.now()}.${kind === 'image' ? 'jpg' : 'mp4'}`,
            type: asset.mimeType ?? (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
          })
        )
      );
      onChange(multiple ? [...value, ...uploaded] : [uploaded[0]]);
    } catch {
      toast.error(`Failed to upload ${kind}.`);
    } finally {
      setIsUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={st.grid}>
        {value.map((uri, i) => (
          <View key={`${uri}-${i}`} style={[st.tile, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {kind === 'image' ? (
              <Image source={{ uri }} style={st.tileImg} contentFit="cover" />
            ) : (
              <View style={st.videoTile}>
                <Ionicons name="videocam" size={20} color={colors.textSecondary} />
              </View>
            )}
            <Pressable onPress={() => remove(i)} style={[st.removeBtn, { backgroundColor: colors.danger }]} hitSlop={6}>
              <Ionicons name="close" size={11} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}

        {(multiple || value.length === 0) && (
          <Pressable
            onPress={pickAndUpload}
            disabled={isUploading}
            style={[st.tile, st.addTile, { borderColor: colors.border }]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons name="add" size={20} color={colors.accent} />
                <Text style={[st.addLabel, { color: colors.accent }]}>Add</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImg: { width: '100%', height: '100%' },
  videoTile: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  removeBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: { alignItems: 'center', justifyContent: 'center', gap: 2, borderStyle: 'dashed' },
  addLabel: { fontSize: 10, fontWeight: '700' },
});
