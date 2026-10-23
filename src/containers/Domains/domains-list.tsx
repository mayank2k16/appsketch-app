import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type DomainView, useMyDomains } from '@/api/app-domains';
import { type ServicesPalette, StateNote } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';

import { StagePill } from './stage-pill';

function Row({ s, d }: { s: ServicesPalette; d: DomainView }) {
  const router = useRouter();
  return (
    <PressableScale
      onPress={() => router.push(`/domains/${d.id}`)}
      scaleTo={0.98}
      style={[st.row, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <View style={st.rowBody}>
        <Text style={[st.name, { color: s.text }]} numberOfLines={1}>
          {d.domain}
        </Text>
        <Text style={[st.meta, { color: s.muted }]} numberOfLines={1}>
          {d.app ? d.app.title : 'No app attached'} ·{' '}
          {d.source === 'purchased' ? 'Bought here' : 'Connected'}
        </Text>
        <StagePill s={s} d={d} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={s.muted} />
    </PressableScale>
  );
}

function Actions({ s }: { s: ServicesPalette }) {
  const router = useRouter();
  return (
    <View style={st.actions}>
      <PressableScale
        onPress={() =>
          router.navigate({
            pathname: '/pricing',
            params: { section: 'domain' },
          })
        }
        style={[st.btn, { backgroundColor: s.ink }]}
      >
        <Ionicons name="search" size={14} color={s.onInk} />
        <Text style={[st.btnText, { color: s.onInk }]}>Get a domain</Text>
      </PressableScale>
      <PressableScale
        onPress={() => router.push('/domains/connect')}
        style={[
          st.btn,
          {
            backgroundColor: s.raised,
            borderColor: s.hairline,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name="link" size={14} color={s.text} />
        <Text style={[st.btnText, { color: s.text }]}>Connect a domain</Text>
      </PressableScale>
    </View>
  );
}

function List({ s }: { s: ServicesPalette }) {
  const q = useMyDomains();
  if (q.isLoading) return <StateNote s={s} loading />;
  if (q.isError)
    return (
      <StateNote
        s={s}
        title="Couldn't load your domains"
        note="Check your connection and try again."
        action="Retry"
        onAction={() => void q.refetch()}
      />
    );
  if (!q.data?.length)
    return (
      <StateNote
        s={s}
        title="No domains yet"
        note="Buy one or connect one you own. Your app goes live on it in minutes, with HTTPS."
      />
    );
  return (
    <View style={st.list}>
      {q.data.map((d) => (
        <Row key={d.id} s={s} d={d} />
      ))}
    </View>
  );
}

/** My domains: the two ways in, then each domain with its live stage. */
export function DomainsList({ s }: { s: ServicesPalette }) {
  const router = useRouter();
  const signedIn = useAuth.use.status() === 'signIn';
  return (
    <View style={st.wrap}>
      <Actions s={s} />
      {signedIn ? (
        <List s={s} />
      ) : (
        <StateNote
          s={s}
          title="Sign in to see your domains"
          action="Sign in"
          onAction={() =>
            router.push({ pathname: '/welcome', params: { return: '1' } })
          }
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: { fontFamily: F.sans700, fontSize: 13 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  rowBody: { flex: 1, gap: 4 },
  name: { fontFamily: F.sans700, fontSize: 15 },
  meta: { fontFamily: F.sans500, fontSize: 12 },
});
