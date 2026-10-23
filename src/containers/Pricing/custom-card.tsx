import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { type ServicesPalette } from '@/components/services';
import { PressableScale } from '@/components/ui';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

const TOPICS = [
  'Marketing',
  'Custom apps',
  'Booking',
  'Hardware & POS',
  'Custom workflows',
];

function message(picks: string[]) {
  return picks.length
    ? `Hi AppSketch, I'd like to discuss a project: ${picks.join(', ')}.`
    : "Hi AppSketch, I'd like to discuss a custom project.";
}

/** "Custom solutions": toggle what you need, then talk to the team on
 *  WhatsApp with the picks already written. */
export function CustomCard({
  s,
  whatsapp,
}: {
  s: ServicesPalette;
  whatsapp: string | undefined;
}) {
  const [picks, setPicks] = React.useState<string[]>([]);
  const toggle = (x: string) =>
    setPicks((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]));
  const open = () => {
    if (!whatsapp) return;
    const sep = whatsapp.includes('?') ? '&' : '?';
    Linking.openURL(
      `${whatsapp}${sep}text=${encodeURIComponent(message(picks))}`
    ).catch(() => toast.error("Couldn't open WhatsApp"));
  };
  return (
    <View
      style={[st.card, { backgroundColor: s.raised, borderColor: s.hairline }]}
    >
      <Text style={[st.eyebrow, { color: s.sub }]}>Custom solutions</Text>
      <Text style={[st.title, { color: s.text }]}>
        Something bigger in mind?
      </Text>
      <View style={st.chips}>
        {TOPICS.map((x) => {
          const on = picks.includes(x);
          return (
            <PressableScale
              key={x}
              onPress={() => toggle(x)}
              haptic="select"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[
                st.chip,
                on
                  ? { backgroundColor: s.ink, borderColor: s.ink }
                  : { backgroundColor: s.raised, borderColor: s.hairline },
              ]}
            >
              {on ? (
                <Ionicons name="checkmark" size={12} color={s.onInk} />
              ) : null}
              <Text style={[st.chipText, { color: on ? s.onInk : s.text }]}>
                {x}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <PressableScale
        onPress={open}
        disabled={!whatsapp}
        style={[st.btn, { backgroundColor: s.inset }]}
        accessibilityHint="Opens WhatsApp with your picks"
      >
        <Ionicons name="logo-whatsapp" size={15} color={s.text} />
        <Text style={[st.btnText, { color: s.text }]}>
          Discuss my project →
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    height: 32,
  },
  chipText: { fontFamily: F.sans600, fontSize: 12.5 },
  btn: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  btnText: { fontFamily: F.sans700, fontSize: 13.5 },
});
