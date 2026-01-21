"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Building2, TrendingUp } from "lucide-react";

interface DepartmentData {
  name: string;
  feedbacks: number;
  completed: number;
  avgSpeed: number;
}

export default function DepartmentComparisonChart() {
  const [data, setData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"count" | "speed">("count");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const analytics = await response.json();

        // ترکیب داده‌های feedbacksByDepartment و departmentCompletionSpeed
        const departmentMap = new Map<string, DepartmentData>();

        // افزودن تعداد فیدبک‌ها
        analytics.feedbacksByDepartment?.forEach((dept: any) => {
          departmentMap.set(dept.name, {
            name: dept.name,
            feedbacks: dept.count,
            completed: 0,
            avgSpeed: 0,
          });
        });

        // افزودن آمار تکمیل شده و سرعت
        analytics.departmentCompletionSpeed?.forEach((dept: any) => {
          const existing = departmentMap.get(dept.name);
          if (existing) {
            existing.completed = dept.totalCompleted;
            existing.avgSpeed = dept.averageHours;
          } else {
            departmentMap.set(dept.name, {
              name: dept.name,
              feedbacks: 0,
              completed: dept.totalCompleted,
              avgSpeed: dept.averageHours,
            });
          }
        });

        // تبدیل به آرایه و مرتب‌سازی
        const chartData = Array.from(departmentMap.values())
          .filter((d) => d.feedbacks > 0)
          .sort((a, b) => b.feedbacks - a.feedbacks)
          .slice(0, 8); // فقط 8 بخش برتر

        setData(chartData);
      }
    } catch (error) {
      console.error("Error fetching department comparison:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600 dark:text-gray-400">
                {entry.name}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.name.includes("سرعت")
                  ? `${entry.value.toFixed(1)} ساعت`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
            <Building2 className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              مقایسه عملکرد بخش‌ها
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              عملکرد بخش‌ها بر اساس فیدبک‌ها
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("count")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === "count"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            تعداد
          </button>
          <button
            onClick={() => setViewMode("speed")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              viewMode === "speed"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            سرعت
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Building2 size={48} className="mb-2 opacity-50" />
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis
                type="number"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                label={
                  viewMode === "count"
                    ? { value: "تعداد فیدبک", position: "insideBottom", offset: -5 }
                    : { value: "میانگین ساعت", position: "insideBottom", offset: -5 }
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "14px" }} />

              {viewMode === "count" ? (
                <>
                  <Bar
                    dataKey="feedbacks"
                    fill="#6366f1"
                    name="کل فیدبک‌ها"
                    radius={[0, 4, 4, 0]}
                    animationDuration={500}
                  />
                  <Bar
                    dataKey="completed"
                    fill="#22c55e"
                    name="تکمیل شده"
                    radius={[0, 4, 4, 0]}
                    animationDuration={500}
                  />
                </>
              ) : (
                <Bar
                  dataKey="avgSpeed"
                  fill="#f59e0b"
                  name="میانگین سرعت (ساعت)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={500}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Stats Summary */}
      {!loading && data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* بهترین بخش (بیشترین فیدبک) */}
            {data[0] && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    بیشترین فیدبک
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {data[0].name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {data[0].feedbacks} فیدبک
                </p>
              </div>
            )}

            {/* سریع‌ترین بخش */}
            {data.filter((d) => d.avgSpeed > 0).length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    سریع‌ترین بخش
                  </p>
                </div>
                {(() => {
                  const fastest = data
                    .filter((d) => d.avgSpeed > 0)
                    .sort((a, b) => a.avgSpeed - b.avgSpeed)[0];
                  return (
                    <>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {fastest.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {fastest.avgSpeed.toFixed(1)} ساعت
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* کل بخش‌ها */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                کل بخش‌های فعال
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.length}
              </p>
            </div>

            {/* کل فیدبک‌ها */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                کل فیدبک‌ها
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.reduce((sum, d) => sum + d.feedbacks, 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
