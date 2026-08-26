import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CategoryNode, PickedCategoryAsset } from '@/api/categories';
import {
  useAddSubCategory,
  useCreateCategory,
  useUpdateCategory,
} from '@/api/categories';
import { resolveMediaUrl } from '@/lib/media-url';
import { toast } from '@/lib/toast';

import {
  CmsButton,
  CmsCard,
  CmsInput,
  CmsModal,
  CmsSheetScrollView,
  CmsSwitch,
} from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';

type FormState = {
  name: string;
  description: string;
  home_page: boolean;
  href_path: string;
  colour: string;
  priority: string;
};

function getDefaultForm(): FormState {
  return {
    name: '',
    description: '',
    home_page: false,
    href_path: '',
    colour: '',
    priority: '',
  };
}

const HEX_RE = /^#([0-9a-f]{6})$/i;

type Props = {
  colors: CmsThemeColors;
  mode: 'create' | 'edit' | 'addSub';
  category: CategoryNode | null;
  parentId: number | null;
  openKey: number;
  onDone: () => void;
};

export const ManageCategoryModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, mode, category, parentId, openKey, onDone }, ref) => {
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [image, setImage] = React.useState<PickedCategoryAsset | null>(null);
    const [bannerImage, setBannerImage] =
      React.useState<PickedCategoryAsset | null>(null);
    const [icon, setIcon] = React.useState<PickedCategoryAsset | null>(null);
    const [backgroundImage, setBackgroundImage] =
      React.useState<PickedCategoryAsset | null>(null);

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const addSubCategory = useAddSubCategory();
    const isSubmitting =
      createCategory.isPending ||
      updateCategory.isPending ||
      addSubCategory.isPending;

    React.useEffect(() => {
      setImage(null);
      setBannerImage(null);
      setIcon(null);
      setBackgroundImage(null);
      if (mode === 'edit' && category) {
        setForm({
          name: category.name || '',
          description: category.description || '',
          home_page: category.home_page || false,
          href_path: category.href_path ?? '',
          colour: category.colour ?? '',
          priority: category.priority != null ? String(category.priority) : '',
        });
      } else {
        setForm(getDefaultForm());
      }
    }, [openKey, mode, category]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function pickImage(setter: (asset: PickedCategoryAsset) => void) {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        toast.error('Media library permission is required to upload.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      setter({
        uri: asset.uri,
        name: asset.fileName ?? `category-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }

    function handleSubmit() {
      if (!form.name.trim()) {
        toast.error('Category name is required');
        return;
      }
      if (form.colour && !HEX_RE.test(form.colour)) {
        toast.error('Enter a valid hex colour like #7C3AED');
        return;
      }
      const fields = {
        name: form.name,
        description: form.description,
        home_page: form.home_page,
        href_path: form.href_path,
        colour: form.colour,
        priority: form.priority.trim(),
        ...(image ? { image } : {}),
        ...(bannerImage ? { banner_image: bannerImage } : {}),
        ...(icon ? { icon } : {}),
        ...(backgroundImage ? { background_image: backgroundImage } : {}),
      };

      if (mode === 'edit' && category) {
        updateCategory.mutate(
          { ...fields, id: category.id },
          { onSuccess: () => onDone() }
        );
      } else if (mode === 'addSub' && parentId !== null) {
        addSubCategory.mutate(
          { ...fields, category_id: parentId },
          { onSuccess: () => onDone() }
        );
      } else {
        createCategory.mutate(fields, { onSuccess: () => onDone() });
      }
    }

    const title =
      mode === 'edit'
        ? 'Edit Category'
        : mode === 'addSub'
          ? 'Add Subcategory'
          : 'Add Category';
    const nameLabel = mode === 'addSub' ? 'Subcategory Name' : 'Category Name';

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['75%']}
        title={title}
        footer={
          <CmsButton
            colors={colors}
            label={isSubmitting ? 'Saving…' : 'Save'}
            onPress={handleSubmit}
            loading={isSubmitting}
          />
        }
      >
        <CmsSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Images">
            <View style={st.imagesRow}>
              <ImagePickerTile
                colors={colors}
                label="Image"
                localAsset={image}
                existingUrl={mode === 'edit' ? category?.image : null}
                onPick={() => pickImage(setImage)}
              />
              <ImagePickerTile
                colors={colors}
                label="Banner"
                localAsset={bannerImage}
                existingUrl={mode === 'edit' ? category?.banner_image : null}
                onPick={() => pickImage(setBannerImage)}
              />
              <ImagePickerTile
                colors={colors}
                label="Icon"
                localAsset={icon}
                existingUrl={mode === 'edit' ? category?.icon : null}
                onPick={() => pickImage(setIcon)}
              />
              <ImagePickerTile
                colors={colors}
                label="Background"
                localAsset={backgroundImage}
                existingUrl={mode === 'edit' ? category?.background_image : null}
                onPick={() => pickImage(setBackgroundImage)}
              />
            </View>
          </CmsCard>

          <CmsCard colors={colors}>
            <CmsInput
              colors={colors}
              label={nameLabel}
              placeholder="Enter name here…"
              value={form.name}
              onChangeText={(v) => set('name', v)}
            />
            <CmsInput
              colors={colors}
              label="Description"
              placeholder="Enter description here…"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
            />
            <CmsInput
              colors={colors}
              label="Href Path"
              placeholder="e.g. /categories/grocery"
              value={form.href_path}
              onChangeText={(v) => set('href_path', v)}
            />
            <CmsInput
              colors={colors}
              label="Priority"
              placeholder="e.g. 1 — lower shows first, blank = last"
              value={form.priority}
              onChangeText={(v) => set('priority', v)}
              keyboardType="number-pad"
            />

            <View style={st.colourGroup}>
              <Text style={[st.colourLabel, { color: colors.textSecondary }]}>
                Category Colour
              </Text>
              <View style={st.colourRow}>
                <View
                  style={[
                    st.swatch,
                    {
                      borderColor: colors.border,
                      backgroundColor: HEX_RE.test(form.colour)
                        ? form.colour
                        : 'transparent',
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <CmsInput
                    colors={colors}
                    placeholder="#7C3AED"
                    value={form.colour}
                    onChangeText={(v) => set('colour', v)}
                  />
                </View>
              </View>
            </View>

            <CmsSwitch
              colors={colors}
              label="Show on Home Page"
              value={form.home_page}
              onChange={(v) => set('home_page', v)}
            />
          </CmsCard>
        </CmsSheetScrollView>
      </CmsModal>
    );
  }
);

function ImagePickerTile({
  colors,
  label,
  localAsset,
  existingUrl,
  onPick,
}: {
  colors: CmsThemeColors;
  label: string;
  localAsset: PickedCategoryAsset | null;
  existingUrl?: string | null;
  onPick: () => void;
}) {
  const uri = localAsset?.uri ?? resolveMediaUrl(existingUrl);
  return (
    <Pressable onPress={onPick} style={st.tileWrap}>
      <View
        style={[
          st.tile,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={st.tileImg} contentFit="cover" />
        ) : (
          <Ionicons
            name="image-outline"
            size={18}
            color={colors.textSecondary}
          />
        )}
      </View>
      <Text style={[st.tileLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  imagesRow: { flexDirection: 'row', gap: 12 },
  tileWrap: { alignItems: 'center', gap: 4 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileImg: { width: '100%', height: '100%' },
  tileLabel: cmsType.fieldLabel,
  colourGroup: { gap: 6 },
  colourLabel: cmsType.inputLabel,
  colourRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 1 },
});
