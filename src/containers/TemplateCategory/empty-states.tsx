import * as React from 'react';

import { ALL_CATEGORIES } from '@/lib/category-route';

import { EmptyState } from './empty-state';
import type { CatColors } from './theme';
import type { CategoryData } from './use-category-data';

/** Which stop the list shows when it has no rows (null while loading). */

type Actions = {
  setQuery: (q: string) => void;
  setCategory: (name: string) => void;
  back: () => void;
};

type Props = {
  c: CatColors;
  data: CategoryData;
  category: string;
  query: string;
  actions: Actions;
};

export const CategoryEmpty = React.memo(function CategoryEmpty({
  c,
  data,
  category,
  query,
  actions,
}: Props) {
  if (data.isLoading) return null;
  if (data.isError) {
    return (
      <EmptyState
        c={c}
        icon="cloud-offline-outline"
        title="Couldn’t load templates"
        body="Check your connection and try again."
        primary={{ label: 'Try again', onPress: () => data.refetch() }}
        secondary={{ label: 'Go back', onPress: actions.back }}
      />
    );
  }
  const seeAll = {
    label: 'See all templates',
    onPress: () => actions.setCategory(ALL_CATEGORIES),
  };
  if (!data.known) {
    return (
      <EmptyState
        c={c}
        icon="albums-outline"
        title={`No “${category}” templates yet`}
        body="Browse every template, or pick another category above."
        primary={seeAll}
      />
    );
  }
  const q = query.trim();
  const inAll = category === ALL_CATEGORIES;
  return (
    <EmptyState
      c={c}
      icon="search-outline"
      title={`No matches for “${q}”`}
      body={
        inAll
          ? 'Try another word, like a business type or a style.'
          : `Nothing in ${category} matches that. Try another word.`
      }
      primary={{ label: 'Clear search', onPress: () => actions.setQuery('') }}
      secondary={
        inAll
          ? undefined
          : { label: 'Search all categories', onPress: seeAll.onPress }
      }
    />
  );
});
