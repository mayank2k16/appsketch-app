import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import {
  apiError,
  type DomainView,
  useDisconnectDomain,
  useRetryDomain,
} from '@/api/app-domains';
import type { ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

function useDisconnect(d: DomainView) {
  const router = useRouter();
  const m = useDisconnectDomain();
  const ask = () =>
    Alert.alert(
      `Disconnect ${d.domain}?`,
      'Your app stops opening on this domain. You can connect it again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () =>
            m.mutate(d.id, {
              onSuccess: () => {
                toast.success(`${d.domain} disconnected`);
                router.back();
              },
              onError: (e) => toast.error("Couldn't disconnect", apiError(e)),
            }),
        },
      ]
    );
  return { ask, busy: m.isPending };
}

/** Open site (live) · Retry setup (failed) · Disconnect (connected only). */
export function DomainActions({ s, d }: { s: ServicesPalette; d: DomainView }) {
  const retry = useRetryDomain();
  const dis = useDisconnect(d);
  const onRetry = () =>
    retry.mutate(d.id, {
      onError: (e) => toast.error("Couldn't retry", apiError(e)),
    });
  return (
    <View style={st.wrap}>
      {d.stage === 'live' && d.url ? (
        <PressableScale
          onPress={() =>
            void WebBrowser.openBrowserAsync(d.url as string).catch(() => {})
          }
          style={[st.btn, { backgroundColor: s.orange }]}
        >
          <Text style={[st.btnText, { color: s.onOrange }]}>Open site ↗</Text>
        </PressableScale>
      ) : null}
      {d.stage === 'failed' ? (
        <PressableScale
          onPress={onRetry}
          disabled={retry.isPending}
          disabledOpacity={1}
          style={[st.btn, { backgroundColor: s.ink }]}
        >
          {retry.isPending ? (
            <ActivityIndicator color={s.onInk} />
          ) : (
            <Text style={[st.btnText, { color: s.onInk }]}>Retry setup</Text>
          )}
        </PressableScale>
      ) : null}
      {d.source === 'connected' ? (
        <PressableScale onPress={dis.ask} disabled={dis.busy} style={st.link}>
          <Text style={[st.linkText, { color: s.error }]}>
            {dis.busy ? 'Disconnecting…' : 'Disconnect domain'}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 8, marginTop: 4 },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.sans700, fontSize: 15 },
  link: { alignSelf: 'center', paddingVertical: 10 },
  linkText: { fontFamily: F.sans600, fontSize: 13.5 },
});
