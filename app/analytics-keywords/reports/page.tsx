"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

// Lazy load کامپوننت‌های Recharts برای بهبود performance
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });

interface Department {
  id: string;
  name: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const TYPE_LABELS = {
  SENSITIVE: "حساس",
  POSITIVE: "مثبت",
  NEGATIVE: "منفی",
  TOPIC: "موضوعی",
  CUSTOM: "دلخواه",
};

export default function AnalyticsKeywordsReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"summary" | "trends" | "comparison" | "speed">("summary");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [days, setDays] = useState(30);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "MANAGER"
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDepartments();
      fetchReport();
    }
  }, [status, reportType, selectedDepartment, days]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
      });

      if (selectedDepartment !== "all") {
        params.append("departmentId", selectedDepartment);
      }

      if (reportType === "summary") {
        if (dateRange.startDate) params.append("startDate", dateRange.startDate);
        if (dateRange.endDate) params.append("endDate", dateRange.endDate);
      }

      if (reportType === "trends") {
        params.append("days", days.toString());
      }

      const res = await fetch(`/api/analytics-keywords/report?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryReport = () => {
    if (!reportData) return null;

    const typeDistributionData = Object.entries(reportData.typeDistribution || {}).map(
      ([type, count]) => ({
        name: TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type,
        value: count as number,
      })
    );

    return (
      <div className="space-y-6">
        {/* کارت‌های آماری */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کل فیدبک‌ها</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {reportData.totalFeedbacks || 0}
                </p>
              </div>
              <BarChart3 className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کلمات کلیدی یافت شده</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {reportData.keywordMatches?.length || 0}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">برترین کلمه</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white mt-2">
                  {reportData.topKeywords?.[0]?.keyword || "-"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reportData.topKeywords?.[0]?.count || 0} بار
                </p>
              </div>
              <PieChartIcon className="text-purple-500" size={40} />
            </div>
          </div>
        </div>

        {/* نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* برترین کلمات کلیدی */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              برترین کلمات کلیدی
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topKeywords || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="keyword" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="تعداد تکرار" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* توزیع انواع کلمات */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              توزیع انواع کلمات کلیدی
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* جدول جزئیات کلمات کلیدی */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-6 pb-4">
            جزئیات کلمات کلیدی
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  کلمه کلیدی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  نوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  تعداد تکرار
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(reportData.keywordMatches || []).map((match: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {match.keyword}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {TYPE_LABELS[match.type as keyof typeof TYPE_LABELS] || match.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {match.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTrendsReport = () => {
    if (!reportData || !reportData.series) return null;

    // تبدیل داده‌های روند به فرمت مناسب برای نمودار
    const chartData = reportData.dates.map((date: string, index: number) => {
      const point: any = { date };
      reportData.series.forEach((serie: any) => {
        point[serie.name] = serie.data[index].count;
      });
      return point;
    });

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            روند کلمات کلیدی در {days} روز گذشته
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {reportData.series.map((serie: any, index: number) => (
                <Line
                  key={serie.name}
                  type="monotone"
                  dataKey={serie.name}
                  stroke={COLORS[index % COLORS.length]}
                  name={serie.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderComparisonReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        {/* مقایسه تعداد فیدبک‌ها */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            مقایسه تعداد فیدبک‌ها بر اساس بخش
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="departmentName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalFeedbacks" fill="#3b82f6" name="تعداد فیدبک" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* جدول مقایسه‌ای */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-6 pb-4">
            جزئیات مقایسه بخش‌ها
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  بخش
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  تعداد فیدبک
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  کلمات حساس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  کلمات مثبت
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  کلمات منفی
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {reportData.map((dept: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {dept.departmentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {dept.totalFeedbacks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                    {dept.typeDistribution?.SENSITIVE || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                    {dept.typeDistribution?.POSITIVE || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400">
                    {dept.typeDistribution?.NEGATIVE || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSpeedReport = () => {
    if (!reportData) return null;

    const TYPE_COLORS_MAP: Record<string, string> = {
      SENSITIVE: "#ef4444",
      POSITIVE: "#10b981",
      NEGATIVE: "#f59e0b",
      TOPIC: "#3b82f6",
      CUSTOM: "#6b7280",
    };

    return (
      <div className="space-y-6">
        {/* کارت‌های آماری */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کل فیدبک‌های تکمیل شده</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {reportData.totalCompletedFeedbacks || 0}
                </p>
              </div>
              <BarChart3 className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">سریع‌ترین کلمه کلیدی</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-400 mt-2">
                  {reportData.topFastestKeywords?.[0]?.keyword || "-"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reportData.topFastestKeywords?.[0]?.averageHours || 0} ساعت
                </p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کندترین کلمه کلیدی</p>
                <p className="text-xl font-bold text-red-800 dark:text-red-400 mt-2">
                  {reportData.topSlowestKeywords?.[0]?.keyword || "-"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {reportData.topSlowestKeywords?.[0]?.averageHours || 0} ساعت
                </p>
              </div>
              <PieChartIcon className="text-red-500" size={40} />
            </div>
          </div>
        </div>

        {/* نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* سریع‌ترین کلمات کلیدی */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              10 سریع‌ترین کلمه کلیدی
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              کمترین زمان میانگین برای انجام فیدبک (ساعت کاری)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topFastestKeywords || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="keyword" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} ساعت`} />
                <Legend />
                <Bar dataKey="averageHours" fill="#10b981" name="میانگین زمان (ساعت)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* کندترین کلمات کلیدی */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              10 کندترین کلمه کلیدی
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              بیشترین زمان میانگین برای انجام فیدبک (ساعت کاری)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topSlowestKeywords || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="keyword" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} ساعت`} />
                <Legend />
                <Bar dataKey="averageHours" fill="#ef4444" name="میانگین زمان (ساعت)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* جدول جزئیات همه کلمات کلیدی */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-6 pb-4">
            جزئیات سرعت انجام برای همه کلمات کلیدی
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  کلمه کلیدی
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  نوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  تعداد فیدبک
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  میانگین زمان (ساعت)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(reportData.keywordSpeedData || []).map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {item.keyword}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {TYPE_LABELS[item.type as keyof typeof TYPE_LABELS] || item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.totalFeedbacks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded ${
                      item.averageHours < 24 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      item.averageHours < 72 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {item.averageHours} ساعت
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            گزارشات تحلیلی کلمات کلیدی
          </h1>

          {/* فیلترها */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع گزارش
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="summary">خلاصه</option>
                  <option value="trends">روند</option>
                  <option value="comparison">مقایسه بخش‌ها</option>
                  <option value="speed">سرعت انجام فیدبک‌ها</option>
                </select>
              </div>

              {reportType !== "comparison" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بخش
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">همه بخش‌ها</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === "trends" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تعداد روز
                  </label>
                  <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value={7}>7 روز</option>
                    <option value={14}>14 روز</option>
                    <option value={30}>30 روز</option>
                    <option value={60}>60 روز</option>
                    <option value={90}>90 روز</option>
                  </select>
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={fetchReport}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  بروزرسانی گزارش
                </button>
              </div>
            </div>
          </div>

          {/* نمایش گزارش */}
          {!reportData ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-xl text-gray-600 dark:text-gray-400">
                داده‌ای برای نمایش وجود ندارد
              </div>
            </div>
          ) : (
            <>
              {reportType === "summary" && renderSummaryReport()}
              {reportType === "trends" && renderTrendsReport()}
              {reportType === "comparison" && renderComparisonReport()}
              {reportType === "speed" && renderSpeedReport()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
