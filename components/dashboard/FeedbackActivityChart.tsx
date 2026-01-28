"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";
import { formatJalali, JalaliFormats } from "@/lib/jalali-utils";

interface Dataset {
  name: string;
  data: number[];
  color: string;
}

interface ActivityData {
  labels: string[];
  datasets: Dataset[];
}

export default function FeedbackActivityChart() {
  const [period, setPeriod] = useState<"7d" | "30d" | "3m" | "1y">("30d");
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/dashboard/activity-timeline?period=${period}`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching activity timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  // تبدیل داده‌ها به فرمت Recharts
  const chartData =
    data?.labels.map((label, index) => {
      const dataPoint: any = { date: label };
      data.datasets.forEach((dataset) => {
        dataPoint[dataset.name] = dataset.data[index];
      });
      return dataPoint;
    }) || [];

  // فرمت تاریخ برای نمایش در XAxis
  const formatXAxis = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (period === "7d") {
        return formatJalali(date, JalaliFormats.DAY_MONTH);
      } else if (period === "30d") {
        return formatJalali(date, JalaliFormats.DAY_MONTH);
      } else if (period === "3m") {
        return formatJalali(date, JalaliFormats.MONTH_SHORT);
      } else {
        return formatJalali(date, JalaliFormats.MONTH_SHORT_YEAR);
      }
    } catch {
      return dateStr;
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {formatJalali(new Date(label), JalaliFormats.LONG)}
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
                {entry.value}
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
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              نمودار فعالیت فیدبک‌ها
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              روند فعالیت در بازه زمانی انتخاب شده
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {[
            { value: "7d" as const, label: "7 روز" },
            { value: "30d" as const, label: "30 روز" },
            { value: "3m" as const, label: "3 ماه" },
            { value: "1y" as const, label: "سال" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mb-2 opacity-50" />
            <p>داده‌ای برای نمایش وجود ندارد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                angle={period === "1y" ? -45 : 0}
                textAnchor={period === "1y" ? "end" : "middle"}
                height={period === "1y" ? 60 : 30}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "14px" }}
                iconType="circle"
              />
              {data?.datasets.map((dataset, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={dataset.name}
                  stroke={dataset.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  animationDuration={500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
