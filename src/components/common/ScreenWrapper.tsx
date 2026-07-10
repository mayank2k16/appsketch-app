// /components/common/ScreenWrapper.tsx
import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { CommonHeader } from './CommonHeader';
import { useTenant } from '@/lib/tenant';

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode | boolean; // pass false to hide header, true (or undefined) shows default header
  headerProps?: any; // forwarded to CommonHeader
};

export function ScreenWrapper({ children, header = true, headerProps }: Props) {
  const { tenantConfig } = useTenant();
  const primaryColor = tenantConfig?.theme?.colors?.primary ?? '#111';

  const showHeader = header !== false;

  return (
    <SafeAreaView style={styles.safe}>
      {showHeader && (
        typeof header === 'object' ? header : <CommonHeader primaryColor={primaryColor} {...headerProps} />
      )}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
});
