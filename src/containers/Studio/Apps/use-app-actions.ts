import { useRouter } from 'expo-router';
import * as React from 'react';

import { useRunApp } from '@/containers/Marketplace/use-template-preview';

/** What View app / Edit need — a tenant from `account/tenants/` or an
 *  ecosystem member both fit. */
export type OwnedApp = {
  id: number | string;
  uuid?: string;
  title: string;
  app_type?: string;
};

export const isMobileApp = (app: OwnedApp) => app.app_type === 'mobile';

/**
 * The two things you do with your own app: see it running, or keep building.
 * View app runs a mobile app live (natively when it can, otherwise its web
 * render) and opens a website on the preview screen. Edit resumes the
 * builder chat — no prompt, so it restores the latest thread.
 */
export function useAppActions() {
  const router = useRouter();
  const { run, opening } = useRunApp();
  const [runningId, setRunningId] = React.useState<OwnedApp['id'] | null>(null);

  const view = React.useCallback(
    async (app: OwnedApp) => {
      const uuid = app.uuid || String(app.id);
      if (!isMobileApp(app)) {
        router.push({
          pathname: '/app-preview',
          params: { uuid, name: app.title },
        } as never);
        return;
      }
      setRunningId(app.id);
      try {
        await run({ uuid, title: app.title });
      } finally {
        setRunningId(null);
      }
    },
    [router, run]
  );

  const edit = React.useCallback(
    (app: OwnedApp) => {
      router.push({
        pathname: '/code-editor/chat',
        params: {
          tenantId: String(app.id),
          tenantUid: app.uuid || String(app.id),
          appType: isMobileApp(app) ? 'mobile' : 'web',
        },
      } as never);
    },
    [router]
  );

  return { view, edit, busyId: opening ? runningId : null };
}
