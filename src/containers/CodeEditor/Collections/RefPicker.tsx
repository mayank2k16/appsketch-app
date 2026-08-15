import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CollectionOption } from '@/api/coder';
import { getCollectionOptions } from '@/api/coder';
import type { AppColors } from '@/lib/theme';

/**
 * The searchable picker behind a `reference` (foreign-key) field — the mobile
 * port of Vite's `RefPicker.jsx`.
 *
 * A plain list can't back this: the target collection holds up to MAX_RECORDS
 * rows, so the search runs server-side against
 * `GET /collections/<target>/options/?q=&display=&ids=`. `ids` pins the value
 * already on the record so its label survives a search that would have filtered
 * it out — without that, opening the picker on an existing record shows a blank
 * where the current selection should be.
 *
 * Closed it is a button showing the LABEL, never the raw id. Typing a foreign
 * key from memory is not a CMS.
 */
export function RefPicker({
  tenantId,
  target,
  display,
  value,
  colors,
  disabled,
  onChange,
}: {
  tenantId: string;
  target?: string;
  display?: string;
  value: string | number | '';
  colors: AppColors;
  disabled?: boolean;
  onChange: (v: string | number | '') => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [opts, setOpts] = React.useState<CollectionOption[]>([]);
  const [label, setLabel] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Resolve the label for the value we already hold, so a closed picker reads
  // "Anna Roy" and not "#41".
  React.useEffect(() => {
    let dead = false;
    if (!value || !target) {
      setLabel('');
      return undefined;
    }
    getCollectionOptions(tenantId, target, {
      ids: String(value),
      display,
      limit: 1,
    })
      .then(({ options }) => {
        if (dead) return;
        const hit = options.find((o) => String(o.id) === String(value));
        setLabel(hit?.label || `#${value}`);
      })
      .catch(() => {
        if (!dead) setLabel(`#${value}`);
      });
    return () => {
      dead = true;
    };
  }, [tenantId, value, target, display]);

  // Debounced server-side search while the sheet is open.
  React.useEffect(() => {
    if (!open || !target) return undefined;
    let dead = false;
    setLoading(true);
    const timer = setTimeout(() => {
      getCollectionOptions(tenantId, target, {
        q,
        display,
        ids: value ? String(value) : '',
        limit: 25,
      })
        .then(({ options }) => {
          if (!dead) setOpts(options);
        })
        .catch(() => {
          if (!dead) setOpts([]);
        })
        .finally(() => {
          if (!dead) setLoading(false);
        });
    }, 180);
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [open, q, tenantId, target, display, value]);

  function pick(o: CollectionOption | null) {
    onChange(o ? o.id : '');
    setLabel(o ? o.label : '');
    setOpen(false);
    setQ('');
  }

  if (!target) {
    return (
      <Text style={{ color: colors.codeEditorDanger, fontSize: 12.5 }}>
        no target collection on this field
      </Text>
    );
  }

  return (
    <>
      <View style={st.row}>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={[
            st.trigger,
            {
              borderColor: colors.codeEditorBorder,
              backgroundColor: colors.codeEditorTabBg,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 13.5,
              color: value ? colors.text : colors.codeEditorTextMuted,
            }}
          >
            {value ? label || `#${value}` : `Choose from ${target}…`}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.codeEditorTextMuted}
          />
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity onPress={() => pick(null)} style={st.clearBtn}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.codeEditorTextMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={st.backdrop}>
          <View
            style={[
              st.sheet,
              {
                backgroundColor: colors.codeEditorSurface,
                borderColor: colors.codeEditorBorder,
              },
            ]}
          >
            <View style={[st.head, { borderColor: colors.codeEditorBorder }]}>
              <Text style={[st.headTitle, { color: colors.text }]}>
                {target}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSub} />
              </TouchableOpacity>
            </View>

            <View style={st.searchWrap}>
              <Ionicons
                name="search"
                size={15}
                color={colors.codeEditorTextMuted}
              />
              <TextInput
                value={q}
                onChangeText={setQ}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={`Search ${target}…`}
                placeholderTextColor={colors.codeEditorTextMuted}
                style={[
                  st.search,
                  {
                    color: colors.text,
                    borderColor: colors.codeEditorBorder,
                    backgroundColor: colors.codeEditorTabBg,
                  },
                ]}
              />
            </View>

            <FlatList
              data={opts}
              keyExtractor={(o) => String(o.id)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={st.note}>
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.codeEditorTextMuted}
                    />
                  ) : (
                    <Text style={{ color: colors.textSub, fontSize: 13 }}>
                      No matches
                    </Text>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const isSel = String(item.id) === String(value);
                return (
                  <TouchableOpacity
                    onPress={() => pick(item)}
                    style={[
                      st.opt,
                      { borderColor: colors.codeEditorBorder },
                      isSel && { backgroundColor: colors.accentSoft },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: isSel
                          ? colors.codeEditorAccentText
                          : colors.text,
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.codeEditorTextMuted,
                      }}
                    >
                      #{item.id}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {value ? (
              <TouchableOpacity
                onPress={() => pick(null)}
                style={[st.clearAll, { borderColor: colors.codeEditorBorder }]}
              >
                <Text style={{ color: colors.textSub, fontWeight: '600' }}>
                  Clear selection
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  clearBtn: { padding: 4 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  sheet: {
    height: '72%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headTitle: { fontSize: 15, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  note: { padding: 24, alignItems: 'center' },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clearAll: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
