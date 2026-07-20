import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CmsThemeColors } from '../../theme';

type Props = {
  colors: CmsThemeColors;
  content: string;
  textColor: string;
};

type InlineToken = { type: 'text' | 'bold' | 'code'; value: string };

/** Reimplementation of Vite's `renderRich.js` — that version builds an HTML
 * string for `dangerouslySetInnerHTML`, which doesn't exist in RN. Same
 * parsing rules (bold, inline code, GFM pipe tables, line breaks), real
 * `Text`/`View` output instead. */
function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    const raw = match[0];
    if (raw.startsWith('**')) tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    else tokens.push({ type: 'code', value: raw.slice(1, -1) });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', value: text.slice(lastIndex) });
  return tokens;
}

function InlineSpans({ text, textColor }: { text: string; textColor: string }) {
  const tokens = parseInline(text);
  return (
    <>
      {tokens.map((t, i) => {
        if (t.type === 'bold') {
          return (
            <Text key={i} style={[st.bold, { color: textColor }]}>
              {t.value}
            </Text>
          );
        }
        if (t.type === 'code') {
          return (
            <Text key={i} style={st.code}>
              {t.value}
            </Text>
          );
        }
        return (
          <Text key={i} style={{ color: textColor }}>
            {t.value}
          </Text>
        );
      })}
    </>
  );
}

const isTableSep = (line: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

export function AiRichText({ colors, content, textColor }: Props) {
  const lines = String(content || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        body.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <View key={key++} style={[st.table, { borderColor: colors.border }]}>
          <View style={[st.tableRow, st.tableHeaderRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {header.map((h, c) => (
              <Text key={c} style={[st.tableCell, st.tableHeaderCell, { color: colors.textPrimary }]}>
                {h}
              </Text>
            ))}
          </View>
          {body.map((row, r) => (
            <View key={r} style={[st.tableRow, { borderColor: colors.border }]}>
              {header.map((_, c) => (
                <Text key={c} style={[st.tableCell, { color: textColor }]}>
                  {row[c] || ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
      continue;
    }

    blocks.push(
      <Text key={key++} style={st.line}>
        <InlineSpans text={line} textColor={textColor} />
      </Text>
    );
    i += 1;
  }

  return <View style={st.root}>{blocks}</View>;
}

const st = StyleSheet.create({
  root: { gap: 2 },
  line: { fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '800' },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#00000014',
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 13,
  },
  table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginVertical: 4 },
  tableRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tableHeaderRow: { borderTopWidth: 0 },
  tableCell: { flex: 1, fontSize: 12.5, padding: 6 },
  tableHeaderCell: { fontWeight: '800' },
});
