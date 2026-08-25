import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useProductInventories } from '@/api/products';

import { CmsButton, CmsModal, CmsSelect } from '../../components';
import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  productCount: number;
  loading: boolean;
  onConfirm: (inventoryId: number) => void;
  /** Bumped by the caller each time the sheet is (re-)opened — resets the
   * picked inventory back to the default, same idea as `CategoriesScreen`'s
   * `manageTarget.key`/`ManageCategoryModal`'s `openKey`. */
  resetKey: number;
};

/** Ported from Vite's `ProductsRequest/ApproveModal` — picks which of the
 * marketplace's own inventories approved stock should be added to. Defaults
 * to the first inventory once loaded, same as the web version. */
export const ApproveRequestModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, productCount, loading, onConfirm, resetKey }, ref) => {
    const inventoriesQuery = useProductInventories();
    const inventories = inventoriesQuery.data ?? [];
    const [inventoryId, setInventoryId] = React.useState<number | ''>('');

    React.useEffect(() => {
      setInventoryId('');
    }, [resetKey]);

    React.useEffect(() => {
      if (inventoryId === '' && inventories.length) setInventoryId(inventories[0].id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inventories.length, resetKey]);

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        title={`Approve Product${productCount > 1 ? 's' : ''}`}
        snapPoints={['48%']}
        footer={
          <View style={st.footerRow}>
            <CmsButton
              colors={colors}
              label="Cancel"
              variant="ghost"
              onPress={() => (ref as React.RefObject<BottomSheetModal | null>)?.current?.dismiss()}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <CmsButton
              colors={colors}
              label="Approve"
              onPress={() => inventoryId !== '' && onConfirm(inventoryId)}
              loading={loading}
              disabled={inventoryId === ''}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View style={st.body}>
          <Text style={[st.message, { color: colors.textSecondary }]}>
            Choose which of your inventories the approved stock should be added to.
          </Text>
          <CmsSelect
            colors={colors}
            label="Add to Inventory"
            placeholder="Select inventory…"
            value={inventoryId}
            options={inventories.map((i) => ({ label: i.name, value: i.id }))}
            onSelect={(v) => setInventoryId(Number(v))}
            required
          />
        </View>
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  message: { fontSize: 13, lineHeight: 19 },
  footerRow: { flexDirection: 'row', gap: 10 },
});
