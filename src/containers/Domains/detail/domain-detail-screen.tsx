import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDomain } from '@/api/app-domains';
import {
  ScreenHeader,
  StateNote,
  useServicesTheme,
} from '@/components/services';
import { usePageActive } from '@/containers/TemplateProduct/use-page-active';

import { DomainActions } from './actions';
import { AppRow } from './app-row';
import { CertCard } from './cert-card';
import { DnsCard } from './dns-card';
import { StageTracker } from './stage-tracker';

/** /domains/[id] — live setup tracker. Polls every 5s until live/failed,
 *  only while this screen is focused and the app is in the foreground. */
export function DomainDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, s } = useServicesTheme();
  const insets = useSafeAreaInsets();
  const active = usePageActive();
  const q = useDomain(id, active);
  const d = q.data;
  return (
    <View style={[st.root, { backgroundColor: s.canvas }]}>
      <StatusBar barStyle={t.statusBar} />
      <ScreenHeader s={s} title="Domain" />
      <ScrollView
        contentContainerStyle={[st.body, { paddingBottom: insets.bottom + 30 }]}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching && !q.isLoading}
            onRefresh={() => void q.refetch()}
          />
        }
      >
        {d ? (
          <>
            <StageTracker s={s} d={d} active={active} />
            <AppRow s={s} d={d} />
            <DnsCard s={s} d={d} />
            <CertCard s={s} c={d.certificate} />
            <DomainActions s={s} d={d} />
          </>
        ) : (
          <StateNote
            s={s}
            loading={q.isLoading}
            title="Couldn't load this domain"
            note="Check your connection and try again."
            action="Retry"
            onAction={() => void q.refetch()}
          />
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 12, gap: 10 },
});
