import * as React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type {
  ClarifyBlock as ClarifyBlockType,
  ClarifyFontOption,
  ClarifyPaletteOption,
  ClarifyQuestion,
} from '@/api/coder';
import type { AppColors } from '@/lib/theme';

type Selected = string | ClarifyPaletteOption | ClarifyFontOption | undefined;

function isPaletteOption(v: unknown): v is ClarifyPaletteOption {
  return !!v && typeof v === 'object' && 'colors' in (v as Record<string, unknown>);
}
function isFontOption(v: unknown): v is ClarifyFontOption {
  return !!v && typeof v === 'object' && 'heading' in (v as Record<string, unknown>);
}

/** Renders the agent's design-brief clarify questionnaire (`ui_block.kind
 * === "clarify"`) — a faithful port of Vite's `ClarifyBlock.jsx`, matched
 * against that file directly rather than guessed: `choice`/`checklist`
 * options are plain strings (not `{id,label}` objects), `palette` options
 * are `{name,colors,vibe}`, `fonts` options are `{name,heading,body}`, and
 * every question (unless `allowCustom===false`) also accepts a typed custom
 * answer that overrides the picked option. Submission always sends one
 * human-readable string per question — never raw ids — because the agent
 * reads these as design-brief text. */
export function ClarifyBlockView({
  block,
  colors,
  onSubmit,
}: {
  block: ClarifyBlockType;
  colors: AppColors;
  onSubmit: (value: Record<string, string>) => void;
}) {
  const questions = block.questions ?? [];

  const [sel, setSel] = React.useState<Record<string, Selected>>({});
  const [checks, setChecks] = React.useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    questions.forEach((q) => {
      if (q.type === 'checklist' && Array.isArray(q.preselect) && q.preselect.length) {
        const options = (q.options as string[] | undefined) ?? [];
        init[q.id] = q.preselect.filter((o) => options.includes(o));
      }
    });
    return init;
  });
  const [custom, setCustom] = React.useState<Record<string, string>>({});

  function pick(id: string, val: Selected) {
    setSel((s) => ({ ...s, [id]: val }));
  }
  function setText(id: string, val: string) {
    setCustom((c) => ({ ...c, [id]: val }));
  }
  function toggleCheck(id: string, opt: string) {
    setChecks((c) => {
      const cur = c[id] ?? [];
      return { ...c, [id]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
    });
  }

  function valueFor(q: ClarifyQuestion): string {
    const c = (custom[q.id] ?? '').trim();
    if (q.type === 'checklist') {
      const extra = c ? c.split(',').map((s) => s.trim()).filter(Boolean) : [];
      return [...(checks[q.id] ?? []), ...extra].join(', ');
    }
    if (c) return c;
    const v = sel[q.id];
    if (v == null) {
      const first = (q.options as (string | ClarifyPaletteOption | ClarifyFontOption)[] | undefined)?.[0];
      if (q.type === 'palette') return isPaletteOption(first) ? `${first.name} — ${first.colors.join(', ')}` : '';
      if (q.type === 'fonts') return isFontOption(first) ? `${first.heading} / ${first.body}` : '';
      return (first as string) ?? '';
    }
    if (isPaletteOption(v)) return `${v.name} — ${v.colors.join(', ')}`;
    if (isFontOption(v)) return `${v.heading} / ${v.body}`;
    return v;
  }

  function submit() {
    const out: Record<string, string> = {};
    questions.forEach((q) => {
      out[q.id] = valueFor(q);
    });
    onSubmit(out);
  }

  return (
    <View style={[st.card, { backgroundColor: colors.codeEditorSurface, borderColor: colors.codeEditorBorder }]}>
      {block.intro ? <Text style={[st.intro, { color: colors.text }]}>{block.intro}</Text> : null}

      {questions.map((q) => (
        <View key={q.id} style={st.questionBlock}>
          <Text style={[st.label, { color: colors.textSub }]}>{q.label}</Text>

          {q.type === 'palette' ? (
            <View style={st.optionRow}>
              {((q.options as ClarifyPaletteOption[] | undefined) ?? []).map((p) => {
                const current = sel[q.id];
                const selected = isPaletteOption(current) && current.name === p.name;
                return (
                  <TouchableOpacity
                    key={p.name}
                    onPress={() => pick(q.id, p)}
                    style={[
                      st.paletteSwatch,
                      { borderColor: selected ? colors.accent : colors.codeEditorBorder },
                    ]}
                  >
                    <View style={st.paletteColors}>
                      {p.colors.slice(0, 4).map((c, i) => (
                        <View key={`${c}-${i}`} style={[st.paletteDot, { backgroundColor: c }]} />
                      ))}
                    </View>
                    <Text style={[st.optionLabel, { color: colors.text }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : q.type === 'fonts' ? (
            <View style={st.optionRow}>
              {((q.options as ClarifyFontOption[] | undefined) ?? []).map((f) => {
                const current = sel[q.id];
                const selected = isFontOption(current) && current.name === f.name;
                return (
                  <TouchableOpacity
                    key={f.name}
                    onPress={() => pick(q.id, f)}
                    style={[
                      st.fontCard,
                      { borderColor: selected ? colors.accent : colors.codeEditorBorder },
                    ]}
                  >
                    <Text style={[st.fontHeading, { color: colors.text }]} numberOfLines={1}>
                      {f.heading}
                    </Text>
                    <Text style={{ color: colors.textSub, fontSize: 10.5 }} numberOfLines={1}>
                      {f.body}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : q.type === 'checklist' ? (
            <View style={st.optionRow}>
              {((q.options as string[] | undefined) ?? []).map((opt) => {
                const on = (checks[q.id] ?? []).includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleCheck(q.id, opt)}
                    style={[
                      st.chip,
                      {
                        backgroundColor: on ? colors.accent : colors.codeEditorTabBg,
                        borderColor: on ? colors.accent : colors.codeEditorBorder,
                      },
                    ]}
                  >
                    <Text style={[st.chipLabel, { color: on ? '#FFFFFF' : colors.text }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : q.type === 'choice' ? (
            <View style={st.optionRow}>
              {((q.options as string[] | undefined) ?? []).map((opt) => {
                const selected = sel[q.id] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => pick(q.id, opt)}
                    style={[
                      st.chip,
                      {
                        backgroundColor: selected ? colors.accent : colors.codeEditorTabBg,
                        borderColor: selected ? colors.accent : colors.codeEditorBorder,
                      },
                    ]}
                  >
                    <Text style={[st.chipLabel, { color: selected ? '#FFFFFF' : colors.text }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {q.allowCustom !== false ? (
            <TextInput
              value={custom[q.id] ?? ''}
              onChangeText={(v) => setText(q.id, v)}
              placeholder={q.type === 'checklist' ? 'add your own (comma separated)…' : 'or type your own…'}
              placeholderTextColor={colors.codeEditorTextMuted}
              style={[st.textInput, { color: colors.text, borderColor: colors.codeEditorBorder }]}
            />
          ) : null}
        </View>
      ))}

      <TouchableOpacity onPress={submit} style={[st.submitBtn, { backgroundColor: colors.accent }]}>
        <Text style={st.submitLabel}>{block.submitLabel ?? 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  intro: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  questionBlock: {
    gap: 8,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  paletteSwatch: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 6,
    width: 84,
  },
  paletteColors: {
    flexDirection: 'row',
    gap: 2,
  },
  paletteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  optionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  fontCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    minWidth: 110,
  },
  fontHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  submitBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
