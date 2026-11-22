import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';

import { TemplateLimitSheet } from '@/containers/TemplateProduct/template-limit-sheet';
import { useTemplateLimit } from '@/containers/TemplateProduct/template-slot';
import { pageTheme } from '@/containers/TemplateProduct/theme';

/** The template allowance is used up: upgrade or delete an app, then the
 *  refused copy continues (template-slot.ts). */
export default function TemplateLimitRoute() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const t = pageTheme(colorScheme === 'dark');
  const allowance = useTemplateLimit((l) => l.allowance);
  React.useEffect(() => () => useTemplateLimit.getState().clear(), []);
  if (!allowance) return null;
  return (
    <TemplateLimitSheet
      initial={allowance}
      t={t}
      onClose={() => router.back()}
      onUpgrade={() => {
        router.dismissAll();
        // Straight to the plan the sheet offered (e.g. Growth), yearly.
        router.navigate({
          pathname: '/pricing',
          params: {
            plan: (allowance.next_tier ?? '').toLowerCase() || undefined,
            cycle: 'yearly',
          },
        } as never);
      }}
      onContinue={() => {
        const retry = useTemplateLimit.getState().retry;
        router.back();
        // After the sheet slides away, so the copy's loader shows on the page.
        if (retry) setTimeout(retry, 450);
      }}
    />
  );
}
