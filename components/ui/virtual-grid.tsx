"use client";

import { memo, useCallback, CSSProperties, useMemo } from "react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";

interface VirtualGridProps<T> {
  items: T[];
  height: number;
  width: number;
  columnCount: number;
  rowHeight: number;
  columnWidth: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  gap?: number;
}

function VirtualGridComponent<T>({
  items,
  height,
  width,
  columnCount,
  rowHeight,
  columnWidth,
  renderItem,
  className = "",
  gap = 16,
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
      const index = rowIndex * columnCount + columnIndex;
      if (index >= items.length) {
        return null;
      }

      const item = items[index];

      // Adjust style to account for gap
      const adjustedStyle: CSSProperties = {
        ...style,
        left: Number(style.left) + gap / 2,
        top: Number(style.top) + gap / 2,
        width: Number(style.width) - gap,
        height: Number(style.height) - gap,
      };

      return renderItem(item, index, adjustedStyle);
    },
    [items, columnCount, renderItem, gap]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <Grid
      className={className}
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={height}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={width}
    >
      {Cell}
    </Grid>
  );
}

export const VirtualGrid = memo(VirtualGridComponent) as typeof VirtualGridComponent;
