import * as React from 'react';
import { View } from 'react-native';

import type { IngredientsBlock } from '@/api/products';

import { CmsInput } from '../../components';
import type { CmsThemeColors } from '../../theme';
import { AttributeListEditor } from './AttributeListEditor';

type Props = {
  colors: CmsThemeColors;
  value: IngredientsBlock;
  onChange: (value: IngredientsBlock) => void;
};

export function IngredientsField({ colors, value, onChange }: Props) {
  function set<K extends keyof IngredientsBlock>(key: K, v: IngredientsBlock[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <View style={{ gap: 12 }}>
      <CmsInput
        colors={colors}
        label="Ingredients Heading"
        placeholder="e.g. Probiotic Blend (30 Billion CFU per Capsule)"
        value={value.heading ?? ''}
        onChangeText={(v) => set('heading', v)}
      />

      <AttributeListEditor
        colors={colors}
        items={value.table as unknown as Record<string, string>[]}
        onChange={(table) => set('table', table as unknown as IngredientsBlock['table'])}
        addLabel="Add Ingredient Row"
        modalTitle="Ingredient"
        emptyLabel="No ingredients added yet"
        displayKey="ingredient"
        renderSub={(r) => [r.strength, r.benefit].filter(Boolean).join('  ·  ') || undefined}
        fields={[
          { key: 'ingredient', label: 'Ingredient', placeholder: 'e.g. Lactobacillus Plantarum', required: true },
          { key: 'strength', label: 'Strength', placeholder: 'e.g. 2.5 Billion CFU' },
          { key: 'benefit', label: 'Benefit', placeholder: 'e.g. Gut health & digestion' },
        ]}
      />

      <CmsInput
        colors={colors}
        label="Prebiotic Support"
        placeholder="e.g. Inulin (100 mg) & Fructooligosaccharides (100 mg)…"
        value={value.prebiotic_support ?? ''}
        onChangeText={(v) => set('prebiotic_support', v)}
        multiline
        numberOfLines={2}
      />
      <CmsInput
        colors={colors}
        label="Other Ingredients"
        placeholder="e.g. Vegetable capsule shell (HPMC), Magnesium stearate, Silica."
        value={value.other_ingredients ?? ''}
        onChangeText={(v) => set('other_ingredients', v)}
        multiline
        numberOfLines={2}
      />
    </View>
  );
}
