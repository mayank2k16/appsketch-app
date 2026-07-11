import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ProductManufacturer } from '@/api/products';
import { useCreateManufacturer } from '@/api/products';

import { CmsButton, CmsInput, CmsSelect } from '../../components';
import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  manufacturers: ProductManufacturer[];
  value: number | '';
  onChange: (value: number | '') => void;
};

export function ManufacturerField({ colors, manufacturers, value, onChange }: Props) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState('');
  const createManufacturer = useCreateManufacturer();

  function handleAdd() {
    if (!name.trim()) return;
    createManufacturer.mutate(name.trim(), {
      onSuccess: (created) => {
        onChange(created.id);
        setName('');
        setShowAdd(false);
      },
    });
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <CmsSelect
            colors={colors}
            label="Manufacturer"
            value={value}
            options={manufacturers.map((m) => ({ label: m.name, value: m.id }))}
            onSelect={(v) => onChange(Number(v))}
            placeholder="Select manufacturer…"
          />
        </View>
        <Pressable onPress={() => setShowAdd((v) => !v)} style={st.addToggle} hitSlop={6}>
          <Ionicons name="add-circle-outline" size={26} color={colors.accent} />
        </Pressable>
      </View>

      {showAdd && (
        <View style={[st.addForm, { borderColor: colors.border }]}>
          <CmsInput
            colors={colors}
            label="Manufacturer Name"
            placeholder="Enter manufacturer name"
            value={name}
            onChangeText={setName}
          />
          <CmsButton
            colors={colors}
            label="Add Manufacturer"
            onPress={handleAdd}
            loading={createManufacturer.isPending}
            style={{ marginTop: 4 }}
          />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  addToggle: { paddingBottom: 10 },
  addForm: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
});
