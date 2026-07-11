import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import type { ProductListItem } from '@/api/products';
import { useLeafCategories, useManufacturers, useProductInventories, useSaveProduct } from '@/api/products';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { EMPTY_PRODUCT_FORM, formFromProduct, formToSaveInput, MEDIA_PRIORITY_OPTIONS } from '../utils';
import type { ProductFormState } from '../utils';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { ManufacturerField } from './ManufacturerField';
import { MediaGalleryField } from './MediaGalleryField';
import { TagListInput } from './TagListInput';
import { VariantsEditor } from './VariantsEditor';

type Props = {
  colors: CmsThemeColors;
  product: ProductListItem | null;
  onSuccess: () => void;
};

export const ManageProductModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, product, onSuccess }, ref) => {
    const isEdit = Boolean(product);
    const [form, setForm] = React.useState<ProductFormState>(EMPTY_PRODUCT_FORM);

    React.useEffect(() => {
      setForm(product ? formFromProduct(product) : EMPTY_PRODUCT_FORM);
    }, [product]);

    function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    const inventoriesQuery = useProductInventories();
    const categoriesQuery = useLeafCategories();
    const manufacturersQuery = useManufacturers();
    const saveProduct = useSaveProduct();

    function handleSubmit() {
      saveProduct.mutate(formToSaveInput(form), { onSuccess: () => onSuccess() });
    }

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['92%']} title={isEdit ? 'Edit Product' : 'Add Product'}>
        <BottomSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <CmsCard colors={colors} title="Media">
            <MediaGalleryField
              colors={colors}
              label="Primary Image"
              kind="image"
              value={form.photo ? [form.photo] : []}
              onChange={(v) => set('photo', v[0] ?? '')}
            />
            <MediaGalleryField
              colors={colors}
              label="Product Images"
              kind="image"
              multiple
              value={form.images}
              onChange={(v) => set('images', v)}
            />
            <MediaGalleryField
              colors={colors}
              label="Product Videos"
              kind="video"
              multiple
              value={form.videos}
              onChange={(v) => set('videos', v)}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Basic Details">
            <CmsSelect
              colors={colors}
              label="Inventory"
              value={form.selected_inventory}
              options={(inventoriesQuery.data ?? []).map((i) => ({ label: i.name, value: i.id }))}
              onSelect={(v) => set('selected_inventory', Number(v))}
              placeholder="Select inventory…"
            />
            <CmsInput
              colors={colors}
              label="Product Name"
              placeholder="Product name"
              value={form.product_name}
              onChangeText={(v) => set('product_name', v)}
            />
            <CmsInput
              colors={colors}
              label="Description"
              placeholder="Product description"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
            />
            <CmsInput
              colors={colors}
              label="Catalogue Number"
              placeholder="Catalogue number"
              value={form.catalogue_number}
              onChangeText={(v) => set('catalogue_number', v)}
            />
            <CmsInput
              colors={colors}
              label="Previous Catalogue Number"
              placeholder="Previous catalogue number"
              value={form.previous_catalogue_number}
              onChangeText={(v) => set('previous_catalogue_number', v)}
            />
            <CmsInput
              colors={colors}
              label="Current Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.price}
              onChangeText={(v) => set('price', v)}
            />
            <CmsInput
              colors={colors}
              label="Market Price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.market_price}
              onChangeText={(v) => set('market_price', v)}
            />
            <CmsInput
              colors={colors}
              label="Quantity"
              placeholder="Sellable quantity"
              keyboardType="number-pad"
              value={form.quantity}
              onChangeText={(v) => set('quantity', v)}
            />
            <CmsSelect
              colors={colors}
              label="Media Display Priority"
              value={form.media_display_priority}
              options={MEDIA_PRIORITY_OPTIONS}
              onSelect={(v) => set('media_display_priority', v as ProductFormState['media_display_priority'])}
              placeholder="Select priority…"
            />
            <CategoryMultiSelect
              colors={colors}
              label="Category"
              categories={categoriesQuery.data ?? []}
              value={form.categories}
              onChange={(v) => set('categories', v)}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Additional Details">
            <ManufacturerField
              colors={colors}
              manufacturers={manufacturersQuery.data ?? []}
              value={form.manufacturer}
              onChange={(v) => set('manufacturer', v)}
            />
            <TagListInput
              colors={colors}
              label="Alternate Names"
              placeholder="Enter any alternate name"
              values={form.alternate_names}
              onChange={(v) => set('alternate_names', v)}
            />
            <TagListInput
              colors={colors}
              label="Features"
              placeholder="Enter any feature"
              values={form.features}
              onChange={(v) => set('features', v)}
            />
            <TagListInput
              colors={colors}
              label="Tags"
              placeholder="Enter any tag"
              values={form.tags}
              onChange={(v) => set('tags', v)}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Product Variants">
            <VariantsEditor
              colors={colors}
              value={form.variants}
              onChange={(v) => set('variants', v)}
              defaults={{
                primaryImage: form.photo,
                images: form.images,
                videos: form.videos,
                price: form.price,
                marketPrice: form.market_price,
                quantity: form.quantity,
              }}
            />
          </CmsCard>

          <CmsButton
            colors={colors}
            label={isEdit ? 'Save Changes' : 'Add Product'}
            onPress={handleSubmit}
            loading={saveProduct.isPending}
            style={st.submitBtn}
          />
        </BottomSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  submitBtn: { marginTop: 4 },
});
