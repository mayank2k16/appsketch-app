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

/**
 * Drag-and-drop reorder support.
 *
 * The web CMS's reorder feature (Vite `Containers/Cms/Categories`) is not a
 * single nested-tree DnD — it's N independent flat sortable lists, one per
 * sibling group (`cms-root-category`, one `cms-subcategory-<parentId>` per
 * parent). A row can only move among its own siblings; re-parenting is never
 * possible and the API never touches `parent`, only rank. These helpers are
 * the RN-side equivalent of that partition.
 */

export type FlatCategoryRow = {
  category: CategoryNode;
  depth: number;
  parentId: number | null;
  /** Port of react-dnd's drag `type` — rows only interact with others that
   * share the same groupKey, which is what keeps a drag inside its sibling
   * group. 'root' for top-level rows, `sub-<parentId>` otherwise. */
  groupKey: string;
  indexInGroup: number;
  groupSize: number;
  hasChildren: boolean;
  expanded: boolean;
};

/** Depth-first flatten of the visible rows only — recurses into
 * `sub_categories` exclusively when the parent is expanded, so a FlatList
 * built from this output virtualizes every visible row (unlike the current
 * recursive-render tree, which mounts every descendant of an expanded root
 * eagerly and virtualizes nothing below depth 0). */
export function flattenVisible(
  categories: CategoryNode[],
  expandedMap: Record<number, boolean>
): FlatCategoryRow[] {
  const rows: FlatCategoryRow[] = [];

  function walk(nodes: CategoryNode[], depth: number, parentId: number | null) {
    const groupKey = parentId === null ? 'root' : `sub-${parentId}`;
    nodes.forEach((category, indexInGroup) => {
      const hasChildren = (category.sub_categories?.length ?? 0) > 0;
      const expanded = !!expandedMap[category.id];
      rows.push({
        category,
        depth,
        parentId,
        groupKey,
        indexInGroup,
        groupSize: nodes.length,
        hasChildren,
        expanded,
      });
      if (hasChildren && expanded) {
        walk(category.sub_categories, depth + 1, category.id);
      }
    });
  }

  walk(categories, 0, null);
  return rows;
}

/** Move one element of `list` from `from` to `to`, without mutating it.
 * Direct port of the web's `moveItem` (Vite `Categories.jsx`). Exported so
 * flat, non-tree drag lists (e.g. a category's linked products) can reuse it
 * without going through `moveWithinParent`'s tree recursion. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Immutable recursive rewrite of the tree with one sibling group reordered.
 * `parentId === null` means the root array itself. Port of the web's
 * `moveCategory` + `moveSubCategory` (Vite `Categories.jsx:617-666`),
 * collapsed into one function since RN persists once on drop rather than
 * continuously on hover. */
export function moveWithinParent(
  tree: CategoryNode[],
  parentId: number | null,
  move: { from: number; to: number }
): CategoryNode[] {
  const { from, to } = move;
  if (from === to) return tree;

  if (parentId === null) {
    return moveItem(tree, from, to);
  }

  function apply(list: CategoryNode[]): CategoryNode[] {
    return list.map((cat) => {
      if (cat.id === parentId) {
        return { ...cat, sub_categories: moveItem(cat.sub_categories || [], from, to) };
      }
      if (cat.sub_categories?.length) {
        return { ...cat, sub_categories: apply(cat.sub_categories) };
      }
      return cat;
    });
  }

  return apply(tree);
}

/** Look up a node anywhere in the tree by id. Used to keep a "selected
 * category" reference live against the query cache — deriving it by id on
 * every render, instead of stashing the `CategoryNode` object itself in
 * state, is what makes edits (unlink a product, reorder, etc.) show up in an
 * open detail sheet immediately rather than only after it's reopened. */
export function findCategoryById(tree: CategoryNode[], id: number | null): CategoryNode | null {
  if (id === null) return null;
  for (const cat of tree) {
    if (cat.id === id) return cat;
    if (cat.sub_categories?.length) {
      const hit = findCategoryById(cat.sub_categories, id);
      if (hit) return hit;
    }
  }
  return null;
}

/** The ordered id list of one sibling group, as it currently stands in the
 * tree — what gets sent to `POST api/shop/categories/reorder/`. */
export function siblingIdsOf(tree: CategoryNode[], parentId: number | null): number[] {
  if (parentId === null) return tree.map((c) => c.id);
  const parent = findCategoryById(tree, parentId);
  return (parent?.sub_categories ?? []).map((c) => c.id);
}

/** Immutable rewrite of exactly one node in the tree (found by id) via an
 * updater function. Shared by every optimistic-update mutation that patches
 * a single category's fields in the query cache (reordering a category's
 * products, unlinking one, etc.), so that logic lives in one place. */
export function updateCategoryById(
  tree: CategoryNode[],
  id: number,
  updater: (category: CategoryNode) => CategoryNode
): CategoryNode[] {
  return tree.map((cat) => {
    if (cat.id === id) return updater(cat);
    if (cat.sub_categories?.length) {
      return { ...cat, sub_categories: updateCategoryById(cat.sub_categories, id, updater) };
    }
    return cat;
  });
}
