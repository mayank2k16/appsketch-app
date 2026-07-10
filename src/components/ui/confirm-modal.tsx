import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';

import { Button } from './button';
import { Modal } from './modal';
import { Text } from './text';

export type ConfirmModalProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export const ConfirmModal = React.forwardRef<BottomSheetModal, ConfirmModalProps>(
  (
    {
      title,
      description,
      confirmLabel = 'Confirm',
      cancelLabel = 'Cancel',
      destructive = false,
      loading = false,
      onConfirm,
    },
    ref
  ) => {
    const dismiss = React.useCallback(() => {
      (ref as React.RefObject<BottomSheetModal | null>)?.current?.dismiss();
    }, [ref]);

    return (
      <Modal ref={ref} snapPoints={['35%']} title={title}>
        <View className="gap-4 px-4 pb-6">
          {description ? (
            <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </Text>
          ) : null}
          <View className="flex-row gap-3">
            <Button
              label={cancelLabel}
              variant="outline"
              className="flex-1"
              onPress={dismiss}
              disabled={loading}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'destructive' : 'default'}
              className="flex-1"
              onPress={onConfirm}
              loading={loading}
            />
          </View>
        </View>
      </Modal>
    );
  }
);
