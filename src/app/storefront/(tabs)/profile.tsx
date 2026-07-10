import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@/api/home/use-home';
import { authenticatedClient } from '@/api/common/client';
import { getItem, storage } from '@/lib/storage';
import { signOut, useAuth } from '@/hooks/useAuth';
import { AddressFlowModal } from '@/components/address-flow-modal';
import { F } from '@/lib/fonts';

const RED        = '#C41230';
const RED_DIM    = 'rgba(196,18,48,0.12)';
const BLACK      = '#0D0D0D';
const DARK       = '#111111';
const MUTED      = '#888888';

// ─── Menu Row ─────────────────────────────────────────────────────────────────
function MenuRow({
  iconName,
  label,
  iconBg,
  iconColor,
  onPress,
  danger,
  loading,
}: {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={st.menuRow} activeOpacity={0.7} disabled={loading}>
      <View style={[st.menuIcon, { backgroundColor: iconBg }]}>
        {loading
          ? <ActivityIndicator size="small" color={iconColor} />
          : <Ionicons name={iconName} size={20} color={iconColor} />}
      </View>
      <Text style={[st.menuLabel, danger && { color: '#E53935' }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={danger ? '#E53935' : '#CCC'} />
    </TouchableOpacity>
  );
}


// ─── Header decorative blobs ──────────────────────────────────────────────────
function HeaderBlobs() {
  return (
    <>
      <View style={[st.blob, { width: 130, height: 130, borderRadius: 65, top: -40, left: -40, backgroundColor: 'rgba(196,18,48,0.25)' }]} />
      <View style={[st.blob, { width: 80,  height: 80,  borderRadius: 40, top: 30, right: 20,  backgroundColor: 'rgba(196,18,48,0.18)' }]} />
      <View style={[st.blob, { width: 55,  height: 55,  borderRadius: 28, bottom: 50, left: 50, backgroundColor: 'rgba(196,18,48,0.20)' }]} />
      <View style={[st.blob, { width: 100, height: 100, borderRadius: 50, bottom: -25, right: -25, backgroundColor: 'rgba(196,18,48,0.22)' }]} />
    </>
  );
}

// ─── Section divider with label ───────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return <Text style={st.sectionLabel}>{label}</Text>;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const authStatus = useAuth.use.status();
  const isLoggedIn = authStatus === 'signIn';

  const { data: user } = useUserProfile();
  const [addrVisible,     setAddrVisible]     = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  const [storedContact, setStoredContact] = React.useState('');
  React.useEffect(() => {
    if (!isLoggedIn) return;
    const val = getItem<string>('user_contact');
    if (val) setStoredContact(val);
  }, [isLoggedIn]);

  const apiPhone  = (user as any)?.phone || (user as any)?.phoneNumber || (user as any)?.mobile || '';
  const contact   = storedContact || apiPhone;
  const isPhone   = /^\+?\d[\d\s\-()]{6,}$/.test(contact);

  const displayContact = isLoggedIn ? (contact || 'Chinese Corner Member') : 'Guest';
  const fullName = isLoggedIn && user?.fullName && user.fullName !== 'User' ? user.fullName : '';
  const phoneForDelete = storedContact || apiPhone || '';

  function handleLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => { signOut(); router.replace('/login' as never); },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account', style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              const savedContact = storage.getString('user_contact');
              const phoneNumber  = savedContact ? JSON.parse(savedContact) : (phoneForDelete || '');
              await authenticatedClient.post('api/account/profile/delete_account/', { phone_number: phoneNumber });
              storage.delete('user_contact');
              signOut();
              router.replace('/login' as never);
            } catch {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  }

  // Initials avatar
  const initials = fullName
    ? fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : isLoggedIn
    ? (contact[0] || 'U').toUpperCase()
    : 'G';

  return (
    <View style={st.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── Black header ── */}
        <View style={[st.header, { paddingTop: (insets.top || (Platform.OS === 'ios' ? 56 : 32)) + 12 }]}>
          <HeaderBlobs />

          {/* Title row */}
          <View style={st.headerTop}>
            <Text style={st.headerTitle}>Profile</Text>
          </View>

          {/* Avatar */}
          <View style={st.avatarWrap}>
            <View style={st.avatar}>
              <Text style={st.avatarText}>{initials}</Text>
            </View>
            {isLoggedIn && (
              <View style={st.avatarBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>

          {/* Contact */}
          <Text style={st.contactText}>{displayContact}</Text>
          {!!fullName && <Text style={st.nameText}>{fullName}</Text>}

          {/* Status chip */}
          {isLoggedIn ? (
            <View style={st.verifiedChip}>
              <Ionicons name="shield-checkmark" size={11} color={RED} style={{ marginRight: 4 }} />
              <Text style={st.verifiedText}>Verified Account</Text>
            </View>
          ) : (
            <View style={st.guestChip}>
              <Text style={st.guestChipText}>Browsing as guest</Text>
            </View>
          )}
        </View>

        {/* ── White card ── */}
        <View style={st.menuCard}>

          {/* ── Account section ── */}
          {isLoggedIn ? (
            <>
              <SectionLabel label="MY ACCOUNT" />

              <MenuRow
                iconName="receipt-outline"
                label="My Orders"
                iconBg="#FFF0F3"
                iconColor={RED}
                onPress={() => router.push('/storefront/myorders' as never)}
              />
              <View style={st.divider} />

              <MenuRow
                iconName="location-outline"
                label="My Addresses"
                iconBg="#FFF0F3"
                iconColor={RED}
                onPress={() => setAddrVisible(true)}
              />
            </>
          ) : (
            <>
              <SectionLabel label="MY ACCOUNT" />
              <TouchableOpacity
                onPress={() => router.push('/login' as never)}
                style={st.signInBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={st.signInBtnText}>Sign In / Create Account</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── App info section ── */}
          <SectionLabel label="APP INFO" />

          <MenuRow
            iconName="document-text-outline"
            label="Terms & Conditions"
            iconBg="#F5F5F5"
            iconColor="#555"
            onPress={() => router.push('/storefront/terms' as never)}
          />
          <View style={st.divider} />

          <MenuRow
            iconName="lock-closed-outline"
            label="Privacy Policy"
            iconBg="#F5F5F5"
            iconColor="#555"
            onPress={() => router.push('/storefront/privacy' as never)}
          />

          {/* ── Danger zone ── */}
          {isLoggedIn && (
            <>
              <SectionLabel label="ACCOUNT ACTIONS" />

              <MenuRow
                iconName="log-out-outline"
                label="Log Out"
                iconBg="#FFF0F0"
                iconColor="#E53935"
                danger
                onPress={handleLogOut}
              />
              <View style={st.divider} />

              <MenuRow
                iconName="trash-outline"
                label="Delete Account"
                iconBg="#FFF0F0"
                iconColor="#E53935"
                danger
                loading={deletingAccount}
                onPress={handleDeleteAccount}
              />
            </>
          )}

          {/* App version */}
          <Text style={st.versionText}>Chinese Corner · v1.0.0</Text>
        </View>
      </ScrollView>

      <AddressFlowModal
        visible={addrVisible}
        onSelect={() => setAddrVisible(false)}
        onClose={() => setAddrVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: '#F8F8F8' },
  scrollContent: { flexGrow: 1 },

  // ── Header ──
  header: {
    backgroundColor: BLACK,
    paddingBottom: 48,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  blob: { position: 'absolute' },
  headerTop: {
    width: '100%',
    paddingHorizontal: 22,
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: F.sans900,
    color: '#fff',
    letterSpacing: -0.5,
  },

  // Avatar
  avatarWrap:  { marginBottom: 16, position: 'relative' },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText:  { fontSize: 30, fontFamily: F.sans900, color: '#fff', letterSpacing: -1 },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BLACK,
  },

  // Contact
  contactText: {
    fontSize: 20,
    fontFamily: F.sans900,
    color: '#fff',
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  nameText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 5,
    fontFamily: F.sans500,
  },

  // Chips
  verifiedChip: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196,18,48,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,18,48,0.35)',
  },
  verifiedText: { color: RED, fontSize: 12, fontFamily: F.sans700, letterSpacing: 0.3 },

  guestChip: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  guestChipText: { color: 'rgba(255,255,255,0.60)', fontSize: 12, fontFamily: F.sans600 },

  // ── Menu card ──
  menuCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flex: 1,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 6 },
    }),
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: F.sans800,
    color: MUTED,
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 8,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel:   { flex: 1, fontSize: 15, fontFamily: F.sans600, color: DARK },
  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0', marginLeft: 58 },

  // Sign-in CTA
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
    marginBottom: 4,
    ...Platform.select({
      ios:     { shadowColor: RED, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  signInBtnText: { color: '#fff', fontSize: 15, fontFamily: F.sans800, letterSpacing: 0.2 },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: F.sans400,
    color: '#CCC',
    marginTop: 28,
    marginBottom: 8,
  },

});
