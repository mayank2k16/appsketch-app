import * as React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import type { TenantSummary } from '@/api/studio';
import { useAppTheme } from '@/lib/theme';

export function StoreCard({
  tenant,
  loading,
  onViewCms,
  onViewStore,
  onViewCrm,
  onViewCustomStore,
}: {
  tenant: TenantSummary;
  loading: boolean;
  onViewCms: () => void;
  onViewStore: () => void;
  onViewCrm: () => void;
  onViewCustomStore: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={[st.card, { borderColor: t.studioCardBorder }]}>
      {/* Top-lit gradient body — lighter along the top edge, sinking to
          near-black at the bottom, so the card reads as a lit surface rather
          than the flat `card` fill it used before. */}
      <LinearGradient
        colors={t.studioCardGradient as unknown as [string, string, ...string[]]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Hairline highlight sitting on the very top edge — the detail that
          sells the "lit from above" read on a dark card. */}
      <View pointerEvents="none" style={[st.topEdge, { backgroundColor: t.studioCardTopEdge }]} />

      <View style={st.topRow}>
        <View style={[st.logoWrap, { backgroundColor: t.studioCardLogoBg, borderColor: t.studioCardBorder }]}>
          {tenant.logo ? (
            <Image source={{ uri: tenant.logo }} style={st.logo} resizeMode="cover" />
          ) : (
            <Ionicons name="storefront-outline" size={22} color={t.textMuted} />
          )}
        </View>

        <View style={st.titleWrap}>
          <Text style={[st.title, { color: t.text }]} numberOfLines={1}>
            {(tenant.title || 'Untitled store').slice(0, 40)}
          </Text>
          {!!tenant.website_url && (
            <Text style={[st.subtitle, { color: t.textMuted }]} numberOfLines={1}>
              {tenant.website_url}
            </Text>
          )}
        </View>
      </View>

      <View style={st.actionsRow}>
        <Pressable style={st.actionSlot} onPress={onViewStore}>
          <View
            style={[
              st.actionBtn,
              { backgroundColor: t.templatesChipBg, borderWidth: 1, borderColor: t.templatesChipBorder },
            ]}
          >
            <Text style={[st.storeBtnText, { color: t.text }]}>View Store</Text>
            <Ionicons name="open-outline" size={14} color={t.text} />
          </View>
        </Pressable>

        <Pressable style={st.actionSlot} onPress={onViewCms} disabled={loading}>
          <View style={[st.actionBtn, { backgroundColor: t.accent }]}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={st.cmsBtnText}>View CMS</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </>
            )}
          </View>
        </Pressable>

        <Pressable style={st.actionSlot} onPress={onViewCrm} disabled={loading}>
          <View style={[st.actionBtn, { backgroundColor: t.accent }]}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={st.cmsBtnText}>View CRM</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </>
            )}
          </View>
        </Pressable>

        <Pressable style={st.actionSlot} onPress={onViewCustomStore}>
          <View
            style={[
              st.actionBtn,
              { backgroundColor: t.templatesChipBg, borderWidth: 1, borderColor: t.templatesChipBorder },
            ]}
          >
            <Ionicons name="code-slash-outline" size={14} color={t.text} />
            <Text style={[st.storeBtnText, { color: t.text }]}>Remix</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 0,
    marginBottom: 10,
    borderWidth: 1,
    gap: 18,
    overflow: 'hidden',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  titleWrap: { flex: 1 },
  title: { fontSize: 14.5, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // The Pressable owns the grid slot; the View inside owns the skin. NativeWind's
  // JSX transform drops `style` callbacks on Pressable, so visual styling never
  // goes on the Pressable itself in this codebase.
  actionSlot: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 19,
  },
  storeBtnText: { fontSize: 12.5, fontWeight: '700' },
  cmsBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
});
