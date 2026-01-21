"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface QuickStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "yellow" | "purple";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
}

interface QuickStatsSummaryCardProps {
  stats: QuickStat[];
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-700 dark:text-green-300",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    text: "text-yellow-700 dark:text-yellow-300",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-300",
  },
};

export default function QuickStatsSummaryCard({ stats }: QuickStatsSummaryCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-white text-lg font-bold mb-6">خلاصه آمار کلی</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];
          
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon size={20} className={colors.icon} />
                </div>
                
                {stat.trend && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend.direction === "up"
                        ? "text-green-600 dark:text-green-400"
                        : stat.trend.direction === "down"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {stat.trend.direction === "up" && <TrendingUp size={14} />}
                    {stat.trend.direction === "down" && <TrendingDown size={14} />}
                    {stat.trend.direction === "neutral" && <Minus size={14} />}
                    <span>{Math.abs(stat.trend.value).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
