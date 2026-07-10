/**
 * SearchableSelect
 * Debounced, server-backed picker — same bottom-sheet shape as `Select`, but
 * takes an `onSearch` callback instead of a static options array. Use for
 * any lookup field that needs to query the backend as the user types
 * (customers, products, discount codes, etc.).
 */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { tv } from 'tailwind-variants';

import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CaretDown } from './icons';
import { Input } from './input';
import { Modal, useModal } from './modal';
import { Text } from './text';

const selectTv = tv({
  slots: {
    container: 'mb-4',
    label: 'text-grey-100 mb-1 text-lg dark:text-neutral-100',
    input:
      'border-grey-50 mt-0 flex-row items-center justify-center rounded-xl border-[0.5px] p-3  dark:border-neutral-500 dark:bg-neutral-800',
    inputValue: 'dark:text-neutral-100',
  },
  variants: {
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
        inputValue: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: { error: false, disabled: false },
});

export type SearchOption = { label: string; value: string | number; [key: string]: unknown };

export type SearchableSelectProps = {
  label?: string;
  value?: string | number;
  displayValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  onSearch: (query: string) => Promise<SearchOption[]>;
  onSelect: (option: SearchOption) => void;
  testID?: string;
};

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    label,
    value,
    displayValue,
    placeholder = 'Select...',
    error,
    disabled = false,
    testID,
  } = props;
  const modal = useModal();

  const styles = React.useMemo(
    () => selectTv({ error: Boolean(error), disabled }),
    [error, disabled]
  );

  const textValue = value !== undefined ? (displayValue ?? placeholder) : placeholder;

  return (
    <>
      <View className={styles.container()}>
        {label && (
          <Text testID={testID ? `${testID}-label` : undefined} className={styles.label()}>
            {label}
          </Text>
        )}
        <Pressable
          className={styles.input()}
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          <View className="flex-1">
            <Text className={styles.inputValue()}>{textValue}</Text>
          </View>
          <CaretDown />
        </Pressable>
        {error && (
          <Text testID={`${testID}-error`} className="text-sm text-danger-300 dark:text-danger-600">
            {error}
          </Text>
        )}
      </View>
      <SearchableSelectSheet ref={modal.ref} {...props} onDismiss={modal.dismiss} />
    </>
  );
}

type SheetProps = SearchableSelectProps & { onDismiss: () => void };

const SearchableSelectSheet = React.forwardRef<BottomSheetModal, SheetProps>(
  ({ label, value, onSearch, onSelect, searchPlaceholder = 'Search...', onDismiss, testID }, ref) => {
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<SearchOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const debouncedQuery = useDebouncedValue(query, 350);

    React.useEffect(() => {
      let cancelled = false;
      setLoading(true);
      onSearch(debouncedQuery)
        .then((results) => {
          if (!cancelled) setOptions(results);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [debouncedQuery, onSearch]);

    const choose = React.useCallback(
      (option: SearchOption) => {
        onSelect(option);
        onDismiss();
      },
      [onSelect, onDismiss]
    );

    const renderItem = React.useCallback(
      ({ item }: { item: SearchOption }) => (
        <Pressable
          className="flex-row items-center border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800"
          onPress={() => choose(item)}
        >
          <Text className="flex-1 dark:text-neutral-100">{item.label}</Text>
          {value === item.value && (
            <Text className="text-primary-600 dark:text-primary-400">✓</Text>
          )}
        </Pressable>
      ),
      [choose, value]
    );

    return (
      <Modal ref={ref} snapPoints={['70%']} title={label ?? 'Select'}>
        <View className="px-4 pb-2">
          <Input
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            testID={testID ? `${testID}-search` : undefined}
          />
        </View>
        {loading ? (
          <ActivityIndicator className="mt-4" />
        ) : (
          <BottomSheetFlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="mt-6 text-center text-neutral-400">No results</Text>
            }
          />
        )}
      </Modal>
    );
  }
);
