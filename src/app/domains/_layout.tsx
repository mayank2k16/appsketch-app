import { Stack } from 'expo-router';
import * as React from 'react';

/** /domains, /domains/connect, /domains/[id] draw their own headers. */
export default function DomainsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
