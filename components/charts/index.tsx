"use client";

import dynamic from "next/dynamic";
import { memo, Suspense, ComponentType } from "react";

// Chart skeleton for loading state
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <div className="text-gray-400 dark:text-gray-500">در حال بارگذاری نمودار...</div>
    </div>
  );
}

// Lazy load all recharts components with proper typing
export const LazyResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyBar = dynamic(
  () => import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);

export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyLine = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyPie = dynamic(
  () => import("recharts").then((mod) => mod.Pie),
  { ssr: false }
);

export const LazyCell = dynamic(
  () => import("recharts").then((mod) => mod.Cell),
  { ssr: false }
);

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyArea = dynamic(
  () => import("recharts").then((mod) => mod.Area),
  { ssr: false }
);

export const LazyXAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);

export const LazyYAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);

export const LazyCartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export const LazyTooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);

export const LazyLegend = dynamic(
  () => import("recharts").then((mod) => mod.Legend),
  { ssr: false }
);

// Common chart colors
export const CHART_COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Yellow
  "#FF8042", // Orange
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Gold
  "#ff7c7c", // Red
];

// Chart wrapper with suspense boundary
interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ChartWrapper = memo(function ChartWrapper({
  children,
  height = 300,
  className = "",
}: ChartWrapperProps) {
  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <div className={className} style={{ height }}>
        {children}
      </div>
    </Suspense>
  );
});
