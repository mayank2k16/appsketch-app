import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { TemplateProductScreen } from '@/containers/TemplateProduct';

/** /template/<key> — the template product page. Open it from a tile with
 *  `openTemplate()` (src/lib/template-transition.ts) so it grows out of the
 *  tile; a plain push or deep link opens it without the grow. */
export default function TemplateRoute() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <TemplateProductScreen templateKey={String(key ?? '')} />;
}
