import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { fetchCodeTemplates, templateKeys } from '@/api/templates';
import { ALL_CATEGORIES } from '@/lib/category-route';

import type { TypeWord } from '../Home/Studio/recipes';
import { thumbOf } from '../Home/TemplateReel/layout';
import { buildDeal } from './deal';

/**
 * The category screen's data. It shares Home's one request for every
 * published template (react-query key `[...templateKeys.all, 'studio']`),
 * so coming from Home it renders from cache in the first frame. The fetch
 * below must stay identical to Home's (`Studio/use-studio.ts`), because both
 * write the same cache entry.
 */

export const STUDIO_KEY = [...templateKeys.all, 'studio'] as const;

async function fetchStudio(): Promise<MarketTemplate[]> {
  const page = await fetchCodeTemplates({ limit: 400, offset: 0 });
  return page.results
    .map((t) => ({ ...t, kind: 'code' as const, key: `code-${t.id}` }))
    .filter((t) => !!thumbOf(t));
}

export type CategoryInfo = {
  name: string;
  count: number;
  /** The first few templates' thumbnails, for the browse panel. */
  thumbs: string[];
};

const categoryOfT = (t: MarketTemplate) =>
  t.kind === 'code' ? t.category || null : null;

function categoriesOf(templates: MarketTemplate[]): CategoryInfo[] {
  const map = new Map<string, CategoryInfo>();
  for (const t of templates) {
    const c = categoryOfT(t);
    if (!c) continue;
    const info = map.get(c) ?? { name: c, count: 0, thumbs: [] };
    info.count++;
    if (info.thumbs.length < 3) info.thumbs.push(thumbOf(t));
    map.set(c, info);
  }
  const all: CategoryInfo = {
    name: ALL_CATEGORIES,
    count: templates.length,
    thumbs: templates.slice(0, 3).map(thumbOf),
  };
  return [all, ...[...map.values()].sort((a, b) => b.count - a.count)];
}

/** Every word of the query must appear in the title, description, tags or
 *  category. */
function matches(t: MarketTemplate, words: string[]) {
  if (!words.length) return true;
  const hay = [
    t.kind === 'code' ? t.title : t.name,
    t.description,
    ...(t.tags ?? []),
    categoryOfT(t),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}

const wordsOfQuery = (q: string) =>
  q.trim().toLowerCase().split(/\s+/).filter(Boolean);

function typeWords(categories: CategoryInfo[], current: string): TypeWord[] {
  return categories
    .filter((c) => c.name !== ALL_CATEGORIES && c.name !== current)
    .filter((c) => c.count > 1)
    .map((c) => ({ category: c.name, count: c.count }));
}

export function useCategoryData(category: string, query: string) {
  const q = useQuery({
    queryKey: STUDIO_KEY,
    queryFn: fetchStudio,
    staleTime: 5 * 60 * 1000,
  });
  const templates = React.useMemo(() => q.data ?? [], [q.data]);
  const categories = React.useMemo(() => categoriesOf(templates), [templates]);
  const inCategory = React.useMemo(
    () =>
      category === ALL_CATEGORIES
        ? templates
        : templates.filter((t) => categoryOfT(t) === category),
    [templates, category]
  );
  const deal = React.useMemo(() => {
    const words = wordsOfQuery(query);
    const list = inCategory.filter((t) => matches(t, words));
    // Type tiles (other categories) stay in a search too: a recipe's word
    // cell is never empty, and they are one tap to a sibling category.
    const types = typeWords(categories, category);
    return { ...buildDeal(list, types, `cat:${category}`), total: list.length };
  }, [inCategory, query, categories, category]);

  React.useEffect(() => {
    const urls = deal.order.slice(0, 16).map(thumbOf);
    if (urls.length) ExpoImage.prefetch(urls, 'memory-disk').catch(() => {});
  }, [deal]);

  return {
    isLoading: q.isLoading,
    isError: q.isError && !q.data,
    refetch: q.refetch,
    categories,
    known: categories.some((c) => c.name === category),
    categoryCount: inCategory.length,
    deal,
  };
}

export type CategoryData = ReturnType<typeof useCategoryData>;
