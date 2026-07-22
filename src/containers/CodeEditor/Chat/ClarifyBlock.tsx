import { Ionicons } from '@expo/vector-icons';
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
  ClarifyQuestion,
} from '@/api/coder';
import type { AppColors } from '@/lib/theme';

type Answers = Record<string, unknown>;

/** Renders the agent's design-brief clarify questionnaire (`ui_block.kind
 * === "clarify"`) — ported from Vite's `ClarifyBlock.jsx`. Supports the
 * question kinds the backend actually sends: choice / checklist (single vs
 * multi-select chips), palette (colour swatches), fonts (named options), and
 * a free-text fallback. Answers are collected locally and sent as one
 * `{"type":"interaction","value":{...}}` frame on submit. */
export function ClarifyBlockView({
  block,
  colors,
  onSubmit,
}: {
  block: ClarifyBlockType;
  colors: AppColors;
  onSubmit: (value: Answers) => void;
}) {
  const [answers, setAnswers] = React.useState<Answers>({});

  function toggleChoice(question: ClarifyQuestion, optionId: string) {
    setAnswers((prev) => {
      if (question.kind === 'checklist') {
        const current = new Set<string>((prev[question.id] as string[]) ?? []);
        if (current.has(optionId)) current.delete(optionId);
        else current.add(optionId);
        return { ...prev, [question.id]: Array.from(current) };
      }
      return { ...prev, [question.id]: optionId };
    });
  }

  function setText(question: ClarifyQuestion, value: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  function isSelected(question: ClarifyQuestion, optionId: string) {
    const val = answers[question.id];
    if (question.kind === 'checklist')
      return Array.isArray(val) && (val as string[]).includes(optionId);
    return val === optionId;
  }

  return (
    <View
      style={[
        st.card,
        {
          backgroundColor: colors.codeEditorSurface,
          borderColor: colors.codeEditorBorder,
        },
      ]}
    >
      {block.intro ? (
        <Text style={[st.intro, { color: colors.text }]}>{block.intro}</Text>
      ) : null}

      {block.questions.map((question, qi) => (
        <View key={question.id ?? `q-${qi}`} style={st.questionBlock}>
          <Text style={[st.label, { color: colors.textSub }]}>
            {question.label}
          </Text>

          {question.kind === 'text' ? (
            <TextInput
              value={(answers[question.id] as string) ?? ''}
              onChangeText={(v) => setText(question, v)}
              placeholder="Type your answer…"
              placeholderTextColor={colors.codeEditorTextMuted}
              style={[
                st.textInput,
                { color: colors.text, borderColor: colors.codeEditorBorder },
              ]}
            />
          ) : question.kind === 'palette' ? (
            <View style={st.optionRow}>
              {(question.options ?? []).map((opt, oi) => (
                <TouchableOpacity
                  key={opt.id ?? `${question.id ?? qi}-${oi}`}
                  onPress={() => toggleChoice(question, opt.id)}
                  style={[
                    st.paletteSwatch,
                    {
                      borderColor: isSelected(question, opt.id)
                        ? colors.accent
                        : colors.codeEditorBorder,
                    },
                  ]}
                >
                  <View style={st.paletteColors}>
                    {(opt.colors ?? [opt.value ?? '#888'])
                      .slice(0, 3)
                      .map((c, i) => (
                        <View
                          key={i}
                          style={[st.paletteDot, { backgroundColor: c }]}
                        />
                      ))}
                  </View>
                  <Text
                    style={[st.optionLabel, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={st.optionRow}>
              {(question.options ?? []).map((opt, oi) => {
                const selected = isSelected(question, opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id ?? `${question.id ?? qi}-${oi}`}
                    onPress={() => toggleChoice(question, opt.id)}
                    style={[
                      st.chip,
                      {
                        backgroundColor: selected
                          ? colors.accent
                          : colors.codeEditorTabBg,
                        borderColor: selected
                          ? colors.accent
                          : colors.codeEditorBorder,
                      },
                    ]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : null}
                    <Text
                      style={[
                        st.chipLabel,
                        { color: selected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={() => onSubmit(answers)}
        style={[st.submitBtn, { backgroundColor: colors.accent }]}
      >
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    width: 76,
  },
  paletteColors: {
    flexDirection: 'row',
    gap: 2,
  },
  paletteDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 10.5,
    fontWeight: '600',
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
