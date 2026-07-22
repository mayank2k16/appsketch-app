import { Ionicons } from '@expo/vector-icons';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Collection, CollectionApi, CollectionRecord } from '@/api/coder';
import { getCollections, setApiActive } from '@/api/coder';
import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';
import { RecordDrawer } from './RecordDrawer';

function CellPreview({
  value,
  colors,
}: {
  value: unknown;
  colors: ReturnType<typeof useAppTheme>;
}) {
  if (value === null || value === undefined || value === '')
    return <Text style={{ color: colors.codeEditorTextMuted }}>—</Text>;
  if (typeof value === 'boolean')
    return (
      <Text
        style={{
          color: value
            ? colors.codeEditorConnectedDot
            : colors.codeEditorTextMuted,
        }}
      >
        {String(value)}
      </Text>
    );
  if (typeof value === 'object')
    return (
      <Text style={{ color: colors.textSub, fontSize: 11.5 }} numberOfLines={1}>
        {JSON.stringify(value)}
      </Text>
    );
  const s = String(value);
  return (
    <Text style={{ color: colors.text, fontSize: 12.5 }} numberOfLines={1}>
      {s.length > 60 ? `${s.slice(0, 60)}…` : s}
    </Text>
  );
}

function ApiCard({
  api,
  colors,
  onToggle,
  toggling,
}: {
  api: CollectionApi;
  colors: ReturnType<typeof useAppTheme>;
  onToggle: () => void;
  toggling: boolean;
}) {
  const methodColor =
    api.method === 'GET'
      ? colors.collectionsMethodGet
      : api.method === 'POST'
        ? colors.collectionsMethodPost
        : colors.collectionsMethodOther;
  return (
    <View
      style={[
        st.apiCard,
        {
          borderColor: colors.codeEditorBorder,
          backgroundColor: colors.codeEditorSurface,
          opacity: api.is_active ? 1 : 0.55,
        },
      ]}
    >
      <Text
        style={[st.apiMethod, { color: methodColor, borderColor: methodColor }]}
      >
        {api.method}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}
          numberOfLines={1}
        >
          {api.name}
        </Text>
        <Text
          style={{ color: colors.codeEditorTextMuted, fontSize: 11 }}
          numberOfLines={1}
        >
          {api.endpoint || `/api/builder/dyn/${api.slug}/`}
        </Text>
      </View>
      {toggling ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Switch
          value={!!api.is_active}
          onValueChange={onToggle}
          trackColor={{ true: colors.accent }}
        />
      )}
    </View>
  );
}

export function CollectionsScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { params } = useCodeEditor();
  const tenantId = params.tenantId;

  const [tab, setTab] = React.useState<'db' | 'apis'>('db');
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [sqlApis, setSqlApis] = React.useState<CollectionApi[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<CollectionRecord[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [rowsLoading, setRowsLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [toggling, setToggling] = React.useState<string | number | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<
    CollectionRecord | null | undefined
  >(undefined);

  const drawerRef = React.useRef<BottomSheetModal>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCollections(tenantId);
      setCollections(res.collections ?? []);
      setSqlApis(res.sql_apis ?? []);
      setActive((cur) => {
        const slugs = (res.collections ?? []).map((c) => c.slug);
        return cur && slugs.includes(cur) ? cur : (slugs[0] ?? null);
      });
    } catch {
      // leave state as-is — the empty/error state below covers this
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const loadRows = React.useCallback(
    async (slug: string) => {
      setRowsLoading(true);
      try {
        const res = await getCollections(tenantId, {
          collection: slug,
          limit: 200,
        });
        const c = (res.collections ?? []).find((x) => x.slug === slug);
        setRows(c?.records ?? []);
      } catch {
        setRows([]);
      } finally {
        setRowsLoading(false);
      }
    },
    [tenantId]
  );

  React.useEffect(() => {
    if (active) void loadRows(active);
  }, [active, loadRows]);

  const activeCol = collections.find((c) => c.slug === active) ?? null;
  const allApis = React.useMemo(() => {
    const collApis = collections.flatMap((c) =>
      (c.apis ?? []).map((a) => ({ ...a, collection: c.name }))
    );
    return [...collApis, ...sqlApis];
  }, [collections, sqlApis]);

  const filteredRows = React.useMemo(() => {
    if (!rows) return rows;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      JSON.stringify(r.data ?? {})
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  function openDrawer(record: CollectionRecord | null) {
    setEditingRecord(record);
    drawerRef.current?.present();
  }
  function handleSaved() {
    drawerRef.current?.dismiss();
    if (active) void loadRows(active);
    void load();
  }
  function handleDeleted() {
    drawerRef.current?.dismiss();
    if (active) void loadRows(active);
    void load();
  }

  async function toggleApi(api: CollectionApi) {
    setToggling(api.id);
    try {
      await setApiActive(tenantId, api.id, !api.is_active);
      await load();
    } finally {
      setToggling(null);
    }
  }

  if (loading && collections.length === 0) {
    return (
      <View style={[st.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="small" color={t.accent} />
        <Text style={{ color: t.textSub, marginTop: 8 }}>
          Loading your database…
        </Text>
      </View>
    );
  }

  const isEmpty = collections.length === 0 && sqlApis.length === 0;
  if (isEmpty) {
    return (
      <View
        style={[st.center, { backgroundColor: t.bg, paddingHorizontal: 32 }]}
      >
        <Ionicons name="server-outline" size={32} color={t.textMuted} />
        <Text
          style={{
            color: t.text,
            fontWeight: '700',
            fontSize: 15,
            marginTop: 12,
            marginBottom: 6,
          }}
        >
          Your database is empty
        </Text>
        <Text
          style={{
            color: t.textSub,
            fontSize: 12.5,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          As the agent creates collections and APIs — bookings, orders,
          submissions — they&rsquo;ll show up here as a live, editable
          database.
        </Text>
        <TouchableOpacity
          onPress={load}
          style={[st.refreshBtn, { backgroundColor: t.accent }]}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <View style={[st.tabRow, { borderColor: t.codeEditorBorder }]}>
        <TouchableOpacity
          onPress={() => setTab('db')}
          style={[
            st.tabBtn,
            tab === 'db' && { backgroundColor: t.collectionsChipActiveBg },
          ]}
        >
          <Text
            style={{
              color: tab === 'db' ? '#FFFFFF' : t.text,
              fontSize: 12.5,
              fontWeight: '700',
            }}
          >
            Database
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('apis')}
          style={[
            st.tabBtn,
            tab === 'apis' && { backgroundColor: t.collectionsChipActiveBg },
          ]}
        >
          <Text
            style={{
              color: tab === 'apis' ? '#FFFFFF' : t.text,
              fontSize: 12.5,
              fontWeight: '700',
            }}
          >
            APIs
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={load} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={t.text} />
        </TouchableOpacity>
      </View>

      {tab === 'apis' ? (
        <FlashList
          data={allApis}
          keyExtractor={(a) => `${a.source ?? 'collection'}-${a.id}`}
          renderItem={({ item }) => (
            <ApiCard
              api={item}
              colors={t}
              onToggle={() => toggleApi(item)}
              toggling={toggling === item.id}
            />
          )}
          estimatedItemSize={60}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={
            <Text
              style={{ color: t.textSub, textAlign: 'center', marginTop: 24 }}
            >
              No APIs yet
            </Text>
          }
        />
      ) : (
        <>
          <View style={st.chipStripWrap}>
            <FlashList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={collections}
              keyExtractor={(c) => c.slug}
              estimatedItemSize={100}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item }) => {
                const isActive = item.slug === active;
                return (
                  <TouchableOpacity
                    onPress={() => setActive(item.slug)}
                    style={[
                      st.chip,
                      {
                        backgroundColor: isActive
                          ? t.collectionsChipActiveBg
                          : t.collectionsChipBg,
                        borderColor: t.codeEditorBorder,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isActive ? '#FFFFFF' : t.text,
                        fontSize: 12.5,
                        fontWeight: '700',
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        color: isActive
                          ? 'rgba(255,255,255,0.7)'
                          : t.codeEditorTextMuted,
                        fontSize: 10.5,
                      }}
                    >
                      {item.record_count}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {activeCol ? (
            <>
              <View style={st.searchRow}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search records…"
                  placeholderTextColor={t.codeEditorTextMuted}
                  style={[
                    st.searchInput,
                    {
                      color: t.text,
                      borderColor: t.codeEditorBorder,
                      backgroundColor: t.codeEditorSurface,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => openDrawer(null)}
                  style={[st.newBtn, { backgroundColor: t.accent }]}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {rowsLoading ? (
                <View style={st.center}>
                  <ActivityIndicator size="small" color={t.accent} />
                </View>
              ) : (
                <FlashList
                  data={filteredRows ?? []}
                  keyExtractor={(r) => String(r.id)}
                  estimatedItemSize={64}
                  contentContainerStyle={{ padding: 12 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => openDrawer(item)}
                      style={[
                        st.recordRow,
                        {
                          borderColor: t.codeEditorBorder,
                          backgroundColor: t.codeEditorSurface,
                        },
                      ]}
                    >
                      {(activeCol.fields ?? []).slice(0, 3).map((f) => (
                        <View key={f.name} style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: t.codeEditorTextMuted,
                              fontSize: 9.5,
                              marginBottom: 2,
                            }}
                            numberOfLines={1}
                          >
                            {f.name}
                          </Text>
                          <CellPreview value={item.data?.[f.name]} colors={t} />
                        </View>
                      ))}
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={t.codeEditorTextMuted}
                      />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{
                        color: t.textSub,
                        textAlign: 'center',
                        marginTop: 24,
                      }}
                    >
                      {search
                        ? 'No records match your search.'
                        : 'No records yet — add one with "+".'}
                    </Text>
                  }
                />
              )}
            </>
          ) : (
            <View style={st.center}>
              <Text style={{ color: t.textSub }}>Select a collection</Text>
            </View>
          )}
        </>
      )}

      <RecordDrawer
        ref={drawerRef}
        tenantId={tenantId}
        collection={activeCol}
        record={editingRecord ?? null}
        colors={t}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: {
    height: 38,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  chipStripWrap: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 78,
    marginRight: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  apiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  apiMethod: {
    fontSize: 10,
    fontWeight: '800',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
