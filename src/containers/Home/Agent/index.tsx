import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { KeyboardAvoidingView, LayoutChangeEvent, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { F } from '@/lib/fonts';
import { useAppTheme } from '@/lib/theme';

import { CipherField } from './CipherField';
import { PromptBar } from './PromptBar';

export function AgentScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);

  const [fieldSize, setFieldSize] = React.useState<{ width: number; height: number } | null>(null);

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setFieldSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={t.statusBar} />
      <View style={[s.field, { backgroundColor: t.bg }]} onLayout={handleLayout}>
        {fieldSize ? (
          <CipherField width={fieldSize.width} height={fieldSize.height} t={t} />
        ) : null}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.promptWrap}
          pointerEvents="box-none"
        >
          <PromptBar t={t} />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  title: {
    fontFamily: F.sans900,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  field: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 50,
  },
  promptWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
});

export default AgentScreen;
