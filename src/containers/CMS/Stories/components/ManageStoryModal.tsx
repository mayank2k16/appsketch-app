import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { PickedStoryAsset, StoryItem } from '@/api/stories';
import { useCreateStory, useUpdateStory } from '@/api/stories';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';

type FormState = {
  title: string;
  subtitle: string;
  timestamp_label: string;
  body: string;
  cta_label: string;
  action_link: string;
  priority: string;
  is_featured: boolean;
  is_active: boolean;
};

function getDefaultForm(): FormState {
  return {
    title: '',
    subtitle: '',
    timestamp_label: '',
    body: '',
    cta_label: "Read today's story",
    action_link: '',
    priority: '',
    is_featured: false,
    is_active: true,
  };
}

type Props = {
  colors: CmsThemeColors;
  story: StoryItem | null;
  openKey: number;
  onDone: () => void;
};

export const ManageStoryModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, story, openKey, onDone }, ref) => {
    const isEdit = story !== null;
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [image, setImage] = React.useState<PickedStoryAsset | null>(null);

    const createStory = useCreateStory();
    const updateStory = useUpdateStory();
    const isSubmitting = createStory.isPending || updateStory.isPending;

    React.useEffect(() => {
      setImage(null);
      if (isEdit && story) {
        setForm({
          title: story.title || '',
          subtitle: story.subtitle || '',
          timestamp_label: story.timestamp_label || '',
          body: story.body || '',
          cta_label: story.cta_label || '',
          action_link: story.action_link || '',
          priority: story.priority !== undefined && story.priority !== null ? String(story.priority) : '',
          is_featured: !!story.is_featured,
          is_active: story.is_active ?? true,
        });
      } else {
        setForm(getDefaultForm());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, isEdit, story]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
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
      setImage({ uri: asset.uri, name: asset.fileName ?? `story-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' });
    }

    function handleSubmit() {
      if (!form.title.trim()) {
        toast.error('Title is required');
        return;
      }
      const payload = {
        ...form,
        ...(image ? { image } : {}),
      };
      if (isEdit && story) {
        updateStory.mutate({ id: story.id, payload }, { onSuccess: () => onDone() });
      } else {
        createStory.mutate(payload, { onSuccess: () => onDone() });
      }
    }

    const imageUri = image?.uri ?? (isEdit ? (story?.thumbnailUrl ?? story?.imageUrl) : null) ?? undefined;

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title={isEdit ? 'Edit story' : 'Add Story'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors}>
            <Pressable onPress={pickImage} style={[st.imageTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={st.imagePreview} contentFit="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Story Image</Text>
                </>
              )}
            </Pressable>

            <CmsInput
              colors={colors}
              label="Title"
              placeholder="e.g. 6:14 AM: today's harvest arrived…"
              value={form.title}
              onChangeText={(v) => set('title', v)}
            />
            <CmsInput
              colors={colors}
              label="Subtitle"
              placeholder="Short supporting line"
              value={form.subtitle}
              onChangeText={(v) => set('subtitle', v)}
            />
            <CmsInput
              colors={colors}
              label="Timestamp label"
              placeholder="e.g. Captured 12 minutes ago"
              value={form.timestamp_label}
              onChangeText={(v) => set('timestamp_label', v)}
            />
            <CmsInput
              colors={colors}
              label="Body"
              placeholder="The story text shown under the title…"
              value={form.body}
              onChangeText={(v) => set('body', v)}
              multiline
              numberOfLines={3}
            />
            <CmsInput
              colors={colors}
              label="Button label (CTA)"
              placeholder="Read today's story"
              value={form.cta_label}
              onChangeText={(v) => set('cta_label', v)}
            />
            <CmsInput
              colors={colors}
              label="Action link (optional)"
              placeholder="https://…"
              value={form.action_link}
              onChangeText={(v) => set('action_link', v)}
              autoCapitalize="none"
              keyboardType="url"
            />
            <CmsInput
              colors={colors}
              label="Priority"
              placeholder="Lower shows first in the rail"
              keyboardType="number-pad"
              value={form.priority}
              onChangeText={(v) => set('priority', v)}
            />
            <CmsSwitch colors={colors} label="Featured (shows in home hero)" value={form.is_featured} onChange={(v) => set('is_featured', v)} />
            <CmsSwitch colors={colors} label="Active" value={form.is_active} onChange={(v) => set('is_active', v)} />
          </CmsCard>

          <CmsButton colors={colors} label={isSubmitting ? 'Saving…' : 'Save'} onPress={handleSubmit} loading={isSubmitting} />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  imageTile: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
});
