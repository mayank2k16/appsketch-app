import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';

import type { MarketTemplate } from '@/api/templates';
import { fetchCodeTemplates, templateKeys } from '@/api/templates';

import { thumbOf } from '../TemplateReel/layout';
import { buildFeed, type TypeWord } from './recipes';
import { resetRise } from './rows';

/**
 * The studio's data: every published template in one request (the gallery
 * holds a couple of hundred — one small JSON), its categories with counts,
 * the selected category, and that category's bento feed. The feed is built
 * whole (it is just data); the list virtualises what is actually rendered.
 */

const ALL = 'All';

async function fetchStudio(): Promise<MarketTemplate[]> {
  const page = await fetchCodeTemplates({ limit: 400, offset: 0 });
  return page.results
    .map((t) => ({ ...t, kind: 'code' as const, key: `code-${t.id}` }))
    .filter((t) => !!thumbOf(t));
}

export type StudioCategory = { name: string; count: number };

function categoriesOf(templates: MarketTemplate[]): StudioCategory[] {
  const counts = new Map<string, number>();
  for (const t of templates) {
    const c = t.kind === 'code' ? t.category : null;
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [
    { name: ALL, count: templates.length },
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  ];
}

/** Category words for the type tiles: the biggest first, never the one on
 *  screen (tapping it would do nothing). */
function wordsFor(categories: StudioCategory[], current: string): TypeWord[] {
  return categories
    .filter((c) => c.name !== ALL && c.name !== current && c.count > 1)
    .map((c) => ({ category: c.name, count: c.count }));
}

export function useStudio() {
  const q = useQuery({
    queryKey: [...templateKeys.all, 'studio'],
    queryFn: fetchStudio,
    staleTime: 5 * 60 * 1000,
  });
  const templates = React.useMemo(() => q.data ?? [], [q.data]);
  const categories = React.useMemo(() => categoriesOf(templates), [templates]);
  const [category, setCategoryState] = React.useState(ALL);

  const feed = React.useMemo(() => {
    const list =
      category === ALL
        ? templates
        : templates.filter((t) => t.kind === 'code' && t.category === category);
    return buildFeed(list, wordsFor(categories, category), category);
  }, [templates, categories, category]);

  const setCategory = React.useCallback((name: string) => {
    resetRise();
    setCategoryState(name);
  }, []);

  // Warm the first screenful's screenshots as soon as the list lands.
  React.useEffect(() => {
    const urls = feed.order.slice(0, 16).map(thumbOf);
    if (urls.length) ExpoImage.prefetch(urls, 'memory-disk').catch(() => {});
  }, [feed]);

  return {
    isLoading: q.isLoading,
    categories,
    category,
    setCategory,
    feed,
  };
}

export type StudioState = ReturnType<typeof useStudio>;
