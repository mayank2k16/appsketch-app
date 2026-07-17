import type { CategoryNode } from '@/api/categories';

/** Shallow top-level-only name filter — matches Vite's `Categories.jsx`
 * exactly (`categories.filter(item => item.name.includes(query))`, ≥3
 * chars). It does not recurse into subcategories: a top-level category
 * whose own name doesn't match is hidden even if one of its subcategories
 * would match. Porting that limitation as-is rather than "fixing" it, since
 * it wasn't flagged as broken/unreachable — just simple. */
export function filterTopLevelCategories(categories: CategoryNode[], query: string): CategoryNode[] {
  if (query.trim().length < 3) return categories;
  const q = query.toLowerCase();
  return categories.filter((item) => item.name.toLowerCase().includes(q));
}
