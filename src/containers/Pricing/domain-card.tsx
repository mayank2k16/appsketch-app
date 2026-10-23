import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useDomainSearch } from '@/api/app-domains';
import { type ServicesPalette, StateNote } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

import { DomainResult } from './domain-result';

function Results({ s, q }: { s: ServicesPalette; q: string }) {
  const search = useDomainSearch(q);
  if (q.trim().length < 2) return null;
  if (search.isLoading) return <StateNote s={s} loading />;
  if (search.isError)
    return (
      <StateNote
        s={s}
        title="Domain search isn't available right now"
        action="Try again"
        onAction={() => void search.refetch()}
      />
    );
  const rows = search.data?.results ?? [];
  if (!rows.length)
    return <StateNote s={s} title="No matches" note="Try another name." />;
  return (
    <View style={st.results}>
      {search.data?.sandbox ? (
        <Text style={[st.sandbox, { color: s.warning }]}>
          Test mode: registrations are not real.
        </Text>
      ) : null}
      {rows.map((r) => (
        <DomainResult key={r.domain} s={s} r={r} />
      ))}
    </View>
  );
}

/** "Get your domain": debounced search → Available/Taken rows with year
 *  chips → Add to cart. Paid with the cart (Razorpay), set up automatically. */
export function DomainCard({
  s,
  inputRef,
}: {
  s: ServicesPalette;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const router = useRouter();
  const [text, setText] = React.useState('');
  const q = useDebouncedValue(text, 400);
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Text style={[st.eyebrow, { color: s.sub }]}>Domains</Text>
      <Text style={[st.title, { color: s.text }]}>Get your domain</Text>
      <Text style={[st.sub, { color: s.sub }]}>
        Buy it here and your app is live on it in minutes, HTTPS included.
      </Text>
      <View style={st.hint}>
        <Ionicons name="pricetag-outline" size={12} color={s.success} />
        <Text style={[st.hintText, { color: s.sub }]}>
          Comes with any plan · discount codes accepted
        </Text>
      </View>
      <View style={[st.input, { backgroundColor: s.inset }]}>
        <Ionicons name="search" size={16} color={s.muted} />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="yourbrand.com"
          placeholderTextColor={s.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="search"
          style={[st.field, { color: s.text }]}
        />
        {text ? (
          <PressableScale
            onPress={() => setText('')}
            hitSlop={8}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={17} color={s.muted} />
          </PressableScale>
        ) : null}
      </View>
      <Results s={s} q={q} />
      <PressableScale
        onPress={() => router.push('/domains/connect')}
        style={st.link}
      >
        <Text style={[st.linkText, { color: s.text }]}>
          Already own a domain? Connect it →
        </Text>
      </PressableScale>
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, padding: 14, gap: 10 },
  eyebrow: {
    fontFamily: F.sans600,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: F.display900,
    fontSize: 19,
    letterSpacing: -0.4,
    marginTop: -4,
  },
  sub: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 17, marginTop: -6 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  hintText: { fontFamily: F.sans600, fontSize: 11.5 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  field: { flex: 1, fontFamily: F.sans500, fontSize: 14.5, paddingVertical: 0 },
  results: { gap: 8 },
  sandbox: { fontFamily: F.sans600, fontSize: 11.5 },
  link: { alignSelf: 'flex-start', paddingVertical: 2 },
  linkText: { fontFamily: F.sans600, fontSize: 13 },
});
