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

export type StudioCategory = {
  name: string;
  count: number;
  /** The category's first few screenshots (its type tile shows them). */
  thumbs: string[];
};

const TYPE_THUMBS = 3;

function categoriesOf(templates: MarketTemplate[]): StudioCategory[] {
  const by = new Map<string, StudioCategory>();
  for (const t of templates) {
    const c = t.kind === 'code' ? t.category : null;
    if (!c) continue;
    const cat = by.get(c) ?? { name: c, count: 0, thumbs: [] };
    cat.count += 1;
    if (cat.thumbs.length < TYPE_THUMBS) cat.thumbs.push(thumbOf(t));
    by.set(c, cat);
  }
  return [
    { name: ALL, count: templates.length, thumbs: [] },
    ...[...by.values()].sort((a, b) => b.count - a.count),
  ];
}

/** Category words for the type tiles: the biggest first, never the one on
 *  screen (tapping it would do nothing). */
function wordsFor(categories: StudioCategory[], current: string): TypeWord[] {
  return categories
    .filter((c) => c.name !== ALL && c.name !== current && c.count > 1)
    .map((c) => ({ category: c.name, count: c.count, thumbs: c.thumbs }));
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

  // Fetch the first screenfuls' screenshots to disk as soon as the list
  // lands. Disk only: each tile decodes its own downsized copy (Shot `fit`),
  // so a full-size copy in memory would only take room.
  React.useEffect(() => {
    const urls = feed.order.slice(0, 16).map(thumbOf);
    if (urls.length) ExpoImage.prefetch(urls, 'disk').catch(() => {});
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
