"use client";

import { memo, useCallback, CSSProperties, useRef, useState, useEffect } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

interface AutoSizerListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  containerClassName?: string;
  overscanCount?: number;
  minHeight?: number;
  maxHeight?: number;
}

function AutoSizerListComponent<T>({
  items,
  itemHeight,
  renderItem,
  className = "",
  containerClassName = "",
  overscanCount = 5,
  minHeight = 200,
  maxHeight = 800,
}: AutoSizerListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate available height (viewport height minus container top position minus some padding)
        const availableHeight = Math.min(
          Math.max(window.innerHeight - rect.top - 100, minHeight),
          maxHeight
        );
        setDimensions({
          width: rect.width,
          height: availableHeight,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [minHeight, maxHeight]);

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

  // If items fit without scrolling, don't virtualize
  const totalHeight = items.length * itemHeight;
  if (totalHeight <= dimensions.height && dimensions.height > 0) {
    return (
      <div ref={containerRef} className={containerClassName}>
        <div className={className}>
          {items.map((item, index) =>
            renderItem(item, index, { position: "relative" as const })
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={containerClassName}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <List
          height={dimensions.height}
          itemCount={items.length}
          itemSize={itemHeight}
          width={dimensions.width}
          className={className}
          overscanCount={overscanCount}
        >
          {Row}
        </List>
      )}
    </div>
  );
}

export const AutoSizerList = memo(AutoSizerListComponent) as typeof AutoSizerListComponent;
