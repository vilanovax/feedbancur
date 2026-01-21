"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { FileText } from "lucide-react";

interface StatusPieChartProps {
  stats: {
    pendingFeedbacks: number;
    completedFeedbacks: number;
    deferredFeedbacks: number;
    archivedFeedbacks: number;
  } | null;
}

export default function StatusPieChart({ stats }: StatusPieChartProps) {
  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-80">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // آماده‌سازی داده‌ها برای نمودار
  const data = [
    {
      name: "در انتظار",
      value: stats.pendingFeedbacks,
      color: "#eab308", // yellow
    },
    {
      name: "تکمیل شده",
      value: stats.completedFeedbacks,
      color: "#22c55e", // green
    },
    {
      name: "موکول شده",
      value: stats.deferredFeedbacks,
      color: "#f97316", // orange
    },
    {
      name: "بایگانی شده",
      value: stats.archivedFeedbacks,
      color: "#6b7280", // gray
    },
  ].filter((item) => item.value > 0); // فقط مواردی که مقدار دارند

  // محاسبه مجموع
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {data.name}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            ></div>
            <span className="text-gray-600 dark:text-gray-400">تعداد:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {data.value}
            </span>
            <span className="text-gray-500 dark:text-gray-500">
              ({percentage}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Label
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // اگر درصد کمتر از 5% بود، لیبل نشان نده

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
          <FileText className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            توزیع وضعیت فیدبک‌ها
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            نسبت فیدبک‌ها بر اساس وضعیت
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mb-2 opacity-50" />
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "14px" }}
                iconType="circle"
                formatter={(value, entry: any) => (
                  <span className="text-gray-700 dark:text-gray-300">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Summary */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            {data.map((item) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.value} ({percentage}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
