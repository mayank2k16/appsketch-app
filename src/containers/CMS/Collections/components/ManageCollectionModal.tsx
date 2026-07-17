import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CollectionItem, CollectionProduct, PickedCollectionAsset } from '@/api/collections';
import { useCreateCollection, useUpdateCollection } from '@/api/collections';
import { useModal } from '@/components/ui';
import { toast } from '@/lib/toast';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSwitch } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { ProductPickerSheet } from './ProductPickerSheet';

type FormState = {
  title: string;
  description: string;
  priority: string;
  active: boolean;
};

function getDefaultForm(): FormState {
  return { title: '', description: '', priority: '', active: true };
}

type Props = {
  colors: CmsThemeColors;
  collection: CollectionItem | null;
  openKey: number;
  onDone: () => void;
};

export const ManageCollectionModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, collection, openKey, onDone }, ref) => {
    const isEdit = collection !== null;
    const [form, setForm] = React.useState<FormState>(getDefaultForm());
    const [image, setImage] = React.useState<PickedCollectionAsset | null>(null);
    const [selectedProducts, setSelectedProducts] = React.useState<CollectionProduct[]>([]);

    const createCollection = useCreateCollection();
    const updateCollection = useUpdateCollection();
    const isSubmitting = createCollection.isPending || updateCollection.isPending;

    const pickerModal = useModal();

    React.useEffect(() => {
      setImage(null);
      if (isEdit && collection) {
        setForm({
          title: collection.title || '',
          description: collection.description || '',
          priority: collection.priority !== undefined && collection.priority !== null ? String(collection.priority) : '',
          active: collection.active,
        });
        setSelectedProducts(collection.products ?? []);
      } else {
        setForm(getDefaultForm());
        setSelectedProducts([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openKey, isEdit, collection]);

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
      setImage({ uri: asset.uri, name: asset.fileName ?? `collection-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' });
    }

    function removeProduct(id: number) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
    }

    function handleSubmit() {
      if (!form.title.trim()) {
        toast.error('Title is required');
        return;
      }
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        active: form.active,
        product_ids: selectedProducts.map((p) => p.id),
        ...(image ? { image } : {}),
      };
      if (isEdit && collection) {
        updateCollection.mutate({ id: collection.id, payload }, { onSuccess: () => onDone() });
      } else {
        createCollection.mutate(payload, { onSuccess: () => onDone() });
      }
    }

    const imageUri = image?.uri ?? (isEdit ? collection?.image : null) ?? undefined;

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['90%']} title={isEdit ? 'Edit Collection' : 'Add Collection'}>
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
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Collection Image</Text>
                </>
              )}
            </Pressable>

            <CmsInput colors={colors} label="Title" placeholder="e.g. Top Seller, Today's Special…" value={form.title} onChangeText={(v) => set('title', v)} />
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
              label="Priority"
              placeholder="Lower shows first"
              keyboardType="number-pad"
              value={form.priority}
              onChangeText={(v) => set('priority', v)}
            />
            <CmsSwitch colors={colors} label="Active" value={form.active} onChange={(v) => set('active', v)} />
          </CmsCard>

          <CmsCard colors={colors} title={`Products (${selectedProducts.length})`}>
            <CmsButton colors={colors} label="Link Products" onPress={pickerModal.present} />
            {selectedProducts.map((p) => (
              <View key={p.id} style={[st.productRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                  {p.product_name}
                </Text>
                <Pressable onPress={() => removeProduct(p.id)} hitSlop={6}>
                  <Text style={{ color: colors.danger, fontSize: 12.5, fontWeight: '700' }}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </CmsCard>

          <CmsButton colors={colors} label={isSubmitting ? 'Saving…' : 'Save'} onPress={handleSubmit} loading={isSubmitting} />
        </BottomSheetScrollView>

        <ProductPickerSheet
          ref={pickerModal.ref}
          colors={colors}
          alreadySelectedIds={selectedProducts.map((p) => p.id)}
          onDone={(picked) => {
            setSelectedProducts((prev) => {
              const merged = [...prev];
              for (const p of picked) {
                if (!merged.some((sp) => sp.id === p.id)) merged.push({ id: p.id, product_name: p.product_name });
              }
              return merged;
            });
            pickerModal.dismiss();
          }}
        />
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
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
