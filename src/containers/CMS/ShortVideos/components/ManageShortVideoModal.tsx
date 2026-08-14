import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PickedShortVideoAsset, ShortVideoItem } from '@/api/short-videos';
import { useCreateShortVideo, useUpdateShortVideo } from '@/api/short-videos';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsDateTimeInput, CmsInput, CmsModal, CmsSheetScrollView, CmsSwitch, parseValue } from '../../components';
import type { CmsThemeColors } from '../../theme';

type FormState = {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  priority: string;
  is_active: boolean;
};

function getDefaultForm(): FormState {
  return { title: '', description: '', start_at: '', end_at: '', priority: '', is_active: true };
}

type Props = {
  colors: CmsThemeColors;
  video: ShortVideoItem | null;
  openKey: number;
  onDone: () => void;
};

export const ManageShortVideoModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, video, openKey, onDone }, ref) => {
    const isEdit = video !== null;
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [image, setImage] = React.useState<PickedShortVideoAsset | null>(null);
    const [videoAsset, setVideoAsset] = React.useState<PickedShortVideoAsset | null>(null);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const createShortVideo = useCreateShortVideo();
    const updateShortVideo = useUpdateShortVideo();
    const isSubmitting = createShortVideo.isPending || updateShortVideo.isPending;

    React.useEffect(() => {
      setImage(null);
      setVideoAsset(null);
      if (isEdit && video) {
        setForm({
          title: video.title || '',
          description: video.description || '',
          start_at: video.start_at || '',
          end_at: video.end_at || '',
          priority: video.priority !== undefined && video.priority !== null ? String(video.priority) : '',
          is_active: video.is_active ?? true,
        });
      } else {
        setForm(getDefaultForm());
      }
      setErrors({});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, isEdit, video]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function pickImage() {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.error('Media library permission is required to upload.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      setImage({ uri: asset.uri, name: asset.fileName ?? `short-video-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' });
    }

    async function pickVideo() {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.error('Media library permission is required to upload.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'videos', quality: 0.8 });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      setErrors((prev) => ({ ...prev, video: '' }));
      setVideoAsset({ uri: asset.uri, name: asset.fileName ?? `short-video-${Date.now()}.mp4`, type: asset.mimeType ?? 'video/mp4' });
    }

    function validate() {
      const next: Record<string, string> = {};
      if (!form.title.trim()) next.title = 'Title is required';
      if (form.start_at && form.end_at && new Date(form.start_at) > new Date(form.end_at)) {
        next.end_at = 'End date must be on or after the start date.';
      }
      // A reel with no video can never play, so require one on create.
      if (!isEdit && !videoAsset) next.video = 'Please upload a video.';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (!validate()) return;
      const payload = {
        ...form,
        ...(image ? { image } : {}),
        ...(videoAsset ? { video: videoAsset } : {}),
      };
      if (isEdit && video) {
        updateShortVideo.mutate({ id: video.id, payload }, { onSuccess: () => onDone() });
      } else {
        createShortVideo.mutate(payload, { onSuccess: () => onDone() });
      }
    }

    const imageUri = image?.uri ?? (isEdit ? video?.thumbnailUrl : null) ?? undefined;
    const videoPreviewUri = videoAsset?.uri ?? (isEdit ? video?.videoUrl : null) ?? undefined;

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['75%']}
        title={isEdit ? 'Edit short video' : 'Add Short Video'}
        footer={
          <CmsButton colors={colors} label={isSubmitting ? 'Saving…' : 'Save'} onPress={handleSubmit} loading={isSubmitting} />
        }
      >
        <CmsSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors}>
            <Text style={[st.fieldLabel, { color: colors.textSecondary }]}>
              Video<Text style={{ color: colors.danger }}> *</Text>
            </Text>
            {videoPreviewUri ? (
              <VideoPreview uri={videoPreviewUri} />
            ) : (
              <View style={[st.videoEmpty, { borderColor: colors.border }]}>
                <Text style={{ fontSize: 28 }}>🎬</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, width: '100%', textAlign: 'center' }}>No video chosen yet</Text>
              </View>
            )}
            <CmsButton
              colors={colors}
              variant="ghost"
              label={videoPreviewUri ? 'Replace video' : 'Choose video'}
              onPress={pickVideo}
            />
            {errors.video ? <Text style={[st.errorText, { color: colors.danger }]}>{errors.video}</Text> : null}
            <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>
              Best results with a vertical 9:16 clip, 15-60 seconds.
            </Text>

            <Pressable onPress={pickImage} style={[st.imageTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={st.imagePreview} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, width: '100%', textAlign: 'center' }}>Thumbnail image (optional)</Text>
                </>
              )}
            </Pressable>

            <CmsInput
              colors={colors}
              label="Title"
              placeholder="e.g. Fresh Arrivals"
              value={form.title}
              onChangeText={(v) => set('title', v)}
              error={errors.title}
              required
            />
            <CmsInput
              colors={colors}
              label="Description"
              placeholder="Short caption shown over the video…"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
            />
            <CmsDateTimeInput
              colors={colors}
              label="Visible from (optional)"
              value={form.start_at}
              onChange={(v) => set('start_at', v)}
            />
            <CmsDateTimeInput
              colors={colors}
              label="Visible until (optional)"
              value={form.end_at}
              onChange={(v) => set('end_at', v)}
              error={errors.end_at}
              minimumDate={parseValue(form.start_at) ?? undefined}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>
              Leave both dates empty to keep this video visible forever.
            </Text>
            <CmsInput
              colors={colors}
              label="Priority"
              placeholder="Lower shows first in the rail"
              keyboardType="number-pad"
              value={form.priority}
              onChangeText={(v) => set('priority', v)}
            />
            <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />
          </CmsCard>
        </CmsSheetScrollView>
      </CmsModal>
    );
  }
);

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={st.videoPreview} allowsFullscreen nativeControls />;
}

const st = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: '600', marginBottom: -2 },
  errorText: { fontSize: 11.5, marginTop: -4 },
  videoEmpty: {
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  videoPreview: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#000' },
  imageTile: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
});
