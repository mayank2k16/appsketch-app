import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  ClarifyBlock as ClarifyBlockType,
  ClarifyFontOption,
  ClarifyPaletteOption,
  ClarifyQuestion,
} from '@/api/coder';
import type { AppColors } from '@/lib/theme';

/** Small branded avatar shared by every agent-side card header (message
 * bubble, activity card, clarify card) so the whole chat reads as one
 * consistent visual language. */
function AgentAvatar({ colors }: { colors: AppColors }) {
  return (
    <LinearGradient
      colors={[colors.codeEditorUserBubbleFrom, colors.codeEditorUserBubbleTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={st.avatar}
    >
      <Ionicons name="sparkles" size={11} color="#FFFFFF" />
    </LinearGradient>
  );
}

type Selected = string | ClarifyPaletteOption | ClarifyFontOption | undefined;

function isPaletteOption(v: unknown): v is ClarifyPaletteOption {
  return (
    !!v && typeof v === 'object' && 'colors' in (v as Record<string, unknown>)
  );
}
function isFontOption(v: unknown): v is ClarifyFontOption {
  return (
    !!v && typeof v === 'object' && 'heading' in (v as Record<string, unknown>)
  );
}

function paletteLabel(p: ClarifyPaletteOption): string {
  return `${p.name} — ${p.colors.join(', ')}`;
}
function fontLabel(f: ClarifyFontOption): string {
  return `${f.heading} / ${f.body}`;
}


export function ClarifyBlockView({
  block,
  colors,
  onSubmit,
  answers,
}: {
  block: ClarifyBlockType;
  colors: AppColors;
  onSubmit: (value: Record<string, string>) => void;
  answers?: Record<string, string> | null;
}) {
  const locked = !!answers;
  const questions = block.questions ?? [];

  const [sel, setSel] = React.useState<Record<string, Selected>>({});
  const [checks, setChecks] = React.useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    questions.forEach((q) => {
      if (
        q.type === 'checklist' &&
        Array.isArray(q.preselect) &&
        q.preselect.length
      ) {
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
      return {
        ...c,
        [id]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt],
      };
    });
  }

  function valueFor(q: ClarifyQuestion): string {
    const c = (custom[q.id] ?? '').trim();
    if (q.type === 'checklist') {
      const extra = c
        ? c
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : [];
      return [...(checks[q.id] ?? []), ...extra].join(', ');
    }
    if (c) return c;
    const v = sel[q.id];
    if (v == null) {
      const first = (
        q.options as
        | (string | ClarifyPaletteOption | ClarifyFontOption)[]
        | undefined
      )?.[0];
      if (q.type === 'palette')
        return isPaletteOption(first) ? paletteLabel(first) : '';
      if (q.type === 'fonts')
        return isFontOption(first) ? fontLabel(first) : '';
      return (first as string) ?? '';
    }
    if (isPaletteOption(v)) return paletteLabel(v);
    if (isFontOption(v)) return fontLabel(v);
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
    <View style={[st.card, { borderColor: colors.codeEditorBorder }]}>
      <View
        style={[st.header, { backgroundColor: colors.codeEditorActivityBg }]}
      >
        <AgentAvatar colors={colors} />
        <Text style={[st.headerName, { color: colors.text }]}>Agent</Text>
        <View style={{ flex: 1 }} />
        <View
          style={[
            st.badge,
            {
              backgroundColor: colors.codeEditorToolChipActiveBg,
              borderColor: colors.codeEditorToolChipActiveBorder,
            },
          ]}
        >
          <Ionicons
            name="color-palette"
            size={9}
            color={colors.codeEditorToolChipActiveText}
          />
          <Text
            style={[st.badgeText, { color: colors.codeEditorToolChipActiveText }]}
          >
            Design Brief
          </Text>
        </View>
      </View>

      <View
        style={[st.body, { backgroundColor: colors.codeEditorChatAssistantBg }]}
      >
        {block.intro ? (
          <Text style={[st.intro, { color: colors.text }]}>{block.intro}</Text>
        ) : null}

        {questions.map((q) => {
          const answer = answers?.[q.id];
          return (
            <View key={q.id} style={st.questionBlock}>
              <Text style={[st.label, { color: colors.textSub }]}>{q.label}</Text>

              {q.type === 'palette' ? (
                <PaletteOptions
                  q={q}
                  sel={sel[q.id]}
                  locked={locked}
                  answer={answer}
                  colors={colors}
                  onPick={(p) => pick(q.id, p)}
                />
              ) : q.type === 'fonts' ? (
                <FontOptions
                  q={q}
                  sel={sel[q.id]}
                  locked={locked}
                  answer={answer}
                  colors={colors}
                  onPick={(f) => pick(q.id, f)}
                />
              ) : q.type === 'checklist' ? (
                <ChecklistOptions
                  q={q}
                  checked={checks[q.id] ?? []}
                  locked={locked}
                  answer={answer}
                  colors={colors}
                  onToggle={(opt) => toggleCheck(q.id, opt)}
                />
              ) : q.type === 'choice' ? (
                <ChoiceOptions
                  q={q}
                  sel={sel[q.id]}
                  locked={locked}
                  answer={answer}
                  colors={colors}
                  onPick={(opt) => pick(q.id, opt)}
                />
              ) : null}

              {!locked && q.allowCustom !== false ? (
                <TextInput
                  value={custom[q.id] ?? ''}
                  onChangeText={(v) => setText(q.id, v)}
                  placeholder={
                    q.type === 'checklist'
                      ? 'add your own (comma separated)…'
                      : 'or type your own…'
                  }
                  placeholderTextColor={colors.codeEditorTextMuted}
                  style={[
                    st.textInput,
                    { color: colors.text, borderColor: colors.codeEditorBorder },
                  ]}
                />
              ) : null}
            </View>
          );
        })}

        {!locked ? (
          <TouchableOpacity
            onPress={submit}
            style={[st.submitBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={st.submitLabel}>{block.submitLabel ?? 'Continue'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function PaletteOptions({
  q,
  sel,
  locked,
  answer,
  colors,
  onPick,
}: {
  q: ClarifyQuestion;
  sel: Selected;
  locked: boolean;
  answer: string | undefined;
  colors: AppColors;
  onPick: (p: ClarifyPaletteOption) => void;
}) {
  const options = (q.options as ClarifyPaletteOption[] | undefined) ?? [];
  const anyMatch = locked && options.some((p) => paletteLabel(p) === answer);

  return (
    <View style={st.optionRow} pointerEvents={locked ? 'none' : 'auto'}>
      {options.map((p) => {
        const label = paletteLabel(p);
        const selected = locked
          ? label === answer
          : isPaletteOption(sel) && sel.name === p.name;
        return (
          <TouchableOpacity
            key={p.name}
            disabled={locked}
            onPress={() => onPick(p)}
            style={[
              st.paletteSwatch,
              {
                borderColor: selected ? colors.accent : colors.codeEditorBorder,
              },
              locked && !selected ? st.dimmed : null,
            ]}
          >
            <View style={st.paletteColors}>
              {p.colors.slice(0, 4).map((c, i) => (
                <View
                  key={`${c}-${i}`}
                  style={[st.paletteDot, { backgroundColor: c }]}
                />
              ))}
            </View>
            <Text
              style={[st.optionLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              {p.name}
            </Text>
            {selected ? <CheckBadge colors={colors} /> : null}
          </TouchableOpacity>
        );
      })}
      {locked && !anyMatch && answer ? (
        <LockedCustomAnswer answer={answer} colors={colors} />
      ) : null}
    </View>
  );
}

function FontOptions({
  q,
  sel,
  locked,
  answer,
  colors,
  onPick,
}: {
  q: ClarifyQuestion;
  sel: Selected;
  locked: boolean;
  answer: string | undefined;
  colors: AppColors;
  onPick: (f: ClarifyFontOption) => void;
}) {
  const options = (q.options as ClarifyFontOption[] | undefined) ?? [];
  const anyMatch = locked && options.some((f) => fontLabel(f) === answer);

  return (
    <View style={st.optionRow} pointerEvents={locked ? 'none' : 'auto'}>
      {options.map((f) => {
        const label = fontLabel(f);
        const selected = locked
          ? label === answer
          : isFontOption(sel) && sel.name === f.name;
        return (
          <TouchableOpacity
            key={f.name}
            disabled={locked}
            onPress={() => onPick(f)}
            style={[
              st.fontCard,
              {
                borderColor: selected ? colors.accent : colors.codeEditorBorder,
              },
              locked && !selected ? st.dimmed : null,
            ]}
          >
            <Text
              style={[st.fontHeading, { color: colors.text }]}
              numberOfLines={1}
            >
              {f.heading}
            </Text>
            <Text
              style={{ color: colors.textSub, fontSize: 10.5 }}
              numberOfLines={1}
            >
              {f.body}
            </Text>
            {selected ? <CheckBadge colors={colors} /> : null}
          </TouchableOpacity>
        );
      })}
      {locked && !anyMatch && answer ? (
        <LockedCustomAnswer answer={answer} colors={colors} />
      ) : null}
    </View>
  );
}

function ChecklistOptions({
  q,
  checked,
  locked,
  answer,
  colors,
  onToggle,
}: {
  q: ClarifyQuestion;
  checked: string[];
  locked: boolean;
  answer: string | undefined;
  colors: AppColors;
  onToggle: (opt: string) => void;
}) {
  const options = (q.options as string[] | undefined) ?? [];
  const lockedPicked = locked
    ? (answer ?? '').split(',').map((s) => s.trim())
    : [];

  return (
    <View style={st.optionRow} pointerEvents={locked ? 'none' : 'auto'}>
      {options.map((opt) => {
        const on = locked ? lockedPicked.includes(opt) : checked.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            disabled={locked}
            onPress={() => onToggle(opt)}
            style={[
              st.chip,
              {
                backgroundColor: on ? colors.accent : colors.codeEditorTabBg,
                borderColor: on ? colors.accent : colors.codeEditorBorder,
              },
              locked && !on ? st.dimmed : null,
            ]}
          >
            <Text
              style={[st.chipLabel, { color: on ? '#FFFFFF' : colors.text }]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ChoiceOptions({
  q,
  sel,
  locked,
  answer,
  colors,
  onPick,
}: {
  q: ClarifyQuestion;
  sel: Selected;
  locked: boolean;
  answer: string | undefined;
  colors: AppColors;
  onPick: (opt: string) => void;
}) {
  const options = (q.options as string[] | undefined) ?? [];
  const anyMatch = locked && options.includes(answer ?? '');

  return (
    <View style={st.optionRow} pointerEvents={locked ? 'none' : 'auto'}>
      {options.map((opt) => {
        const selected = locked ? opt === answer : sel === opt;
        return (
          <TouchableOpacity
            key={opt}
            disabled={locked}
            onPress={() => onPick(opt)}
            style={[
              st.chip,
              {
                backgroundColor: selected
                  ? colors.accent
                  : colors.codeEditorTabBg,
                borderColor: selected ? colors.accent : colors.codeEditorBorder,
              },
              locked && !selected ? st.dimmed : null,
            ]}
          >
            <Text
              style={[
                st.chipLabel,
                { color: selected ? '#FFFFFF' : colors.text },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
      {locked && !anyMatch && answer ? (
        <LockedCustomAnswer answer={answer} colors={colors} />
      ) : null}
    </View>
  );
}

/** A submitted answer that doesn't match any predefined option — the
 * respondent typed their own. Shown as plain locked text alongside the
 * (all-dimmed) options instead of silently dropping it. */
function LockedCustomAnswer({
  answer,
  colors,
}: {
  answer: string;
  colors: AppColors;
}) {
  return (
    <View
      style={[
        st.chip,
        { backgroundColor: colors.accentSoft, borderColor: colors.accent },
      ]}
    >
      <Text style={[st.chipLabel, { color: colors.accent }]}>{answer}</Text>
    </View>
  );
}

function CheckBadge({ colors }: { colors: AppColors }) {
  return (
    <View style={[st.checkBadge, { backgroundColor: colors.accent }]}>
      <Text style={st.checkBadgeText}>✓</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 14,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  headerName: {
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  body: {
    padding: 14,
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
  dimmed: {
    opacity: 0.42,
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
    position: 'relative',
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
    position: 'relative',
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
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
