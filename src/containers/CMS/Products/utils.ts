import type {
  AmenityItem,
  FaqItem,
  FeedbackItem,
  IngredientsBlock,
  KeyBenefitItem,
  ProductListItem,
  SaveProductInput,
  SpecificationItem,
} from '@/api/products';

export function inr(v: number | string | undefined | null): string {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function primaryImageOf(product: ProductListItem): string | undefined {
  return product.photo || product.images?.[0];
}

export const VARIANT_TYPE_OPTIONS = [
  { label: 'Size', value: 'Size' },
  { label: 'Color', value: 'Color' },
  { label: 'Shape', value: 'Shape' },
  { label: 'Material', value: 'Material' },
  { label: 'Weight', value: 'Weight' },
];

export const MEDIA_PRIORITY_OPTIONS = [
  { label: 'Images', value: 'IMAGES' },
  { label: 'Videos', value: 'VIDEOS' },
];

export type ProductFormState = {
  id?: number;
  selected_inventory: number | '';
  product_name: string;
  description: string;
  catalogue_number: string;
  previous_catalogue_number: string;
  price: string;
  market_price: string;
  quantity: string;
  media_display_priority: 'IMAGES' | 'VIDEOS' | '';
  categories: number[];
  photo: string;
  images: string[];
  videos: string[];
  alternate_names: string[];
  manufacturer: number | '';
  features: string[];
  tags: string[];
  variants: SaveProductInput['variants'];
  faqs: FaqItem[];
  amenities: AmenityItem[];
  key_benefits: KeyBenefitItem[];
  specifications: SpecificationItem[];
  ingredients: IngredientsBlock;
  feedbacks: FeedbackItem[];
  custom_html: string;
  how_to_use: string;
  benefits_detail: string;
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  selected_inventory: '',
  product_name: '',
  description: '',
  catalogue_number: '',
  previous_catalogue_number: '',
  price: '',
  market_price: '',
  quantity: '',
  media_display_priority: '',
  categories: [],
  photo: '',
  images: [],
  videos: [],
  alternate_names: [],
  manufacturer: '',
  features: [],
  tags: [],
  variants: [],
  faqs: [],
  amenities: [],
  key_benefits: [],
  specifications: [],
  ingredients: { heading: '', table: [], prebiotic_support: '', other_ingredients: '' },
  feedbacks: [],
  custom_html: '',
  how_to_use: '',
  benefits_detail: '',
};

export function formFromProduct(product: ProductListItem): ProductFormState {
  return {
    id: product.id,
    selected_inventory: '',
    product_name: product.product_name ?? '',
    description: product.description ?? '',
    catalogue_number: product.catalogue_number ?? '',
    previous_catalogue_number: product.previous_catalogue_number ?? '',
    price: product.sellable_inventory?.price != null ? String(product.sellable_inventory.price) : '',
    market_price:
      product.sellable_inventory?.market_price != null
        ? String(product.sellable_inventory.market_price)
        : '',
    quantity:
      product.sellable_inventory?.quantity_remaining != null
        ? String(product.sellable_inventory.quantity_remaining)
        : '',
    media_display_priority: product.media_display_priority ?? '',
    categories: product.categories?.map((c) => c.id) ?? [],
    photo: product.photo ?? '',
    images: product.images ?? [],
    videos: product.videos ?? [],
    alternate_names: product.alternate_names ?? [],
    manufacturer: product.manufacturer?.id ?? '',
    features: product.features ?? [],
    tags: product.tags ?? [],
    variants: product.variants ?? [],
    faqs: product.faqs ?? [],
    amenities: product.amenities ?? [],
    key_benefits: product.attributes?.key_benefits ?? [],
    specifications: product.attributes?.specifications ?? [],
    ingredients: product.attributes?.ingredients ?? { heading: '', table: [], prebiotic_support: '', other_ingredients: '' },
    feedbacks: product.feedbacks ?? [],
    custom_html: product.attributes?.custom_html ?? '',
    how_to_use: product.attributes?.how_to_use ?? '',
    benefits_detail: product.attributes?.benefits_detail ?? '',
  };
}

export function formToSaveInput(form: ProductFormState): SaveProductInput {
  return {
    id: form.id,
    product_name: form.product_name.trim(),
    description: form.description.trim(),
    catalogue_number: form.catalogue_number.trim(),
    previous_catalogue_number: form.previous_catalogue_number.trim(),
    alternate_names: form.alternate_names.filter((v) => v.trim()),
    manufacturer: form.manufacturer,
    images: form.images,
    photo: form.photo,
    videos: form.videos,
    media_display_priority: form.media_display_priority,
    price: form.price,
    market_price: form.market_price,
    quantity: form.quantity,
    categories: form.categories,
    features: form.features.filter((v) => v.trim()),
    tags: form.tags.filter((v) => v.trim()),
    variants: form.variants,
    faqs: form.faqs,
    amenities: form.amenities,
    key_benefits: form.key_benefits,
    specifications: form.specifications,
    ingredients: form.ingredients,
    feedbacks: form.feedbacks,
    custom_html: form.custom_html,
    how_to_use: form.how_to_use,
    benefits_detail: form.benefits_detail,
  };
}
