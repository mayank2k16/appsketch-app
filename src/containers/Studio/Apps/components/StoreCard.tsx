import * as React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

import type { TenantSummary } from '@/api/studio';
import { useAppTheme } from '@/lib/theme';

export function StoreCard({
  tenant,
  loading,
  onViewCms,
}: {
  tenant: TenantSummary;
  loading: boolean;
  onViewCms: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  return (
    <View style={[st.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[st.logoWrap, { backgroundColor: t.surface }]}>
        {tenant.logo ? (
          <Image source={{ uri: tenant.logo }} style={st.logo} resizeMode="cover" />
        ) : (
          <Ionicons name="storefront-outline" size={22} color={t.textMuted} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[st.title, { color: t.text }]} numberOfLines={1}>
          {(tenant.title || 'Untitled store').slice(0, 30)}
        </Text>
        {!!tenant.website_url && (
          <Text style={[st.subtitle, { color: t.textMuted }]} numberOfLines={1}>
            {tenant.website_url}
          </Text>
        )}
      </View>

      <Pressable style={[st.cmsBtn, { backgroundColor: t.accent }]} onPress={onViewCms} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={st.cmsBtnText}>View CMS</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </>
        )}
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 14.5, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  cmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  cmsBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
});
