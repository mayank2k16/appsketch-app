import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

import { useCustomiseHandoff } from '@/containers/TemplateProduct/customise-brief';
import { CustomiseSheet } from '@/containers/TemplateProduct/customise-sheet';
import { pageTheme } from '@/containers/TemplateProduct/theme';

/** "Customise with AI" form, a sheet over the template page. */
export default function CustomiseRoute() {
  const router = useRouter();
  const { key, name } = useLocalSearchParams<{ key: string; name?: string }>();
  const { colorScheme } = useColorScheme();
  const t = pageTheme(colorScheme === 'dark');
  return (
    <CustomiseSheet
      templateName={name ?? 'this template'}
      t={t}
      onClose={() => router.back()}
      onSubmit={(form) => {
        useCustomiseHandoff.getState().submit(String(key), form);
        router.back();
      }}
    />
  );
}
