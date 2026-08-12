import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import type { CmsThemeColors } from '../theme';
import { cmsType } from '../theme/cms-typography';
import { CmsInput } from './CmsInput';
import { CmsModal } from './CmsModal';

export type CmsSearchOption = {
  label: string;
  value: string | number;
  [key: string]: unknown;
};

type Props = {
  colors: CmsThemeColors;
  label: string;
  value?: string | number;
  displayValue?: string;
  onSearch: (query: string) => Promise<CmsSearchOption[]>;
  onSelect: (option: CmsSearchOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
};

/** Search-as-you-type picker for CMS forms — same trigger/theming as
 * `CmsSelect`, but opens a `CmsModal` with a debounced search box instead of
 * a static option list. Use for server-backed lookups (challan, customer…).
 * Built on `CmsModal` (rather than `@/components/ui`'s generic `Modal`, as
 * the app-wide `SearchableSelect` does) so it inherits CMS field styling and
 * `stackBehavior: 'push'` — without `push` the sheet defaults to gorhom's
 * `'switch'`, which minimizes the parent `CmsModal` first and was making
 * this picker fail to appear when opened from inside an already-open form. */
export function CmsSearchableSelect({
  colors,
  label,
  value,
  displayValue,
  onSearch,
  onSelect,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  error,
  disabled = false,
}: Props) {
  const modal = useModal();
  const displayLabel = value !== undefined ? displayValue : undefined;

  return (
    <View style={st.group}>
      <Text style={[st.label, { color: colors.textSecondary }]}>{label}</Text>
      <Pressable
        onPress={modal.present}
        disabled={disabled}
        style={[
          st.field,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.danger : colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            st.value,
            { color: displayLabel ? colors.textPrimary : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {displayLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      {error ? (
        <Text style={[st.error, { color: colors.danger }]}>{error}</Text>
      ) : null}

      <CmsSearchableSelectSheet
        ref={modal.ref}
        colors={colors}
        label={label}
        value={value}
        onSearch={onSearch}
        onSelect={onSelect}
        searchPlaceholder={searchPlaceholder}
        onDismiss={modal.dismiss}
      />
    </View>
  );
}

type SheetProps = {
  colors: CmsThemeColors;
  label: string;
  value?: string | number;
  onSearch: (query: string) => Promise<CmsSearchOption[]>;
  onSelect: (option: CmsSearchOption) => void;
  searchPlaceholder: string;
  onDismiss: () => void;
};

const CmsSearchableSelectSheet = React.forwardRef<
  React.ComponentRef<typeof CmsModal>,
  SheetProps
>(
  (
    { colors, label, value, onSearch, onSelect, searchPlaceholder, onDismiss },
    ref
  ) => {
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<CmsSearchOption[]>([]);
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
      (option: CmsSearchOption) => {
        onSelect(option);
        setQuery('');
        onDismiss();
      },
      [onSelect, onDismiss]
    );

    return (
      <CmsModal ref={ref} colors={colors} snapPoints={['70%']} title={label}>
        <View style={st.searchBox}>
          <CmsInput
            colors={colors}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
          />
        </View>
        {loading ? (
          <ActivityIndicator style={st.loading} color={colors.accent} />
        ) : (
          <BottomSheetFlatList
            data={options}
            keyExtractor={(item) => `cms-search-select-${item.value}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => choose(item)}
                style={[st.option, { borderColor: colors.border }]}
              >
                <Text style={[st.optionLabel, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
                {item.value === value ? (
                  <Ionicons name="checkmark" size={18} color={colors.accent} />
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[st.empty, { color: colors.textSecondary }]}>
                No results
              </Text>
            }
          />
        )}
      </CmsModal>
    );
  }
);

const st = StyleSheet.create({
  group: { gap: 6 },
  label: cmsType.inputLabel,
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  value: cmsType.inputValue,
  error: cmsType.inputError,
  searchBox: { paddingHorizontal: 16, paddingBottom: 8 },
  loading: { marginTop: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: cmsType.inputValue,
  empty: { textAlign: 'center', marginTop: 24, ...cmsType.inputValue },
});
