import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as React from 'react';

import {
  fetchCodeTemplates,
  type MarketTemplate,
  templateKeys,
} from '@/api/templates';
import {
  getPendingTemplate,
  type PendingTemplate,
} from '@/lib/template-transition';

import { hasHero } from './live-url';

type Pages = { pages?: { items?: MarketTemplate[] }[] };

/** The Home studio's list (every published template, display order). */
const STUDIO_KEY = [...templateKeys.all, 'studio'] as const;

/** Any template list already in the react-query cache (Home, Market…). */
function findInCache(
  client: QueryClient,
  key: string
): MarketTemplate | undefined {
  const studio = client.getQueryData<MarketTemplate[]>(STUDIO_KEY);
  const hit = Array.isArray(studio) && studio.find((t) => t?.key === key);
  if (hit) return hit;
  const all = client.getQueriesData<Pages>({ queryKey: templateKeys.all });
  for (const [, data] of all) {
    for (const page of data?.pages ?? []) {
      const found = page?.items?.find((t) => t?.key === key);
      if (found) return found;
    }
  }
  return undefined;
}

/** A cold open (deep link) without the studio list cached: the published
 *  apps list, in one request — it holds the template AND its swipe list. */
function useColdFetch(enabled: boolean) {
  return useQuery({
    queryKey: [...templateKeys.all, 'product-cold'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<MarketTemplate[]> => {
      const page = await fetchCodeTemplates({ limit: 400, offset: 0 });
      return page.results.map(
        (t) => ({ ...t, kind: 'code', key: `code-${t.id}` }) as MarketTemplate
      );
    },
  });
}

const categoryKey = (t: MarketTemplate) =>
  t.kind === 'code' ? t.category || null : null;

/** One category's run inside the swipe list. */
export type Group = { name: string | null; start: number; size: number };

/** Categories of `pool` by size, biggest first (Home's rail order). */
function railOrder(pool: readonly MarketTemplate[]) {
  const counts = new Map<string | null, number>();
  for (const t of pool) {
    const c = categoryKey(t);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  // Uncategorised ones last.
  return [...counts.entries()]
    .sort((a, b) => (a[0] === null ? 1 : b[0] === null ? -1 : b[1] - a[1]))
    .map(([c]) => c);
}

/**
 * The templates the page swipes through, and where it starts: the tapped
 * template's category first — in the tile's list order (else the studio
 * list's) — then every other category in Home's rail order (biggest
 * first), so swiping on never dead-ends. Only templates with a hero (a
 * live site, or an app's screenshot). `groups` marks each category's run,
 * for the counter ("3 / 7") and the breadcrumb.
 */
function swipeList(
  template: MarketTemplate,
  given: readonly MarketTemplate[] | undefined,
  pool: readonly MarketTemplate[] | undefined
) {
  const cat = categoryKey(template);
  const source = pool?.length ? pool : (given ?? []);
  const seen = new Set<string>();
  const list: MarketTemplate[] = [];
  const groups: Group[] = [];
  const take = (name: string | null, items: readonly MarketTemplate[]) => {
    const start = list.length;
    for (const t of items) {
      if (seen.has(t.key) || categoryKey(t) !== name) continue;
      if (t.key !== template.key && !hasHero(t)) continue;
      seen.add(t.key);
      list.push(t);
    }
    if (list.length > start)
      groups.push({ name, start, size: list.length - start });
  };
  const inGiven = (given ?? []).filter((t) => categoryKey(t) === cat);
  take(cat, inGiven.length ? [...inGiven, ...source] : source);
  for (const c of railOrder(source)) if (c !== cat) take(c, source);
  let start = list.findIndex((t) => t.key === template.key);
  if (start < 0) {
    list.unshift(template);
    if (groups[0]?.name === cat) groups[0].size += 1;
    else groups.unshift({ name: cat, start: 0, size: 1 });
    for (let i = 1; i < groups.length; i++) groups[i].start += 1;
    start = 0;
  }
  return { list, start, groups };
}

export type Resolved =
  | {
      state: 'ready';
      entry: PendingTemplate;
      fromTile: boolean;
      list: readonly MarketTemplate[];
      start: number;
      groups: readonly Group[];
    }
  | { state: 'loading' }
  | { state: 'missing' };

type Found = { entry: PendingTemplate; fromTile: boolean } | null;

/**
 * The page's template and its swipe list: the tile's pending entry
 * (synchronous — the first frame can already render the grow), else the
 * react-query cache, else one cold fetch. Everything is read ONCE, on
 * mount, so a background refetch cannot reshuffle the pages under a finger.
 */
export function useResolvedTemplate(key: string): Resolved {
  const client = useQueryClient();
  const [pending] = React.useState(() => getPendingTemplate(key));
  const [cached] = React.useState(() =>
    pending ? undefined : findInCache(client, key)
  );
  const [studio] = React.useState(() =>
    client.getQueryData<MarketTemplate[]>(STUDIO_KEY)
  );
  // A tile always opens with its list (or the studio is cached); only a
  // cold open fetches, and it waits for the list so the page count is
  // final before the first frame.
  const coldOn = !pending && !studio;
  const cold = useColdFetch(coldOn);
  const pool = studio ?? cold.data;
  const found = React.useMemo<Found>(() => {
    if (pending) return { entry: pending, fromTile: true };
    const t = cached ?? pool?.find((x) => x.key === key);
    if (!t) return null;
    return {
      entry: { template: t, rect: null, frame: 'phone' },
      fromTile: false,
    };
  }, [pending, cached, pool, key]);
  const waiting = coldOn && cold.isLoading;
  return React.useMemo<Resolved>(() => {
    if (waiting) return { state: 'loading' };
    if (!found) return { state: 'missing' };
    const { template } = found.entry;
    const { list, start, groups } = swipeList(template, pending?.list, pool);
    return { state: 'ready', ...found, list, start, groups };
  }, [waiting, found, pending, pool]);
}
