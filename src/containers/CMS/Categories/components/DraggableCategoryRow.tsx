import * as React from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { CategoryNode } from '@/api/categories';

import type { CmsThemeColors } from '../../theme';
import type { FlatCategoryRow } from '../utils';
import { CATEGORY_ROW_HEIGHT, CategoryTreeRow } from './CategoryTreeRow';
import { DraggableRow } from './DraggableRow';

type Props = {
  colors: CmsThemeColors;
  row: FlatCategoryRow;
  /** Off while a search filter narrows the visible list — reordering a
   * filtered subset would renumber it and push hidden siblings to the back
   * (ported from the web's `reorderEnabled = debouncedQuery.length < 3`). */
  reorderEnabled: boolean;
  onToggle: (id: number) => void;
  onSelect: (category: CategoryNode) => void;
  activeGroup: SharedValue<string>;
  dragY: SharedValue<number>;
  fromIndex: SharedValue<number>;
  toIndex: SharedValue<number>;
  onDragStart: (row: FlatCategoryRow) => void;
  onDragEnd: (row: FlatCategoryRow, from: number, to: number) => void;
};

export function DraggableCategoryRow({
  colors,
  row,
  reorderEnabled,
  onToggle,
  onSelect,
  activeGroup,
  dragY,
  fromIndex,
  toIndex,
  onDragStart,
  onDragEnd,
}: Props) {
  const handleDragStart = React.useCallback(
    () => onDragStart(row),
    [onDragStart, row]
  );
  const handleDragEnd = React.useCallback(
    (from: number, to: number) => onDragEnd(row, from, to),
    [onDragEnd, row]
  );

  return (
    <DraggableRow
      rowHeight={CATEGORY_ROW_HEIGHT}
      groupKey={row.groupKey}
      indexInGroup={row.indexInGroup}
      groupSize={row.groupSize}
      enabled={reorderEnabled}
      activeGroup={activeGroup}
      dragY={dragY}
      fromIndex={fromIndex}
      toIndex={toIndex}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CategoryTreeRow
        colors={colors}
        category={row.category}
        depth={row.depth}
        hasChildren={row.hasChildren}
        expanded={row.expanded}
        onToggle={onToggle}
        onSelect={onSelect}
      />
    </DraggableRow>
  );
}
