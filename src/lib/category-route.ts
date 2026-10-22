import type { useRouter } from 'expo-router';

/**
 * The template category screen (`/category/[name]`, see
 * docs/template-category-screen.md). `name` is the category exactly as the
 * templates API spells it ("Fashion & Apparel"); expo-router URL-encodes it.
 * `ALL_CATEGORIES` opens every template.
 */
type Router = ReturnType<typeof useRouter>;

export const ALL_CATEGORIES = 'All';

/** Pushes the category screen (Home stays under it, so back returns there). */
export function openCategory(router: Router, name: string) {
  router.push({
    pathname: '/category/[name]',
    params: { name: name || ALL_CATEGORIES },
  } as never);
}
