import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { TokenUsage } from '@/api/coder';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

/** `mm:ss` while there is more than a minute left, plain seconds after that —
 * "0:07" reads as a stopwatch, "7s" reads as "nearly there". */
function fmtRemaining(secs: number): string {
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return `${secs}s`;
}

/** Live "tokens this turn" meter — sits between the message list and the
 * composer, matching the web workspace's `.cw-meter` position exactly.
 * Resets to 0/0 on every new user message ( see `useCoderSocket.send`).
 *
 * It also carries the two things the web meter row carries: the ETA for the
 * turn in flight, and the button that detaches the run. Both live here rather
 * than in the composer because this row is the one place that is already about
 * "what this turn is costing you" — time is the other axis of that.
 */
export function TokenMeter({
  tokens,
  colors,
  eta,
  busy = false,
  backgroundRun = false,
  onBackground,
}: {
  tokens: TokenUsage;
  colors: AppColors;
  /** Backend forecast: `seconds` remaining as of `at` (a local timestamp). */
  eta?: { seconds: number; at: number } | null;
  busy?: boolean;
  backgroundRun?: boolean;
  /** Absent ⇒ no background button (nothing to detach). */
  onBackground?: () => void;
}) {
  // One interval for the whole row, only while a turn is live — a countdown
  // that keeps ticking after `final` would keep re-rendering the chat forever.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!busy || !eta) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [busy, eta]);

  const remaining = eta
    ? Math.max(0, eta.seconds - Math.floor((now - eta.at) / 1000))
    : null;

  const savedTokens = tokens.cached ? Math.round(tokens.cached * 0.75) : 0;
  const showTokens = tokens.in !== 0 || tokens.out !== 0;
  const showEta = busy && remaining !== null;
  const showBackground = busy && !!onBackground;

  if (!showTokens && !showEta && !showBackground && !backgroundRun) return null;

  return (
    <View style={[st.row, { borderColor: colors.border }]}>
      {showTokens ? (
        <>
          <View
            style={[st.chip, { backgroundColor: colors.codeEditorActivityBg }]}
          >
            <Text style={[st.chipText, { color: colors.codeEditorTokenIn }]}>
              ↑ {tokens.in.toLocaleString()}
            </Text>
          </View>
          <View
            style={[st.chip, { backgroundColor: colors.codeEditorActivityBg }]}
          >
            <Text style={[st.chipText, { color: colors.codeEditorTokenOut }]}>
              ↓ {tokens.out.toLocaleString()}
            </Text>
          </View>
        </>
      ) : null}

      {showEta ? (
        <View
          style={[
            st.chip,
            st.etaChip,
            { backgroundColor: colors.codeEditorActivityBg },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={11}
            color={colors.codeEditorTextMuted}
          />
          <Text style={[st.chipText, { color: colors.codeEditorTextMuted }]}>
            {/* 0 doesn't mean "done" — the forecast was just optimistic, and
             * claiming "0s" while it is still working is worse than admitting
             * we no longer know. */}
            {remaining && remaining > 0
              ? fmtRemaining(remaining)
              : 'almost done'}
          </Text>
        </View>
      ) : null}

      {savedTokens > 0 ? (
        <View
          style={[st.chip, { backgroundColor: colors.codeEditorTokenCachedBg }]}
        >
          <Text
            style={[st.chipText, { color: colors.codeEditorTokenCachedText }]}
          >
            ⚡ {savedTokens.toLocaleString()} saved
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />

      {backgroundRun ? (
        <View
          style={[
            st.chip,
            st.etaChip,
            {
              backgroundColor: colors.codeEditorToolChipActiveBg,
            },
          ]}
        >
          <Ionicons
            name="cloud-done-outline"
            size={12}
            color={colors.codeEditorToolChipActiveText}
          />
          <Text
            style={[
              st.chipText,
              { color: colors.codeEditorToolChipActiveText },
            ]}
          >
            Running in background
          </Text>
        </View>
      ) : showBackground ? (
        <TouchableOpacity
          onPress={onBackground}
          activeOpacity={0.75}
          hitSlop={6}
          style={[
            st.chip,
            st.etaChip,
            {
              backgroundColor: colors.codeEditorTabBg,
              borderWidth: 1,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={12}
            color={colors.textSub}
          />
          <Text style={[st.chipText, { color: colors.textSub }]}>
            Background
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontFamily: F.sans600,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
