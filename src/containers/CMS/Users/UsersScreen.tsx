import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppUserProfile, StaffUser, UsersListParams } from '@/api/users';
import {
  flattenAppUsersPages,
  useAppUsers,
  useDeleteAppUser,
  useDeleteStaffUser,
  useStaffUsers,
  useUsersMeta,
  USERS_PAGE_SIZE,
} from '@/api/users';
import { useModal } from '@/components/ui';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { CmsConfirmModal } from '../components';
import { useCmsTheme } from '../theme';
import { UserListCard } from './components/UserListCard';
import { FilterModal } from './components/FilterModal';
import { ManageUserModal } from './components/ManageUserModal';
import { UsersSkeleton } from './components/UsersSkeleton';
import type { UserSegment } from './utils';

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

const SEGMENTS: { key: UserSegment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'app', label: 'App Users', icon: 'people-outline' },
  { key: 'staff', label: 'Staff', icon: 'briefcase-outline' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UsersScreen({ onMenuPress: _onMenuPress }: { onMenuPress: () => void }) {
  const { colors } = useCmsTheme();
  const [segment, setSegment] = React.useState<UserSegment>('app');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'active' | 'inactive' | 'all'>('all');
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  // Staff has no confirmed server-side pagination (its endpoint always
  // returns the full list) — infinite scroll there just reveals more of the
  // already-fetched array, growing by one page per `onEndReached`.
  const [staffVisibleCount, setStaffVisibleCount] = React.useState(USERS_PAGE_SIZE);

  React.useEffect(() => {
    setStaffVisibleCount(USERS_PAGE_SIZE);
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

  const appUsersQuery = useAppUsers(baseParams, segment === 'app');
  const staffUsersQuery = useStaffUsers(baseParams, segment === 'staff');

  const { rows, total, loading, isFetchingMore } = React.useMemo(() => {
    if (segment === 'app') {
      const appRows = flattenAppUsersPages(appUsersQuery.data?.pages);
      return {
        rows: appRows as Row[],
        total: appRows.length,
        loading: appUsersQuery.isLoading,
        isFetchingMore: appUsersQuery.isFetchingNextPage,
      };
    }
    const data = staffUsersQuery.data;
    const arr = !data ? [] : Array.isArray(data) ? data : data.results;
    return {
      rows: arr.slice(0, staffVisibleCount) as Row[],
      total: arr.length,
      loading: staffUsersQuery.isLoading,
      isFetchingMore: false,
    };
  }, [
    segment,
    appUsersQuery.data,
    appUsersQuery.isLoading,
    appUsersQuery.isFetchingNextPage,
    staffUsersQuery.data,
    staffUsersQuery.isLoading,
    staffVisibleCount,
  ]);

  function loadMore() {
    if (segment === 'app') {
      if (appUsersQuery.hasNextPage && !appUsersQuery.isFetchingNextPage) appUsersQuery.fetchNextPage();
    } else {
      setStaffVisibleCount((prev) => Math.min(prev + USERS_PAGE_SIZE, total));
    }
  }

  const deleteAppUser = useDeleteAppUser();
  const deleteStaffUser = useDeleteStaffUser();

  const [manageTarget, setManageTarget] = React.useState<{ user: Row | null; key: number }>({ user: null, key: 0 });
  const [deletingUser, setDeletingUser] = React.useState<Row | null>(null);
  const manageModal = useModal();
  const confirmModal = useModal();
  const filterModal = useModal();

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
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={[st.sidebar, { backgroundColor: colors.sidebarBg, borderColor: colors.border }]}>
        {SEGMENTS.map((s) => {
          const active = s.key === segment;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSegment(s.key)}
              style={[st.tab, active && { backgroundColor: colors.sidebarActiveBg }]}
            >
              <Ionicons name={s.icon} size={20} color={active ? colors.accent : colors.sidebarText} />
              <Text style={[st.tabLabel, { color: active ? colors.accent : colors.sidebarText }]} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        <View style={st.searchRow}>
          <View style={[st.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1, marginHorizontal: 0 }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name / phone / email…"
              placeholderTextColor={colors.textSecondary}
              style={[st.searchInput, { color: colors.textPrimary }]}
            />
          </View>
          <Pressable onPress={filterModal.present} style={[st.iconBtn, { borderColor: colors.border }]}>
            <Ionicons name="filter-outline" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={st.headerRow}>
          <Pressable onPress={openCreate} style={[st.addBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="add" size={16} color={colors.accentText} />
            <Text style={[st.addBtnText, { color: colors.accentText }]}>Add {segment === 'app' ? 'App User' : 'Staff User'}</Text>
          </Pressable>
        </View>

        <Text style={[st.countText, { color: colors.textSecondary }]}>
          {total} {total === 1 ? 'user' : 'users'}
        </Text>

        {loading ? (
          <UsersSkeleton colors={colors} />
        ) : rows.length === 0 ? (
          <View style={st.center}>
            <Text style={{ color: colors.textSecondary, width: '100%', textAlign: 'center' }}>No users found.</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListFooterComponent={
              isFetchingMore ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      <FilterModal
        ref={filterModal.ref}
        colors={colors}
        roles={metaQuery.data?.roles ?? []}
        filters={{ role: roleFilter, status: statusFilter }}
        onApply={(f) => {
          setRoleFilter(f.role);
          setStatusFilter(f.status);
          filterModal.dismiss();
        }}
      />
      <ManageUserModal
        ref={manageModal.ref}
        colors={colors}
        segment={segment}
        user={manageTarget.user}
        openKey={manageTarget.key}
        onDone={() => manageModal.dismiss()}
      />
      <CmsConfirmModal
        ref={confirmModal.ref}
        colors={colors}
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

const st = StyleSheet.create({
  sidebar: {
    width: 70,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 0,
  },
  tabLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 6,
    marginTop: 0,
  },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, marginTop: 15 },
  iconBtn: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12.5, paddingHorizontal: 16, paddingTop: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
