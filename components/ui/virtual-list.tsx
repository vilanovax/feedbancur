"use client";

import { memo, useCallback, CSSProperties } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

function VirtualListComponent<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = "",
  overscanCount = 5,
}: VirtualListProps<T>) {
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return renderItem(item, index, style);
    },
    [items, renderItem]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className={className}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  );
}

export const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;
