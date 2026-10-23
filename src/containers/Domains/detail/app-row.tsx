import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { apiError, type DomainView, useAttachDomain } from '@/api/app-domains';
import { appKind, AppSheet, type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

/** The app this domain serves, with "Change app" (POST attach). */
export function AppRow({ s, d }: { s: ServicesPalette; d: DomainView }) {
  const [open, setOpen] = React.useState(false);
  const attach = useAttachDomain();
  const pick = (id: number | string) => {
    setOpen(false);
    if (String(id) === String(d.app?.id)) return;
    attach.mutate(
      { id: d.id, tenant_id: id },
      {
        onSuccess: (v) =>
          toast.success(`${v.domain} now opens ${v.app?.title ?? 'your app'}`),
        onError: (e) => toast.error("Couldn't change the app", apiError(e)),
      }
    );
  };
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <View style={st.body}>
        <Text style={[st.k, { color: s.muted }]}>Opens</Text>
        <Text style={[st.v, { color: s.text }]} numberOfLines={1}>
          {d.app ? `${d.app.title} · ${appKind(d.app)}` : 'No app attached'}
        </Text>
      </View>
      <PressableScale
        onPress={() => setOpen(true)}
        disabled={attach.isPending}
        disabledOpacity={1}
        style={[st.btn, { borderColor: s.hairline }]}
      >
        {attach.isPending ? (
          <ActivityIndicator size="small" color={s.text} />
        ) : (
          <Text style={[st.btnText, { color: s.text }]}>
            {d.app ? 'Change app' : 'Pick app'}
          </Text>
        )}
      </PressableScale>
      <AppSheet
        s={s}
        open={open}
        title={`What should ${d.domain} open?`}
        value={d.app?.id ?? null}
        onClose={() => setOpen(false)}
        onPick={(a) => pick(a.id)}
      />
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  body: { flex: 1 },
  k: { fontFamily: F.sans500, fontSize: 11.5 },
  v: { fontFamily: F.sans700, fontSize: 14, marginTop: 1 },
  btn: {
    height: 34,
    minWidth: 96,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: F.sans600, fontSize: 12.5 },
});
