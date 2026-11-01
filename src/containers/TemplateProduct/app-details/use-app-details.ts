import { useQuery } from '@tanstack/react-query';

import {
  fetchTemplateComments,
  fetchTemplateDetail,
  fetchTemplateReviews,
  templateKeys,
} from '@/api/templates';

const STALE = 2 * 60 * 1000;

/** The product page's details for one published app: the detail payload,
 *  its reviews and its comments. Only fetched once the page is near. */
export function useAppDetails(id: number, uuid: string, enabled: boolean) {
  const detail = useQuery({
    queryKey: [...templateKeys.all, 'detail', uuid],
    queryFn: () => fetchTemplateDetail(uuid),
    enabled: enabled && !!uuid,
    staleTime: STALE,
  });
  const reviews = useQuery({
    queryKey: [...templateKeys.all, 'reviews', id],
    queryFn: () => fetchTemplateReviews('code', id),
    enabled: enabled && !!id,
    staleTime: STALE,
  });
  const comments = useQuery({
    queryKey: [...templateKeys.all, 'comments', id],
    queryFn: () => fetchTemplateComments('code', id),
    enabled: enabled && !!id,
    staleTime: STALE,
  });
  return {
    detail: detail.data,
    reviews: reviews.data ?? [],
    comments: comments.data ?? [],
    loading: detail.isLoading,
  };
}
