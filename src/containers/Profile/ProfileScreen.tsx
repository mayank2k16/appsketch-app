import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { updateOwnProfile, useSubscriptionPlans } from '@/api';
import { accountClient } from '@/api/common/client';
import { PlanBadge } from '@/components/ui/PlanBadge';
import { getUserSubscription, signOut, updateUserFields, useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';
import { useAppTheme, type AppColors } from '@/lib/theme';

type FieldKey = 'name' | 'email' | 'phone';

function readUserField(user: Record<string, unknown> | null, key: FieldKey): string {
  if (!user) return '';
  if (key === 'phone') {
    return String(user.phone_number ?? user.phone ?? '');
  }
  return String(user[key] ?? '');
}

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const status = useAuth.use.status();
  const user = useAuth.use.user();
  const isGuest = status === 'guest';
  const subscription = getUserSubscription(user);
  const { data: plans } = useSubscriptionPlans();
  const currentPlan = plans?.find(
    (p) => p.tier?.toLowerCase() === subscription?.plan?.tier?.toLowerCase()
  );

  const original = React.useMemo(
    () => ({
      name: readUserField(user, 'name') || (isGuest ? 'Guest User' : 'Your Name'),
      email: readUserField(user, 'email') || (isGuest ? '' : 'you@example.com'),
      phone: readUserField(user, 'phone') || '',
    }),
    [user, isGuest]
  );

  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(original);

  React.useEffect(() => {
    if (!editing) setForm(original);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original]);

  function startEdit() {
    setForm(original);
    setEditing(true);
  }

  function cancelEdit() {
    setForm(original);
    setEditing(false);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.warning('Please enter your name');
      return;
    }
    // `id` isn't confirmed on the login/verify-otp user payload (AuthUser is
    // deliberately opaque — see @/api/auth/types) but every other user record
    // on this backend (AppUserProfile, StaffUser) uses `id`, so this is the
    // best-guess field name pending a live check.
    const id = user?.id as number | undefined;
    if (!id) {
      toast.error('Something went wrong', 'Please sign in again and retry.');
      return;
    }

    const fields = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone_number: form.phone.trim(),
    };

    setSaving(true);
    try {
      await updateOwnProfile({ id, ...fields });
      updateUserFields(fields);
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Could not update profile', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    signOut();
    router.replace('/login');
  }

  const [deletingAccount, setDeletingAccount] = React.useState(false);

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              // Self-service — acts on the authenticated caller (this app's
              // users are account.TenantUser, not account.Profile, so this
              // is a distinct endpoint from the Profile-based one other
              // AppSketch storefront apps use).
              await accountClient.post('account/tenant-users/delete_account/');
              signOut();
              router.replace('/login');
            } catch {
              toast.error('Could not delete account', 'Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  }

  const initial = (original.name || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />

      <View style={[st.header, { paddingTop: insets.top + 10, borderColor: t.border, backgroundColor: t.bg }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={st.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={t.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: t.text }]}>My Account</Text>
        {!isGuest && !editing ? (
          <TouchableOpacity onPress={startEdit} hitSlop={10} style={st.headerBtn}>
            <Ionicons name="create-outline" size={20} color={t.accent} />
          </TouchableOpacity>
        ) : (
          <View style={st.headerBtn} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar ── */}
          <View style={st.avatarSection}>
            <View style={[st.avatar, { backgroundColor: t.accentSoft, borderColor: `${t.accent}40` }]}>
              <Text style={[st.avatarInitial, { color: t.accent }]}>{initial}</Text>
            </View>
            <Text style={[st.avatarName, { color: t.text }]}>{original.name}</Text>
            {!!original.email && <Text style={[st.avatarSub, { color: t.textSub }]}>{original.email}</Text>}
          </View>

          {isGuest ? (
            <View style={st.section}>
              <GlassCard t={t} contentStyle={st.sectionCard}>
                <Text style={[st.sectionHeading, { color: t.text }]}>You&rsquo;re browsing as a guest</Text>
                <Text style={[st.bodyText, { color: t.textSub, marginTop: 8 }]}>
                  Sign in to see and manage your account details.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace('/login')}
                  activeOpacity={0.85}
                  style={[st.primaryBtn, { backgroundColor: t.accent, marginTop: 16 }]}
                >
                  <Text style={st.primaryBtnText}>Sign In / Register</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          ) : (
            <>
              {/* ── Account details ── */}
              <View style={st.section}>
                <GlassCard t={t} contentStyle={st.sectionCard}>
                  <Text style={[st.sectionHeading, { color: t.text }]}>Account Details</Text>

                  <ProfileField
                    t={t}
                    label="Full Name"
                    value={editing ? form.name : original.name}
                    editing={editing}
                    onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                    icon="person-outline"
                  />
                  <ProfileField
                    t={t}
                    label="Email"
                    value={editing ? form.email : original.email || '—'}
                    editing={editing}
                    onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                    icon="mail-outline"
                    keyboardType="email-address"
                  />
                  <ProfileField
                    t={t}
                    label="Phone"
                    value={editing ? form.phone : original.phone || '—'}
                    editing={editing}
                    onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                    icon="call-outline"
                    keyboardType="phone-pad"
                    isLast
                  />
                </GlassCard>
              </View>

              {editing && (
                <View style={[st.section, st.editActions]}>
                  <TouchableOpacity
                    onPress={cancelEdit}
                    activeOpacity={0.8}
                    style={[st.secondaryBtn, { borderColor: t.border }]}
                  >
                    <Text style={[st.secondaryBtnText, { color: t.textSub }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={saving}
                    style={[st.primaryBtn, { backgroundColor: t.accent, flex: 1, opacity: saving ? 0.6 : 1 }]}
                  >
                    <Text style={st.primaryBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!editing && (
                <View style={st.section}>
                  <GlassCard t={t} contentStyle={st.sectionCard}>
                    <View style={st.planHeaderRow}>
                      <Text style={[st.sectionHeading, { color: t.text }]}>Your Plan</Text>
                      {subscription?.active && <PlanBadge tier={subscription.plan.tier} />}
                    </View>

                    <Text style={[st.planName, { color: t.text }]}>
                      {subscription?.active ? subscription.plan.display_name : 'Free'}
                    </Text>
                    {!!currentPlan?.description && (
                      <Text style={[st.bodyText, { color: t.textSub, marginTop: 4 }]}>
                        {currentPlan.description}
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={() => router.push('/pricing')}
                      activeOpacity={0.85}
                      style={[st.primaryBtn, { backgroundColor: t.accent, marginTop: 16 }]}
                    >
                      <Text style={st.primaryBtnText}>
                        {'Upgrade Plan'}
                      </Text>
                    </TouchableOpacity>
                  </GlassCard>
                </View>
              )}

              {!editing && (
                <View style={st.section}>
                  <GlassCard t={t} contentStyle={st.sectionCard}>
                    <MenuRow
                      t={t}
                      icon="help-buoy-outline"
                      label="Help & Support"
                      onPress={() => router.push('/support')}
                      isLast
                    />
                  </GlassCard>
                </View>
              )}

              {!editing && (
                <View style={[st.section, { gap: 10 }]}>
                  <TouchableOpacity
                    onPress={handleLogout}
                    activeOpacity={0.8}
                    style={[st.secondaryBtn, { borderColor: '#EF444440' }]}
                  >
                    <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                    <Text style={[st.secondaryBtnText, { color: '#EF4444', marginLeft: 6 }]}>Log Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    activeOpacity={0.8}
                    disabled={deletingAccount}
                    style={[st.secondaryBtn, { borderColor: '#EF444440', opacity: deletingAccount ? 0.6 : 1 }]}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    )}
                    <Text style={[st.secondaryBtnText, { color: '#EF4444', marginLeft: 6 }]}>
                      {deletingAccount ? 'Deleting…' : 'Delete Account'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Shared building blocks ─────────────────────────────────────────────────
function GlassCard({
  t,
  contentStyle,
  children,
}: {
  t: AppColors;
  contentStyle?: object;
  children: React.ReactNode;
}) {
  return (
    <View style={[st.glassCard, { backgroundColor: t.agentTabBg, borderColor: t.agentTabBorder }]}>
      <View style={[st.glassContent, contentStyle]}>{children}</View>
    </View>
  );
}

function ProfileField({
  t,
  label,
  value,
  editing,
  onChangeText,
  icon,
  keyboardType,
  isLast,
}: {
  t: AppColors;
  label: string;
  value: string;
  editing: boolean;
  onChangeText: (v: string) => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  isLast?: boolean;
}) {
  return (
    <View style={[st.fieldRow, !isLast && { borderBottomWidth: 1, borderBottomColor: t.border }]}>
      <View style={[st.fieldIconWrap, { backgroundColor: t.accentSoft }]}>
        <Ionicons name={icon} size={15} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.fieldLabel, { color: t.textMuted }]}>{label}</Text>
        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor={t.textMuted}
            style={[st.fieldInput, { color: t.text, borderColor: t.border }]}
          />
        ) : (
          <Text style={[st.fieldValue, { color: t.text }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function MenuRow({
  t,
  icon,
  label,
  onPress,
  isLast,
}: {
  t: AppColors;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[st.fieldRow, !isLast && { borderBottomWidth: 1, borderBottomColor: t.border }]}
    >
      <View style={[st.fieldIconWrap, { backgroundColor: t.accentSoft }]}>
        <Ionicons name={icon} size={15} color={t.accent} />
      </View>
      <Text style={[st.fieldValue, { color: t.text, flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: F.sans700, fontSize: 15 },

  avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontFamily: F.display900, fontSize: 28 },
  avatarName: { fontFamily: F.sans700, fontSize: 17, marginBottom: 2 },
  avatarSub: { fontFamily: F.sans400, fontSize: 13 },

  section: { paddingHorizontal: 8, paddingTop: 20 },

  sectionCard: { padding: 18 },
  sectionHeading: { fontFamily: F.sans700, fontSize: 15 },
  bodyText: { fontFamily: F.sans400, fontSize: 13.5, lineHeight: 20 },

  planHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontFamily: F.sans700, fontSize: 17, marginTop: 10 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  fieldIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontFamily: F.sans600, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 },
  fieldValue: { fontFamily: F.sans500, fontSize: 14.5 },
  fieldInput: {
    fontFamily: F.sans500,
    fontSize: 14.5,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },

  editActions: { flexDirection: 'row', gap: 10 },

  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontFamily: F.sans700, fontSize: 14, color: '#FFFFFF' },

  secondaryBtn: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: { fontFamily: F.sans700, fontSize: 14 },

  glassCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  glassContent: { position: 'relative' },
});

export default ProfileScreen;
