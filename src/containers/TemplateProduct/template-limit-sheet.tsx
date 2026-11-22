import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import {
  deleteTemplateApp,
  getTemplateApps,
  type TemplateAllowance,
  type TemplateApp,
  tierLabel,
} from '@/api/templates';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

import { ALLOWANCE_KEY } from './template-slot';
import type { PageTheme } from './theme';

/**
 * /template-limit: the plan's template allowance is used up. Two ways on:
 * upgrade (the Pricing tab), or delete one of their template copies (soft
 * delete server-side: its site goes offline, it leaves My apps) to free a
 * slot. Once a slot is free, "Continue" runs the copy that was refused.
 */
const ORANGE = '#EB4709';
const GRADIENT = ['#FF7A2F', '#EB4709'] as const;

type Props = {
  initial: TemplateAllowance;
  t: PageTheme;
  onClose: () => void;
  onUpgrade: () => void;
  onContinue: () => void;
};

function useLimitData(initial: TemplateAllowance) {
  const qc = useQueryClient();
  const [allowance, setAllowance] = React.useState(initial);
  const [apps, setApps] = React.useState<TemplateApp[] | null>(null);
  const [deleting, setDeleting] = React.useState<number | null>(null);
  React.useEffect(() => {
    getTemplateApps()
      .then((r) => {
        // An older backend answers this path with something else: keep the
        // allowance we were given and show no list.
        setApps(Array.isArray(r?.results) ? r.results : []);
        if (r?.allowance && typeof r.allowance.allowed === 'boolean')
          setAllowance(r.allowance);
      })
      .catch(() => setApps([]));
  }, []);
  const remove = async (app: TemplateApp) => {
    setDeleting(app.id);
    try {
      const r = await deleteTemplateApp(app.id);
      setApps((list) => (list ?? []).filter((a) => a.id !== app.id));
      if (r?.allowance) {
        setAllowance(r.allowance);
        qc.setQueryData(ALLOWANCE_KEY, r.allowance);
      }
      toast.success(`${app.title} deleted. A slot is free.`);
    } catch {
      toast.error(`Couldn't delete ${app.title}. Please try again.`);
    } finally {
      setDeleting(null);
    }
  };
  const confirm = (app: TemplateApp) =>
    Alert.alert(
      `Delete ${app.title}?`,
      app.apps > 1
        ? `All ${app.apps} apps in this ecosystem go offline and leave My apps.`
        : 'Its site goes offline and it leaves My apps.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void remove(app),
        },
      ]
    );
  return { allowance, apps, deleting, confirm };
}

function Meter({ a, t }: { a: TemplateAllowance; t: PageTheme }) {
  const limit = a.limit ?? a.used;
  const pct = limit ? Math.min(1, a.used / limit) : 0;
  return (
    <View style={s.meter}>
      <View style={[s.track, { backgroundColor: t.chip }]}>
        <LinearGradient
          colors={a.allowed ? ['#34C759', '#2BA84A'] : GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.fill, { width: `${Math.max(6, pct * 100)}%` }]}
        />
      </View>
      <Text style={[s.meterText, { color: t.muted }]}>
        {a.used} of {a.limit ?? '∞'} template apps on {tierLabel(a.tier)}
      </Text>
    </View>
  );
}

function UpgradeCard({
  a,
  onPress,
}: {
  a: TemplateAllowance;
  onPress: () => void;
}) {
  if (!a.next_tier) return null;
  return (
    <PressableScale haptic="press" onPress={onPress} style={s.upWrap}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.up}
      >
        <View style={s.upIcon}>
          <Ionicons name="rocket" size={18} color={ORANGE} />
        </View>
        <View style={s.flex}>
          <Text style={s.upTitle}>Upgrade to {a.next_tier}</Text>
          <Text style={s.upSub}>
            {a.next_limit
              ? `${a.next_limit} template apps`
              : 'Unlimited template apps'}
            , more AI credits
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#FFF" />
      </LinearGradient>
    </PressableScale>
  );
}

function AppRow({
  app,
  t,
  busy,
  onDelete,
}: {
  app: TemplateApp;
  t: PageTheme;
  busy: boolean;
  onDelete: () => void;
}) {
  const kind =
    app.apps > 1
      ? `Ecosystem · ${app.apps} apps`
      : app.app_type === 'mobile'
        ? 'App'
        : 'Website';
  return (
    <View style={[s.row, { borderColor: t.chipEdge, backgroundColor: t.chip }]}>
      <View style={[s.thumb, { backgroundColor: t.edge }]}>
        {app.thumbnail_url ? (
          <Image
            source={{ uri: app.thumbnail_url }}
            contentFit="cover"
            style={s.thumbImg}
          />
        ) : (
          <Ionicons
            name={
              app.app_type === 'mobile'
                ? 'phone-portrait-outline'
                : 'globe-outline'
            }
            size={18}
            color={t.muted}
          />
        )}
      </View>
      <View style={s.flex}>
        <Text style={[s.rowTitle, { color: t.ink }]} numberOfLines={1}>
          {app.title || 'Untitled app'}
        </Text>
        <Text style={[s.rowSub, { color: t.muted }]}>{kind}</Text>
      </View>
      <PressableScale
        onPress={onDelete}
        disabled={busy}
        hitSlop={6}
        accessibilityLabel={`Delete ${app.title}`}
        style={[s.del, { borderColor: t.outline }]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={ORANGE} />
        ) : (
          <Ionicons name="trash-outline" size={16} color="#D92D20" />
        )}
      </PressableScale>
    </View>
  );
}

const FEW = 4;
const MAX = 8;

function AppList({
  data,
  t,
}: {
  data: ReturnType<typeof useLimitData>;
  t: PageTheme;
}) {
  const [all, setAll] = React.useState(false);
  if (data.apps === null)
    return <ActivityIndicator style={s.loading} color={ORANGE} />;
  if (!data.apps.length)
    return (
      <Text style={[s.empty, { color: t.muted }]}>
        No template apps to delete.
      </Text>
    );
  const shown = data.apps.slice(0, all ? MAX : FEW);
  const rest = data.apps.length - shown.length;
  return (
    <View style={s.list}>
      {shown.map((app) => (
        <AppRow
          key={app.id}
          app={app}
          t={t}
          busy={data.deleting === app.id}
          onDelete={() => data.confirm(app)}
        />
      ))}
      {rest > 0 && !all ? (
        <PressableScale onPress={() => setAll(true)} hitSlop={6}>
          <Text style={s.more}>Show {Math.min(rest, MAX - FEW)} more</Text>
        </PressableScale>
      ) : rest > 0 ? (
        <Text style={[s.empty, { color: t.muted }]}>
          {rest} more on My apps.
        </Text>
      ) : null}
    </View>
  );
}

function Head({
  a,
  t,
  onClose,
}: {
  a: TemplateAllowance;
  t: PageTheme;
  onClose: () => void;
}) {
  return (
    <View style={s.head}>
      <View
        style={[s.lock, { backgroundColor: a.allowed ? '#E8F8EC' : '#FFF1EA' }]}
      >
        <Ionicons
          name={a.allowed ? 'lock-open' : 'lock-closed'}
          size={18}
          color={a.allowed ? '#2BA84A' : ORANGE}
        />
      </View>
      <View style={s.flex}>
        <Text style={[s.title, { color: t.ink }]}>
          {a.allowed ? 'A slot is free' : 'Template limit reached'}
        </Text>
        <Text style={[s.sub, { color: t.muted }]}>
          {a.allowed
            ? 'Continue to copy this template.'
            : 'Upgrade, or delete an app to continue.'}
        </Text>
      </View>
      <PressableScale
        onPress={onClose}
        hitSlop={10}
        accessibilityLabel="Close"
        style={[s.close, { backgroundColor: t.chip }]}
      >
        <Ionicons name="close" size={16} color={t.muted} />
      </PressableScale>
    </View>
  );
}

function ContinueFoot({ t, onPress }: { t: PageTheme; onPress: () => void }) {
  return (
    <View style={[s.foot, { borderColor: t.edge }]}>
      <PressableScale haptic="press" onPress={onPress} style={s.ctaWrap}>
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cta}
        >
          <Text style={s.ctaText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

export function TemplateLimitSheet(p: Props) {
  const { t } = p;
  const data = useLimitData(p.initial);
  const a = data.allowance;
  return (
    <View style={[s.flex, { backgroundColor: t.panel }]}>
      {/* No ScrollView: in a form sheet react-native-screens lays one out
          at zero height or over the header. The list is short instead
          (AppList shows the newest few; the rest are on My apps). */}
      <View style={[s.flex, s.top]}>
        <Head a={a} t={t} onClose={p.onClose} />
        <Meter a={a} t={t} />
        {a.allowed ? null : <UpgradeCard a={a} onPress={p.onUpgrade} />}
        <Text style={[s.section, { color: t.muted }]}>
          {a.allowed ? 'YOUR TEMPLATE APPS' : 'OR DELETE AN APP TO FREE A SLOT'}
        </Text>
        <AppList data={data} t={t} />
      </View>
      {a.allowed ? <ContinueFoot t={t} onPress={p.onContinue} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10, gap: 16 },
  more: {
    fontFamily: F.sans700,
    fontSize: 13,
    color: ORANGE,
    paddingVertical: 4,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lock: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: F.sans800, fontSize: 20, letterSpacing: -0.4 },
  sub: { fontFamily: F.sans500, fontSize: 13 },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meter: { gap: 7 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  meterText: { fontFamily: F.sans600, fontSize: 12.5 },
  upWrap: {
    borderRadius: 18,
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  up: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upTitle: { fontFamily: F.sans800, fontSize: 15.5, color: '#FFF' },
  upSub: {
    fontFamily: F.sans500,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 1,
  },
  section: {
    fontFamily: F.sans700,
    fontSize: 11.5,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  rowTitle: { fontFamily: F.sans700, fontSize: 14 },
  rowSub: { fontFamily: F.sans500, fontSize: 12, marginTop: 1 },
  del: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { marginTop: 12 },
  empty: { fontFamily: F.sans500, fontSize: 13 },
  foot: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaWrap: { borderRadius: 16 },
  cta: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: F.sans800, fontSize: 15.5, color: '#FFF' },
});
