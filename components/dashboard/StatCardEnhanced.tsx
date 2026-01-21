"use client";

import Link from "next/link";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardEnhancedProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "yellow" | "green" | "orange" | "gray" | "purple";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  miniChartData?: number[];
  href?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    hover: "hover:border-blue-300 dark:hover:border-blue-700",
    gradient: "from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20",
    chart: "#3b82f6",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    hover: "hover:border-yellow-300 dark:hover:border-yellow-700",
    gradient: "from-yellow-50 to-yellow-100 dark:from-yellow-900/10 dark:to-yellow-900/20",
    chart: "#eab308",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    hover: "hover:border-green-300 dark:hover:border-green-700",
    gradient: "from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/20",
    chart: "#22c55e",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    hover: "hover:border-orange-300 dark:hover:border-orange-700",
    gradient: "from-orange-50 to-orange-100 dark:from-orange-900/10 dark:to-orange-900/20",
    chart: "#f97316",
  },
  gray: {
    bg: "bg-gray-100 dark:bg-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-700",
    hover: "hover:border-gray-300 dark:hover:border-gray-600",
    gradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
    chart: "#6b7280",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    hover: "hover:border-purple-300 dark:hover:border-purple-700",
    gradient: "from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-900/20",
    chart: "#a855f7",
  },
};

export default function StatCardEnhanced({
  title,
  value,
  icon: Icon,
  color,
  trend,
  miniChartData,
  href,
}: StatCardEnhancedProps) {
  const colors = colorClasses[color];

  // تبدیل miniChartData به فرمت Recharts
  const chartData = miniChartData?.map((value, index) => ({
    index,
    value,
  }));

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp size={16} className="text-green-600 dark:text-green-400" />;
      case "down":
        return <TrendingDown size={16} className="text-red-600 dark:text-red-400" />;
      case "neutral":
        return <Minus size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";

    switch (trend.direction) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const content = (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${colors.border} ${colors.hover} p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden group`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`${colors.icon}`} size={24} />
          </div>

          {trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {trend.value > 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Value & Title */}
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        </div>

        {/* Mini Chart */}
        {chartData && chartData.length > 0 && (
          <div className="h-12 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.chart}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
