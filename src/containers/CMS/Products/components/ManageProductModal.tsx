import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ProductListItem } from '@/api/products';
import { useLeafCategories, useManufacturers, useProductInventories, useSaveProduct } from '@/api/products';

import { CmsButton, CmsCard, CmsInput, CmsModal, CmsSelect, CmsSheetScrollView } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { EMPTY_PRODUCT_FORM, formFromProduct, formToSaveInput, MEDIA_PRIORITY_OPTIONS } from '../utils';
import type { ProductFormState } from '../utils';
import { AttributeListEditor } from './AttributeListEditor';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { CustomHtmlField } from './CustomHtmlField';
import { FeedbackListEditor } from './FeedbackListEditor';
import { IngredientsField } from './IngredientsField';
import { ManufacturerField } from './ManufacturerField';
import { MediaGalleryField } from './MediaGalleryField';
import { ReviewHistory } from './ReviewHistory';
import { TagListInput } from './TagListInput';
import { VariantsEditor } from './VariantsEditor';

type Props = {
  colors: CmsThemeColors;
  product: ProductListItem | null;
  onSuccess: () => void;
  /** Renders every field non-interactive and swaps the footer for a plain
   * "Close" button — used by Product Requests' "view full product" action,
   * where editing must go back through the vendor. Implemented as a single
   * `pointerEvents="none"` wrapper around the whole form instead of
   * threading a `disabled` prop through every field subcomponent — vertical
   * scrolling still works since `pointerEvents="none"` only removes the
   * wrapped subtree as a touch *target*, not the ancestor ScrollView's own
   * scroll responder. */
  readOnly?: boolean;
};

export const ManageProductModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, product, onSuccess, readOnly = false }, ref) => {
    const isEdit = Boolean(product);
    const [form, setForm] = React.useState<ProductFormState>(EMPTY_PRODUCT_FORM);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
      setForm(product ? formFromProduct(product) : EMPTY_PRODUCT_FORM);
      setErrors({});
    }, [product]);

    function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
      setForm((prev) => ({ ...prev, [key]: value }));
    }

    const inventoriesQuery = useProductInventories();
    const categoriesQuery = useLeafCategories();
    const manufacturersQuery = useManufacturers();
    const saveProduct = useSaveProduct();

    function validate() {
      const next: Record<string, string> = {};
      if (!form.product_name.trim()) next.product_name = 'Product name is required';
      if (!form.description.trim()) next.description = 'Description is required';
      if (!form.quantity.trim()) next.quantity = 'Quantity is required';
      setErrors(next);
      return Object.keys(next).length === 0;
    }

    function handleSubmit() {
      if (readOnly) return;
      if (!validate()) return;
      saveProduct.mutate(formToSaveInput(form), { onSuccess: () => onSuccess() });
    }

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        snapPoints={['75%']}
        title={readOnly ? 'View Product' : isEdit ? 'Edit Product' : 'Add Product'}
        footer={
          readOnly ? (
            <CmsButton colors={colors} label="Close" variant="ghost" onPress={onSuccess} />
          ) : (
            <CmsButton
              colors={colors}
              label={isEdit ? 'Save Changes' : 'Add Product'}
              onPress={handleSubmit}
              loading={saveProduct.isPending}
            />
          )
        }
      >
        <CmsSheetScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
        >
        <View pointerEvents={readOnly ? 'none' : 'auto'} style={st.formWrap}>
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
              error={errors.product_name}
              required
            />
            <CmsInput
              colors={colors}
              label="Description"
              placeholder="Product description"
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
              error={errors.description}
              required
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
              error={errors.quantity}
              required
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

          {isEdit && product ? (
            <CmsCard colors={colors} title="Review History">
              <ReviewHistory colors={colors} productId={product.id} />
            </CmsCard>
          ) : null}

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

          <CmsCard colors={colors} title="Amenities">
            <AttributeListEditor
              colors={colors}
              items={form.amenities as unknown as Record<string, string>[]}
              onChange={(v) => set('amenities', v as unknown as ProductFormState['amenities'])}
              displayKey="title"
              renderSub={(a) => a.description || undefined}
              addLabel="Add Amenity"
              modalTitle="Amenity"
              emptyLabel="No amenities added yet"
              fields={[
                { key: 'title', label: 'Title', placeholder: 'Enter title', required: true },
                { key: 'description', label: 'Description', placeholder: 'Enter description', type: 'textarea' },
                { key: 'image', label: 'Image', type: 'image' },
              ]}
            />
          </CmsCard>

          <CmsCard colors={colors} title="FAQs">
            <AttributeListEditor
              colors={colors}
              items={form.faqs as unknown as Record<string, string>[]}
              onChange={(v) => set('faqs', v as unknown as ProductFormState['faqs'])}
              displayKey="question"
              renderSub={(f) => f.answer || undefined}
              addLabel="Add FAQ"
              modalTitle="FAQ"
              emptyLabel="No FAQs added yet"
              fields={[
                { key: 'question', label: 'Question', placeholder: 'Enter question', required: true },
                { key: 'answer', label: 'Answer', placeholder: 'Enter answer', type: 'textarea', required: true },
              ]}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Key Benefits">
            <AttributeListEditor
              colors={colors}
              items={form.key_benefits as unknown as Record<string, string>[]}
              onChange={(v) => set('key_benefits', v as unknown as ProductFormState['key_benefits'])}
              renderDisplay={(b) => `${b.icon ? b.icon + '  ' : ''}${b.title || '—'}`}
              renderSub={(b) => b.description || undefined}
              addLabel="Add Key Benefit"
              modalTitle="Key Benefit"
              emptyLabel="No key benefits added yet"
              fields={[
                { key: 'icon', label: 'Icon (emoji)', placeholder: 'e.g. 🫘' },
                { key: 'title', label: 'Title', placeholder: 'Enter title', required: true },
                { key: 'description', label: 'Description', placeholder: 'Enter description', type: 'textarea' },
              ]}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Product Specifications">
            <AttributeListEditor
              colors={colors}
              items={form.specifications as unknown as Record<string, string>[]}
              onChange={(v) => set('specifications', v as unknown as ProductFormState['specifications'])}
              displayKey="label"
              renderSub={(s) => s.value || undefined}
              addLabel="Add Specification"
              modalTitle="Specification"
              emptyLabel="No specifications added yet"
              fields={[
                { key: 'label', label: 'Label', placeholder: 'e.g. Form', required: true },
                { key: 'value', label: 'Value', placeholder: 'e.g. Veg Capsules', required: true },
              ]}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Ingredients">
            <IngredientsField colors={colors} value={form.ingredients} onChange={(v) => set('ingredients', v)} />
          </CmsCard>

          <CmsCard colors={colors} title="Customer Feedback">
            <FeedbackListEditor colors={colors} items={form.feedbacks} onChange={(v) => set('feedbacks', v)} />
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

          <CmsCard colors={colors} title="How to Use">
            <CmsInput
              colors={colors}
              placeholder="Describe how to use this product…"
              value={form.how_to_use}
              onChangeText={(v) => set('how_to_use', v)}
              multiline
              numberOfLines={4}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Benefits (Detailed)">
            <CmsInput
              colors={colors}
              placeholder="Long-form benefits copy shown in the Benefits tab…"
              value={form.benefits_detail}
              onChangeText={(v) => set('benefits_detail', v)}
              multiline
              numberOfLines={4}
            />
          </CmsCard>

          <CmsCard colors={colors} title="Custom HTML/CSS Content">
            <CustomHtmlField colors={colors} value={form.custom_html} onChange={(v) => set('custom_html', v)} />
          </CmsCard>
        </View>
        </CmsSheetScrollView>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 16 },
  formWrap: { gap: 12 },
});
