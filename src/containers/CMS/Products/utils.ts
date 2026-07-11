import type { ProductListItem, SaveProductInput } from '@/api/products';

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
  };
}
