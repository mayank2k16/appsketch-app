import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';

import type { CustomiseForm } from './customise-brief';
import { LogoTile } from './customise-logo';
import type { PageTheme } from './theme';

/**
 * The "Customise with AI" form (route /customise, a native form sheet at
 * ~70% height over the template page): a logo (optional, camera or
 * library), the business name and a short description (optional). "Start
 * customising" hands the form back to the template page (customise-brief.ts),
 * which copies the template and opens the builder's AI chat on the copy
 * with these as its brief.
 */

const ORANGE = '#EB4709';
const GRADIENT = ['#FF7A2F', '#EB4709'] as const;
const DESC_MAX = 240;

type Props = {
  templateName: string;
  t: PageTheme;
  onClose: () => void;
  onSubmit: (form: CustomiseForm) => void;
};

function Header({
  t,
  name,
  onClose,
}: {
  t: PageTheme;
  name: string;
  onClose: () => void;
}) {
  return (
    <View style={s.head}>
      <LinearGradient colors={GRADIENT} style={s.mark}>
        <Ionicons name="sparkles" size={18} color="#FFF" />
      </LinearGradient>
      <View style={s.headText}>
        <Text style={[s.title, { color: t.ink }]}>Make it yours</Text>
        <Text style={[s.sub, { color: t.muted }]} numberOfLines={2}>
          AI rebrands <Text style={{ color: t.ink }}>{name}</Text> for your
          business
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

function Field({
  label,
  icon,
  optional,
  count,
  t,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  optional?: boolean;
  count?: string;
  t: PageTheme;
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={s.field}>
      <View style={s.labelRow}>
        <Text style={[s.label, { color: t.ink }]}>
          {label}
          {optional ? (
            <Text style={[s.optional, { color: t.muted }]}> optional</Text>
          ) : null}
        </Text>
        {count ? (
          <Text style={[s.count, { color: t.muted }]}>{count}</Text>
        ) : null}
      </View>
      <View
        style={[
          s.box,
          input.multiline && s.boxMulti,
          {
            backgroundColor: t.chip,
            borderColor: focus ? ORANGE : t.chipEdge,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={focus ? ORANGE : t.muted}
          style={input.multiline ? s.iconTop : undefined}
        />
        <TextInput
          placeholderTextColor={t.muted}
          selectionColor={ORANGE}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...input}
          style={[s.input, input.multiline && s.inputMulti, { color: t.ink }]}
        />
      </View>
    </View>
  );
}

function Footer({
  t,
  ready,
  onPress,
}: {
  t: PageTheme;
  ready: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[s.foot, { borderColor: t.edge, backgroundColor: t.panel }]}>
      <PressableScale
        haptic="press"
        disabled={!ready}
        disabledOpacity={0.4}
        onPress={onPress}
        style={s.ctaWrap}
      >
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cta}
        >
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={s.ctaText}>Start customising</Text>
        </LinearGradient>
      </PressableScale>
      <Text style={[s.fine, { color: t.muted }]}>
        We copy the template to your account first. You can keep editing after.
      </Text>
    </View>
  );
}

export function CustomiseSheet(p: Props) {
  const { t } = p;
  const [logo, setLogo] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const ready = name.trim().length > 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.flex, { backgroundColor: t.panel }]}
    >
      <View style={[s.flex, s.body]}>
        <Header t={t} name={p.templateName} onClose={p.onClose} />
        <LogoTile logo={logo} onChange={setLogo} t={t} />
        <Field
          t={t}
          icon="storefront-outline"
          label="Business name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sharma Interiors"
          autoCapitalize="words"
          returnKeyType="done"
          maxLength={60}
        />
        <Field
          t={t}
          icon="chatbubble-ellipses-outline"
          label="About your business"
          optional
          count={description ? `${description.length}/${DESC_MAX}` : undefined}
          value={description}
          onChangeText={(v) => setDescription(v.slice(0, DESC_MAX))}
          placeholder="What you do, who it's for, where you are"
          multiline
        />
      </View>
      <Footer
        t={t}
        ready={ready}
        onPress={() =>
          p.onSubmit({
            name: name.trim(),
            description: description.trim(),
            logo,
          })
        }
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12, gap: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, gap: 2 },
  title: { fontFamily: F.sans800, fontSize: 20, letterSpacing: -0.4 },
  sub: { fontFamily: F.sans500, fontSize: 13 },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { gap: 7 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: { fontFamily: F.sans700, fontSize: 14.5 },
  optional: { fontFamily: F.sans500, fontSize: 12.5 },
  count: { fontFamily: F.sans500, fontSize: 11.5 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  boxMulti: { alignItems: 'flex-start', paddingVertical: 12, minHeight: 92 },
  iconTop: { marginTop: 2 },
  input: { flex: 1, fontFamily: F.sans500, fontSize: 15, paddingVertical: 12 },
  inputMulti: { paddingVertical: 0, minHeight: 66, textAlignVertical: 'top' },
  foot: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaWrap: {
    borderRadius: 16,
    shadowColor: ORANGE,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cta: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: F.sans800, fontSize: 15.5, color: '#FFFFFF' },
  fine: { fontFamily: F.sans400, fontSize: 11.5, textAlign: 'center' },
});
