import * as React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CmsInput } from '../../components';
import type { CmsThemeColors } from '../../theme';

// Native-only, same as `ManageEmailTemplateModal`'s Preview tab — RN Web has
// no `react-native-webview` implementation, so this guards the import and
// falls back to a raw-text view there instead of crashing.
let WebView: React.ComponentType<{ source: { html: string }; style?: object }> | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
}

type Props = {
  colors: CmsThemeColors;
  value: string;
  onChange: (value: string) => void;
};

export function CustomHtmlField({ colors, value, onChange }: Props) {
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');

  return (
    <View style={{ gap: 10 }}>
      <View style={[st.modeRow, { borderColor: colors.border }]}>
        {(['edit', 'preview'] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[st.modeTab, active && { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: active ? colors.accentText : colors.textSecondary, fontSize: 12.5, fontWeight: '700' }}>
                {m === 'edit' ? 'Edit Code' : 'Preview'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'edit' ? (
        <CmsInput
          colors={colors}
          placeholder="Enter custom HTML and CSS here… (e.g. <style>...</style> <div>...</div>)"
          value={value}
          onChangeText={onChange}
          multiline
          numberOfLines={10}
        />
      ) : (
        <View style={[st.previewBox, { borderColor: colors.border }]}>
          {WebView ? (
            <WebView source={{ html: value || '<p style="color:#999">Nothing to preview yet.</p>' }} style={{ flex: 1 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                Live preview renders on the mobile app — showing raw source here.
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: 'monospace', fontSize: 12 }}>
                {value || 'Nothing to preview yet.'}
              </Text>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  modeRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  modeTab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  previewBox: { height: 300, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
});
