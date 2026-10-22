import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import { type CatColors, EDGE_W } from './theme';

/**
 * The first row: back, the search field (filters the current category as
 * you type, with a clear button), and "browse all categories".
 */

const SIZE = 40;

function IconButton({
  c,
  icon,
  label,
  onPress,
}: {
  c: CatColors;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={[s.icon, { backgroundColor: c.surface, borderColor: c.edge }]}
    >
      <Ionicons name={icon} size={19} color={c.ink} />
    </PressableScale>
  );
}

type SearchProps = {
  c: CatColors;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
};

const SearchField = React.memo(function SearchField({
  c,
  query,
  onQuery,
  placeholder,
}: SearchProps) {
  const ref = React.useRef<TextInput>(null);
  return (
    <View
      style={[s.search, { backgroundColor: c.surface, borderColor: c.edge }]}
    >
      <Ionicons name="search" size={16} color={c.muted} />
      <TextInput
        ref={ref}
        value={query}
        onChangeText={onQuery}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        selectionColor={c.ink}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        keyboardAppearance={c.dark ? 'dark' : 'light'}
        accessibilityLabel="Search templates"
        style={[s.input, { color: c.ink }]}
      />
      {query ? (
        <PressableScale
          onPress={() => {
            onQuery('');
            ref.current?.focus();
          }}
          hitSlop={10}
          accessibilityLabel="Clear search"
          style={[s.clear, { backgroundColor: c.inset }]}
        >
          <Ionicons name="close" size={13} color={c.ink} />
        </PressableScale>
      ) : null}
    </View>
  );
});

type Props = SearchProps & { onBack: () => void; onBrowse: () => void };

export const TopBar = React.memo(function TopBar(props: Props) {
  const { c, onBack, onBrowse } = props;
  return (
    <View style={s.row}>
      <IconButton c={c} icon="chevron-back" label="Back" onPress={onBack} />
      <SearchField
        c={c}
        query={props.query}
        onQuery={props.onQuery}
        placeholder={props.placeholder}
      />
      <IconButton
        c={c}
        icon="grid-outline"
        label="Browse all categories"
        onPress={onBrowse}
      />
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  icon: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: EDGE_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flex: 1,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: EDGE_W,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 6,
    gap: 7,
  },
  input: {
    flex: 1,
    height: SIZE - 4,
    paddingVertical: 0,
    fontFamily: F.sans500,
    fontSize: 14.5,
    letterSpacing: -0.1,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
