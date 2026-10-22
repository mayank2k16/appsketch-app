import { useQuery } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as React from 'react';
import { create } from 'zustand';

import {
  fetchTemplateSocial,
  type MarketTemplate,
  setTemplateLike,
  templateKeys,
  type TemplateKind,
} from '@/api/templates';
import { haptic } from '@/lib/haptics';
import { getItem, setItem } from '@/lib/storage';

/**
 * Template likes, as on the web gallery (`/templates`, same endpoints:
 * `builder/gallery/social/` for every count in one request, and
 * `builder/gallery/<kind>/<id>/like/` to like or take a like back).
 *
 * Anyone can like, signed in or not: a signed-in account owns its likes;
 * otherwise the device sends a random id it made up the first time it
 * liked something (kept on the device, sent in the body, never a URL).
 * The server reports `liked` for an account only, so the device also keeps
 * the ids it has liked itself, and a heart is filled if either says so.
 *
 * A tap is optimistic: the heart and count change at once, the server's
 * answer then sets the real count, and a failure puts them back. If the
 * counts cannot be had at all, `useLike` answers null and tiles show no
 * heart — never a heart that does nothing.
 */

const VISITOR = 'gallery-visitor';
const LIKED = 'gallery-liked';

type Counts = { likes: number; liked: boolean };

type LikeStore = {
  /** Local changes over the fetched counts, by `kind:id`. */
  over: Record<string, Counts>;
  /** What was last asked for, by `kind:id` — a late answer to an older
   *  tap must not overwrite a newer one. */
  want: Record<string, boolean>;
  put: (name: string, c: Counts) => void;
  ask: (name: string, liked: boolean) => void;
};

const useLikeStore = create<LikeStore>((set) => ({
  over: {},
  want: {},
  put: (name, c) => set((s) => ({ over: { ...s.over, [name]: c } })),
  ask: (name, liked) => set((s) => ({ want: { ...s.want, [name]: liked } })),
}));

function visitorId() {
  const kept = getItem<string>(VISITOR);
  if (kept) return kept;
  const made = Crypto.randomUUID();
  setItem(VISITOR, made);
  return made;
}

function likedHere(): Set<string> {
  const kept = getItem<string[]>(LIKED);
  return new Set(Array.isArray(kept) ? kept : []);
}

function rememberHere(name: string, liked: boolean) {
  const s = likedHere();
  if (liked) s.add(name);
  else s.delete(name);
  setItem(LIKED, [...s]);
}

const kindOf = (t: MarketTemplate): TemplateKind =>
  t.kind === 'code' ? 'code' : 'layout';

const NONE: Counts = { likes: 0, liked: false };

/** All counts in one request; each heart subscribes to its OWN entry
 *  (`select`), so a refetch or one like re-renders one heart, not all. */
function useSocial(name: string) {
  return useQuery({
    queryKey: [...templateKeys.all, 'social'],
    queryFn: async () => {
      const data = await fetchTemplateSocial();
      const here = likedHere();
      const all: Record<string, Counts> = {};
      (['layout', 'code'] as const).forEach((kind) => {
        Object.entries(data[kind]).forEach(([id, c]) => {
          const name = `${kind}:${id}`;
          all[name] = {
            likes: Number(c?.likes) || 0,
            liked: Boolean(c?.liked) || here.has(name),
          };
        });
      });
      return all;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    select: React.useCallback(
      (all: Record<string, Counts>) => all[name] ?? NONE,
      [name]
    ),
  });
}

async function send(t: MarketTemplate, name: string, liked: boolean) {
  const { put, ask } = useLikeStore.getState();
  ask(name, liked);
  try {
    const res = await setTemplateLike({
      kind: kindOf(t),
      id: t.id,
      liked,
      visitor: visitorId(),
    });
    if (useLikeStore.getState().want[name] !== liked) return;
    rememberHere(name, res.liked);
    put(name, { likes: Number(res.likes) || 0, liked: !!res.liked });
    return true;
  } catch {
    return false;
  }
}

export type Like = { likes: number; liked: boolean; toggle: () => void };

/** The template's heart, or null when counts are unavailable. */
export function useLike(t: MarketTemplate): Like | null {
  const name = `${kindOf(t)}:${t.id}`;
  const fetched = useSocial(name).data;
  const local = useLikeStore((s) => s.over[name]);
  const now = local ?? fetched ?? null;
  const put = useLikeStore((s) => s.put);
  const toggle = React.useCallback(() => {
    if (!now) return;
    const before = now;
    const liked = !before.liked;
    const likes = Math.max(0, before.likes + (liked ? 1 : -1));
    put(name, { likes, liked });
    if (liked) haptic.toggle(true);
    send(t, name, liked).then((ok) => {
      if (ok === false && useLikeStore.getState().want[name] === liked) {
        put(name, before);
      }
    });
  }, [now, put, name, t]);
  return React.useMemo(
    () => (now ? { likes: now.likes, liked: now.liked, toggle } : null),
    [now, toggle]
  );
}

/** 950 → "950", 1234 → "1.2k", 12500 → "12.5k". */
export function formatLikes(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}
