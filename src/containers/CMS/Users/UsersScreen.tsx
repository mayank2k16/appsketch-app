import * as React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppUserProfile, StaffUser, UsersListParams } from '@/api/users';
import {
  useAppUsers,
  useDeleteAppUser,
  useDeleteStaffUser,
  useStaffUsers,
  useUsersMeta,
} from '@/api/users';
import { ConfirmModal, useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { useCmsTheme } from '../theme';
import { UserListCard } from './components/UserListCard';
import { ManageUserModal } from './components/ManageUserModal';
import type { UserSegment } from './utils';
import { STATUS_OPTS } from './utils';

const PAGE_SIZE = 10;

type Row = AppUserProfile | StaffUser;

function buildParams(role: string, search: string, status: 'active' | 'inactive' | 'all'): UsersListParams {
  const p: UsersListParams = {};
  if (role) p.role = role;
  if (search) p.search = search;
  if (status === 'inactive') p.is_active = 'false';
  else if (status === 'active') p.is_active = 'true';
  else if (status === 'all') p.include_inactive = 1;
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UsersScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [segment, setSegment] = React.useState<UserSegment>('app');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'active' | 'inactive' | 'all'>('active');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pageIdx, setPageIdx] = React.useState(0);

  React.useEffect(() => {
    setPageIdx(0);
  }, [segment, roleFilter, statusFilter, debouncedSearch]);

  const baseParams = React.useMemo(
    () => buildParams(roleFilter, debouncedSearch, statusFilter),
    [roleFilter, debouncedSearch, statusFilter]
  );

  const metaQuery = useUsersMeta();
  const roleLabelMap = React.useMemo(() => {
    const m: Record<string, string> = {};
    (metaQuery.data?.roles ?? []).forEach((r) => {
      m[r.value] = r.label;
    });
    return m;
  }, [metaQuery.data]);

  const appParams = React.useMemo(
    () => ({ ...baseParams, limit: PAGE_SIZE, offset: pageIdx * PAGE_SIZE }),
    [baseParams, pageIdx]
  );
  const appUsersQuery = useAppUsers(appParams, segment === 'app');
  const staffUsersQuery = useStaffUsers(baseParams, segment === 'staff');

  const { rows, total, loading } = React.useMemo(() => {
    if (segment === 'app') {
      const data = appUsersQuery.data;
      if (!data) return { rows: [] as Row[], total: 0, loading: appUsersQuery.isLoading };
      if (Array.isArray(data)) {
        return {
          rows: data.slice(pageIdx * PAGE_SIZE, pageIdx * PAGE_SIZE + PAGE_SIZE),
          total: data.length,
          loading: appUsersQuery.isLoading,
        };
      }
      return { rows: data.results, total: data.count ?? data.results.length, loading: appUsersQuery.isLoading };
    }
    const data = staffUsersQuery.data;
    const arr = !data ? [] : Array.isArray(data) ? data : data.results;
    return {
      rows: arr.slice(pageIdx * PAGE_SIZE, pageIdx * PAGE_SIZE + PAGE_SIZE),
      total: arr.length,
      loading: staffUsersQuery.isLoading,
    };
  }, [segment, appUsersQuery.data, appUsersQuery.isLoading, staffUsersQuery.data, staffUsersQuery.isLoading, pageIdx]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const deleteAppUser = useDeleteAppUser();
  const deleteStaffUser = useDeleteStaffUser();

  const [manageTarget, setManageTarget] = React.useState<{ user: Row | null; key: number }>({ user: null, key: 0 });
  const [deletingUser, setDeletingUser] = React.useState<Row | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();

  function openCreate() {
    setManageTarget((prev) => ({ user: null, key: prev.key + 1 }));
    manageModal.present();
  }
  function openEdit(user: Row) {
    setManageTarget((prev) => ({ user, key: prev.key + 1 }));
    manageModal.present();
  }
  function openDelete(user: Row) {
    setDeletingUser(user);
    confirmModal.present();
  }
  function confirmDelete() {
    if (!deletingUser) return;
    const mutation = segment === 'app' ? deleteAppUser : deleteStaffUser;
    mutation.mutate(deletingUser.id, {
      onSuccess: () => {
        confirmModal.dismiss();
        setDeletingUser(null);
      },
    });
  }

  const isApp = segment === 'app';
  const deleteLabel = isApp ? 'Deactivate' : 'Delete';

  const renderItem = React.useCallback(
    ({ item }: { item: Row }) => (
      <UserListCard
        user={item}
        colors={colors}
        roleLabel={item.role ? roleLabelMap[item.role] || item.role : '—'}
        deleteLabel={deleteLabel}
        onEdit={() => openEdit(item)}
        onDelete={() => openDelete(item)}
      />
    ),
    [colors, roleLabelMap, deleteLabel]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={st.segmentRow}>
        <Pressable
          onPress={() => setSegment('app')}
          style={[st.segBtn, { borderColor: colors.border }, isApp && { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Text style={[st.segLabel, { color: isApp ? colors.accentText : colors.textPrimary }]}>App Users</Text>
        </Pressable>
        <Pressable
          onPress={() => setSegment('staff')}
          style={[st.segBtn, { borderColor: colors.border }, !isApp && { backgroundColor: colors.accent, borderColor: colors.accent }]}
        >
          <Text style={[st.segLabel, { color: !isApp ? colors.accentText : colors.textPrimary }]}>Staff</Text>
        </Pressable>
        <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={16} color={colors.accentText} />
          <Text style={[st.addBtnText, { color: colors.accentText }]}>Add</Text>
        </Pressable>
      </View>

      <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name / phone / email…"
          placeholderTextColor={colors.textSecondary}
          style={[st.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={st.filterScrollContent}>
        <FilterChip colors={colors} label="All roles" active={!roleFilter} onPress={() => setRoleFilter('')} />
        {(metaQuery.data?.roles ?? []).map((r) => (
          <FilterChip key={r.value} colors={colors} label={r.label} active={roleFilter === r.value} onPress={() => setRoleFilter(r.value)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={st.filterScrollContent}>
        {STATUS_OPTS.map((s) => (
          <FilterChip key={s.value} colors={colors} label={s.label} active={statusFilter === s.value} onPress={() => setStatusFilter(s.value)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={st.center}>
          <Text style={{ color: colors.textSecondary }}>No users found.</Text>
        </View>
      ) : (
        <FlatList data={rows} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }} />
      )}

      <View style={st.pagerRow}>
        <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>
          {total} {total === 1 ? 'user' : 'users'} · page {pageIdx + 1} of {totalPages}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            disabled={pageIdx === 0}
            onPress={() => setPageIdx((i) => Math.max(0, i - 1))}
            style={[st.pagerBtn, { borderColor: colors.border, opacity: pageIdx === 0 ? 0.5 : 1 }]}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' }}>Prev</Text>
          </Pressable>
          <Pressable
            disabled={pageIdx + 1 >= totalPages}
            onPress={() => setPageIdx((i) => i + 1)}
            style={[st.pagerBtn, { borderColor: colors.border, opacity: pageIdx + 1 >= totalPages ? 0.5 : 1 }]}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 12.5, fontWeight: '600' }}>Next</Text>
          </Pressable>
        </View>
      </View>

      <ManageUserModal
        ref={manageModal.ref}
        colors={colors}
        segment={segment}
        user={manageTarget.user}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <ConfirmModal
        ref={confirmModal.ref}
        title={`${isApp ? 'Deactivate' : 'Delete'} this user?`}
        description={deletingUser ? `${deletingUser.name || deletingUser.phone_number} will be ${isApp ? 'deactivated' : 'permanently deleted'}.` : undefined}
        confirmLabel={deleteLabel}
        destructive
        loading={isApp ? deleteAppUser.isPending : deleteStaffUser.isPending}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function FilterChip({ colors, label, active, onPress }: { colors: ReturnType<typeof useCmsTheme>['colors']; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.chip, { borderColor: colors.border }, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      <Text style={{ color: active ? colors.accentText : colors.textSecondary, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  segmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  segLabel: { fontSize: 13, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, marginLeft: 'auto' },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  filterScroll: { flexGrow: 0, marginTop: 10 },
  filterScrollContent: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pagerBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
});
