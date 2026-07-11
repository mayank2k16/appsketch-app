import * as React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MediaDisplayPriority, ProductVariant } from '@/api/products';

import { CmsInput, CmsSelect } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { cmsType } from '../../theme/cms-typography';
import { MEDIA_PRIORITY_OPTIONS, VARIANT_TYPE_OPTIONS } from '../utils';
import { MediaGalleryField } from './MediaGalleryField';

type OptionDraft = { name: string; values: string[]; inputValue: string };

type BaseDefaults = {
  primaryImage: string;
  images: string[];
  videos: string[];
  price: string;
  marketPrice: string;
  quantity: string;
};

type Props = {
  colors: CmsThemeColors;
  value: ProductVariant[];
  onChange: (value: ProductVariant[]) => void;
  defaults: BaseDefaults;
};

function variationSignature(options: { type_name: string; option_value: string }[]): string {
  return options
    .map((o) => `${o.type_name}:${o.option_value}`)
    .sort()
    .join('|');
}

/** Option/value builder + generated-combination list — ports Vite's
 * `AddProductVariations` + `ManageCombinations` + `EditMedia` into one
 * component. Combination generation writes `variation_options` directly in
 * the `{type_name, option_value}` shape the backend actually returns
 * (Vite's generator instead writes an inconsistent `variant_options`/
 * `{variant_type,variant_value}` shape that its own read-back code doesn't
 * match — not replicated here). */
export function VariantsEditor({ colors, value, onChange, defaults }: Props) {
  const [options, setOptions] = React.useState<OptionDraft[]>(() => {
    if (value.length === 0) return [];
    const map = new Map<string, Set<string>>();
    for (const variant of value) {
      for (const opt of variant.variation_options ?? []) {
        if (!opt.type_name || !opt.option_value) continue;
        if (!map.has(opt.type_name)) map.set(opt.type_name, new Set());
        map.get(opt.type_name)!.add(opt.option_value);
      }
    }
    return Array.from(map.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
      inputValue: '',
    }));
  });

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const optionsSignature = JSON.stringify(options.map((o) => [o.name, o.values]));

  React.useEffect(() => {
    const valid = options.filter((o) => o.name && o.values.length > 0);
    if (valid.length === 0) {
      if (options.length === 0 && value.length > 0) onChange([]);
      return;
    }

    type Combo = { name: string; value: string };
    const perOption: Combo[][] = valid.map((o) => o.values.map((v) => ({ name: o.name, value: v })));
    const combinations = perOption.reduce<Combo[][]>(
      (acc, group) => acc.flatMap((combo) => group.map((v) => [...combo, v])),
      [[]]
    );

    const nextVariants: ProductVariant[] = combinations.map((combo) => {
      const variationOptions = combo.map((c) => ({ type_name: c.name, option_value: c.value }));
      const signature = variationSignature(variationOptions);
      const existing = value.find((v) => variationSignature(v.variation_options ?? []) === signature);
      if (existing) return existing;

      return {
        variation_options: variationOptions,
        variant_type: combo.map((c) => c.name).join(' / '),
        variant_value: combo.map((c) => c.value).join(' / '),
        primary_image: defaults.primaryImage,
        images: defaults.images,
        videos: defaults.videos,
        media_display_priority: 'IMAGES',
        price: defaults.price,
        market_price: defaults.marketPrice,
        quantity: defaults.quantity,
      };
    });

    onChange(nextVariants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsSignature]);

  function addOption() {
    const used = new Set(options.map((o) => o.name));
    const nextType = VARIANT_TYPE_OPTIONS.find((t) => !used.has(t.value))?.value ?? 'Size';
    setOptions((prev) => [...prev, { name: nextType, values: [], inputValue: '' }]);
  }
  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }
  function setOptionName(index: number, name: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name } : o)));
  }
  function setOptionInput(index: number, inputValue: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, inputValue } : o)));
  }
  function commitOptionValue(index: number) {
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) return o;
        const v = o.inputValue.trim();
        if (!v || o.values.includes(v)) return { ...o, inputValue: '' };
        return { ...o, values: [...o.values, v], inputValue: '' };
      })
    );
  }
  function removeOptionValue(optIndex: number, valIndex: number) {
    setOptions((prev) =>
      prev.map((o, i) => (i === optIndex ? { ...o, values: o.values.filter((_, vi) => vi !== valIndex) } : o))
    );
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }
  function removeVariant(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setExpandedIndex(null);
  }

  return (
    <View style={{ gap: 12 }}>
      {options.map((opt, i) => (
        <View key={i} style={[st.optionCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <View style={{ flex: 1 }}>
            <CmsSelect
              colors={colors}
              label={`Option Type ${i + 1}`}
              value={opt.name}
              options={VARIANT_TYPE_OPTIONS}
              onSelect={(v) => setOptionName(i, String(v))}
            />
            <View style={st.tagWrap}>
              {opt.values.map((v, vi) => (
                <View key={vi} style={[st.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[st.tagText, { color: colors.textPrimary }]}>{v}</Text>
                  <Pressable onPress={() => removeOptionValue(i, vi)} hitSlop={6}>
                    <Ionicons name="close" size={12} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
              <TextInput
                value={opt.inputValue}
                onChangeText={(t) => setOptionInput(i, t)}
                onSubmitEditing={() => commitOptionValue(i)}
                placeholder="Add value…"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                style={[st.tagInput, { color: colors.textPrimary }]}
              />
            </View>
          </View>
          <Pressable onPress={() => removeOption(i)} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={addOption}
        style={[st.addOptionBtn, { borderColor: colors.accent }]}
      >
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={[st.addOptionLabel, { color: colors.accent }]}>Add Option (Size, Color…)</Text>
      </Pressable>

      {value.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>
            {value.length} combination{value.length === 1 ? '' : 's'} generated
          </Text>
          {value.map((variant, i) => {
            const expanded = expandedIndex === i;
            return (
              <View key={i} style={[st.variantRow, { borderColor: colors.border }]}>
                <Pressable
                  onPress={() => setExpandedIndex(expanded ? null : i)}
                  style={st.variantHeader}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[st.variantName, { color: colors.textPrimary }]}>
                      {variant.variant_value || 'Default'}
                    </Text>
                    <Text style={[st.variantMeta, { color: colors.textSecondary }]}>
                      {variant.variant_type || 'Default'} · ₹{variant.price || '—'} · Qty {variant.quantity || '—'}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeVariant(i)} hitSlop={8} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>

                {expanded && (
                  <View style={st.variantBody}>
                    <MediaGalleryField
                      colors={colors}
                      label="Primary Image"
                      kind="image"
                      value={variant.primary_image ? [variant.primary_image] : []}
                      onChange={(v) => updateVariant(i, { primary_image: v[0] ?? '' })}
                    />
                    <MediaGalleryField
                      colors={colors}
                      label="Variant Images"
                      kind="image"
                      multiple
                      value={variant.images ?? []}
                      onChange={(v) => updateVariant(i, { images: v })}
                    />
                    <MediaGalleryField
                      colors={colors}
                      label="Variant Videos"
                      kind="video"
                      multiple
                      value={variant.videos ?? []}
                      onChange={(v) => updateVariant(i, { videos: v })}
                    />
                    <View style={st.fieldGrid}>
                      <View style={st.fieldHalf}>
                        <CmsInput
                          colors={colors}
                          label="Price"
                          keyboardType="decimal-pad"
                          value={String(variant.price ?? '')}
                          onChangeText={(t) => updateVariant(i, { price: t })}
                        />
                      </View>
                      <View style={st.fieldHalf}>
                        <CmsInput
                          colors={colors}
                          label="Market Price"
                          keyboardType="decimal-pad"
                          value={String(variant.market_price ?? '')}
                          onChangeText={(t) => updateVariant(i, { market_price: t })}
                        />
                      </View>
                      <View style={st.fieldHalf}>
                        <CmsInput
                          colors={colors}
                          label="Quantity"
                          keyboardType="number-pad"
                          value={String(variant.quantity ?? '')}
                          onChangeText={(t) => updateVariant(i, { quantity: t })}
                        />
                      </View>
                      <View style={st.fieldHalf}>
                        <CmsSelect
                          colors={colors}
                          label="Media Priority"
                          value={variant.media_display_priority}
                          options={MEDIA_PRIORITY_OPTIONS}
                          onSelect={(v) => updateVariant(i, { media_display_priority: v as MediaDisplayPriority })}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  optionCard: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  tagInput: { minWidth: 100, fontSize: 12.5, paddingVertical: 4 },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
  },
  addOptionLabel: { fontSize: 12.5, fontWeight: '700' },
  sectionLabel: cmsType.fieldLabel,
  variantRow: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  variantHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  variantName: { fontSize: 13.5, fontWeight: '700' },
  variantMeta: { fontSize: 11.5, marginTop: 2 },
  variantBody: { padding: 12, paddingTop: 0, gap: 12 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldHalf: { width: '47%' },
});
