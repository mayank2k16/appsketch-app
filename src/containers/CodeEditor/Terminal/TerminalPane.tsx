import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCoderTheme } from '@/lib/theme';

import { useCodeEditor } from '../CodeEditorProvider';
import type { TerminalPhase } from '../hooks/useTerminalSocket';
import { useTerminalSocket } from '../hooks/useTerminalSocket';

/** Classifies a terminal line for colour-coding — ported verbatim from
 * Vite's `lineClass` (`Terminal.jsx`). */
function lineKind(line: string): 'cmd' | 'err' | 'ok' | 'warn' | 'info' | null {
  const s = (line || '').trim();
  if (!s) return null;
  if (/^\$|^project:|^[\w.-]+@[\w.-]+/.test(s)) return 'cmd';
  if (/(error|failed|✖|❌|ERR!|not found|cannot|exit\s+[1-9])/i.test(s))
    return 'err';
  if (/(✓|✅|success|compiled|complete|ready in|passed|deployed)/i.test(s))
    return 'ok';
  if (/(warn|⚠|deprecat)/i.test(s)) return 'warn';
  if (/^(added|removed|changed)\s+\d+\s+packages/i.test(s)) return 'info';
  return null;
}

/** Socket phase → what the header says and what the composer offers. Ported
 * from Vite's `SHELL_STATUS`: "connecting" is a claim the pane has to EARN.
 * It used to be the label for every non-open state, so a shell that never came
 * up — expired token, project not generated yet, host down — said "Connecting…"
 * forever with no way to tell those apart or do anything about it. */
const SHELL_STATUS: Record<
  TerminalPhase,
  { label: string; placeholder: string }
> = {
  connecting: { label: 'Connecting…', placeholder: 'connecting…' },
  open: {
    label: 'Shell connected',
    placeholder: 'run a command… (npm run dev, ls, node -v)',
  },
  retrying: {
    label: 'Reconnecting…',
    placeholder: 'reconnecting to the shell…',
  },
  offline: {
    label: 'Shell offline',
    placeholder: 'shell unavailable — tap reconnect',
  },
};

export function TerminalPane() {
  const { colorScheme } = useColorScheme();
  const t = useCoderTheme(colorScheme);
  const { params } = useCodeEditor();
  const { output, phase, connected, send, reconnect } = useTerminalSocket(
    params.tenantId
  );
  const status = SHELL_STATUS[phase];

  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, [output]);

  function handleSend() {
    const line = input.trim();
    if (!line) return;
    send(line);
    setInput('');
  }

  const lineColor = (kind: ReturnType<typeof lineKind>) => {
    switch (kind) {
      case 'cmd':
        return t.terminalCmd;
      case 'err':
        return t.terminalErr;
      case 'ok':
        return t.terminalOk;
      case 'warn':
        return t.terminalWarn;
      case 'info':
        return t.terminalInfo;
      default:
        return t.terminalText;
    }
  };

  const lines = (output || '$ ').split('\n');

  return (
    <View style={[st.root, { backgroundColor: t.terminalBg }]}>
      <View style={[st.head, { borderColor: t.codeEditorBorder }]}>
        <View
          style={[
            st.dot,
            {
              backgroundColor: connected
                ? t.codeEditorConnectedDot
                : t.codeEditorDisconnectedDot,
            },
          ]}
        />
        <Text style={{ color: t.textSub, fontSize: 11.5, fontWeight: '600' }}>
          {status.label}
        </Text>
        {phase === 'offline' ? (
          <TouchableOpacity onPress={reconnect} style={st.retryBtn}>
            <Text
              style={{
                color: t.codeEditorAccentText,
                fontSize: 11.5,
                fontWeight: '700',
              }}
            >
              Reconnect
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={st.body}
        >
          {lines.map((line, i) => (
            <Text
              key={i}
              style={[st.line, { color: lineColor(lineKind(line)) }]}
            >
              {line || ' '}
            </Text>
          ))}
        </ScrollView>

        <View
          style={[
            st.inputRow,
            {
              borderColor: t.terminalInputBorder,
              backgroundColor: t.terminalInputBg,
            },
          ]}
        >
          <Text style={[st.prompt, { color: t.terminalCmd }]}>$</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder={status.placeholder}
            placeholderTextColor={t.codeEditorTextMuted}
            editable={connected}
            autoCapitalize="none"
            autoCorrect={false}
            style={[st.input, { color: t.terminalText }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim()}
            style={st.sendBtn}
          >
            <Text
              style={{
                color: input.trim() ? t.terminalCmd : t.codeEditorTextMuted,
                fontWeight: '700',
                fontSize: 12.5,
              }}
            >
              Run
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  retryBtn: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2 },
  body: { padding: 12 },
  line: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 12,
    lineHeight: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prompt: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 13,
  },
  sendBtn: { paddingHorizontal: 6, paddingVertical: 6 },
});
