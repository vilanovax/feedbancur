"use client";

import { memo, useCallback, CSSProperties, useRef, useState, useEffect, ReactNode } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

export interface VirtualTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

interface VirtualTableProps<T> {
  items: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: string | ((item: T, index: number) => string);
  emptyMessage?: string;
  loading?: boolean;
  loadingRows?: number;
}

function VirtualTableComponent<T extends { id?: string }>({
  items,
  columns,
  rowHeight = 64,
  headerHeight = 48,
  className = "",
  onRowClick,
  rowClassName = "",
  emptyMessage = "موردی یافت نشد",
  loading = false,
  loadingRows = 5,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = Math.min(
          Math.max(window.innerHeight - rect.top - 100, 300),
          600
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
  }, []);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      const rowClasses =
        typeof rowClassName === "function"
          ? rowClassName(item, index)
          : rowClassName;

      return (
        <div
          style={style}
          className={`flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
            onRowClick ? "cursor-pointer" : ""
          } ${rowClasses}`}
          onClick={() => onRowClick?.(item, index)}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-4 py-2 ${column.className || ""}`}
              style={{ width: column.width || "auto", flexShrink: 0 }}
            >
              {column.render(item, index)}
            </div>
          ))}
        </div>
      );
    },
    [items, columns, onRowClick, rowClassName]
  );

  // Loading skeleton
  if (loading) {
    return (
      <div ref={containerRef} className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div
          className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          style={{ height: headerHeight }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${column.className || ""}`}
              style={{ width: column.width || "auto", flexShrink: 0 }}
            >
              {column.header}
            </div>
          ))}
        </div>
        {/* Loading rows */}
        {Array.from({ length: loadingRows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center border-b border-gray-200 dark:border-gray-700 animate-pulse"
            style={{ height: rowHeight }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className={`px-4 py-2 ${column.className || ""}`}
                style={{ width: column.width || "auto", flexShrink: 0 }}
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div ref={containerRef} className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div
          className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          style={{ height: headerHeight }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${column.className || ""}`}
              style={{ width: column.width || "auto", flexShrink: 0 }}
            >
              {column.header}
            </div>
          ))}
        </div>
        {/* Empty message */}
        <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Small list - no virtualization needed
  const totalHeight = items.length * rowHeight;
  if (totalHeight <= 400) {
    return (
      <div ref={containerRef} className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {/* Header */}
        <div
          className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          style={{ height: headerHeight }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${column.className || ""}`}
              style={{ width: column.width || "auto", flexShrink: 0 }}
            >
              {column.header}
            </div>
          ))}
        </div>
        {/* Rows */}
        <div className="bg-white dark:bg-gray-800">
          {items.map((item, index) => {
            const rowClasses =
              typeof rowClassName === "function"
                ? rowClassName(item, index)
                : rowClassName;

            return (
              <div
                key={item.id || index}
                className={`flex items-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClasses}`}
                style={{ height: rowHeight }}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`px-4 py-2 ${column.className || ""}`}
                    style={{ width: column.width || "auto", flexShrink: 0 }}
                  >
                    {column.render(item, index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Large list - use virtualization
  return (
    <div ref={containerRef} className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div
        className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={`px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ${column.className || ""}`}
            style={{ width: column.width || "auto", flexShrink: 0 }}
          >
            {column.header}
          </div>
        ))}
      </div>
      {/* Virtualized rows */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <List
          height={dimensions.height - headerHeight}
          itemCount={items.length}
          itemSize={rowHeight}
          width={dimensions.width}
          className="bg-white dark:bg-gray-800"
        >
          {Row}
        </List>
      )}
    </div>
  );
}

export const VirtualTable = memo(VirtualTableComponent) as typeof VirtualTableComponent;
