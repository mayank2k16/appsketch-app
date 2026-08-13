import * as React from 'react';

import { getCoderQuota } from '@/api/coder';
import { useAuth } from '@/hooks/useAuth';

/** The caller's allowed coder model ids, refetched whenever auth status
 * changes (e.g. signing in mid-session). Fails open — a fetch error or a
 * pending request both resolve to `null`, which the picker reads as "lock
 * nothing", so a quota-fetch hiccup can never wrongly block a user. */
export function useCoderQuota(): string[] | null {
  const status = useAuth.use.status();
  const [allowedModels, setAllowedModels] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getCoderQuota()
      .then((q) => {
        if (!cancelled) setAllowedModels(Array.isArray(q.models) ? q.models : null);
      })
      .catch(() => {
        if (!cancelled) setAllowedModels(null);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return allowedModels;
}
