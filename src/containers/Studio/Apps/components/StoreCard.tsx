import * as React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TenantSummary } from '@/api/studio';

const RED = '#C41230';
const BLACK = '#0D0D0D';
const MUTED = '#8A8A8A';
const BORDER = '#EFEFEF';

export function StoreCard({
  tenant,
  loading,
  onViewCms,
}: {
  tenant: TenantSummary;
  loading: boolean;
  onViewCms: () => void;
}) {
  return (
    <View style={st.card}>
      <View style={st.logoWrap}>
        {tenant.logo ? (
          <Image source={{ uri: tenant.logo }} style={st.logo} resizeMode="cover" />
        ) : (
          <Ionicons name="storefront-outline" size={22} color={MUTED} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={st.title} numberOfLines={1}>
          {(tenant.title || 'Untitled store').slice(0, 30)}
        </Text>
        {!!tenant.website_url && (
          <Text style={st.subtitle} numberOfLines={1}>
            {tenant.website_url}
          </Text>
        )}
      </View>

      <Pressable style={st.cmsBtn} onPress={onViewCms} disabled={loading}>
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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 14.5, fontWeight: '700', color: BLACK },
  subtitle: { fontSize: 12, color: MUTED, marginTop: 2 },
  cmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: RED,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  cmsBtnText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
});
