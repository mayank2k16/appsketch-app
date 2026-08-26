import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CmsButton, CmsInput, CmsModal } from '../../components';
import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  productCount: number;
  loading: boolean;
  onConfirm: (notes: string) => void;
  /** Bumped by the caller each time the sheet is (re-)opened — clears any
   * previously typed reason. See `ApproveRequestModal`'s `resetKey`. */
  resetKey: number;
};

/** Ported from Vite's `ProductsRequest/RejectModal` — collects a required
 * free-text reason that's sent back to the vendor. */
export const RejectRequestModal = React.forwardRef<BottomSheetModal, Props>(
  ({ colors, productCount, loading, onConfirm, resetKey }, ref) => {
    const [notes, setNotes] = React.useState('');
    const trimmed = notes.trim();

    React.useEffect(() => {
      setNotes('');
    }, [resetKey]);

    return (
      <CmsModal
        ref={ref}
        colors={colors}
        title={`Reject Product${productCount > 1 ? 's' : ''}`}
        snapPoints={['46%']}
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
              label="Reject"
              variant="danger"
              onPress={() => trimmed && onConfirm(trimmed)}
              loading={loading}
              disabled={!trimmed}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View style={st.body}>
          <Text style={[st.message, { color: colors.textSecondary }]}>
            {productCount > 1
              ? `This reason will be sent to the vendor for all ${productCount} selected products.`
              : 'This reason will be sent to the vendor so they know what to fix.'}
          </Text>
          <CmsInput
            colors={colors}
            label="Reason for rejection"
            placeholder="Reason for rejection (required)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
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
