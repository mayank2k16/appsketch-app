import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { TemplateCategoryScreen } from '@/containers/TemplateCategory';
import { ALL_CATEGORIES } from '@/lib/category-route';

/** /category/<name> — every template in one category (or "All"), as Home's
 *  bento. Open it with `openCategory()` (src/lib/category-route.ts). */
export default function CategoryRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const value = Array.isArray(name) ? name[0] : name;
  return <TemplateCategoryScreen name={String(value || ALL_CATEGORIES)} />;
}
