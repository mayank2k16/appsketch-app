import * as React from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader, useServicesTheme } from '@/components/services';

import { DomainsList } from './domains-list';

/** /domains — every domain I bought or connected. */
export function DomainsScreen() {
  const { t, s } = useServicesTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.root, { backgroundColor: s.canvas }]}>
      <StatusBar barStyle={t.statusBar} />
      <ScreenHeader s={s} title="Domains" />
      <ScrollView
        contentContainerStyle={[st.body, { paddingBottom: insets.bottom + 30 }]}
      >
        <DomainsList s={s} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 12 },
});
