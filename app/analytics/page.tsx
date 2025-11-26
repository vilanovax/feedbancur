"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Star } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(() => {
    // بارگذاری از cache در صورت وجود
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("analytics_cache");
      const cacheTime = localStorage.getItem("analytics_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 5 دقیقه معتبر است
        if (timeDiff < 5 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("analytics_cache");
            localStorage.removeItem("analytics_cache_time");
          }
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

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
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // اگر cache معتبر وجود دارد، از آن استفاده کن
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("analytics_cache");
      const cacheTime = localStorage.getItem("analytics_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 5 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setAnalytics(cachedData);
            setLoading(false);
            // در پس‌زمینه به‌روزرسانی کن
            fetchAnalyticsFromAPI();
            return;
          } catch (e) {
            // اگر parse نشد، ادامه بده و از API بگیر
          }
        }
      }
    }

    // اگر cache وجود ندارد، از API بگیر
    await fetchAnalyticsFromAPI();
  };

  const fetchAnalyticsFromAPI = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
        // ذخیره در cache
        if (typeof window !== "undefined") {
          localStorage.setItem("analytics_cache", JSON.stringify(data));
          localStorage.setItem("analytics_cache_time", Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  if (status === "loading") {
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          آمار و تحلیل
        </h1>

        {loading && !analytics ? (
          // Skeleton Loading
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                      <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
                  <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </>
        ) : !analytics ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              داده‌ای برای نمایش وجود ندارد
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      میانگین امتیاز
                    </p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                      {analytics.averageRating?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                  <Star className="text-yellow-500" size={40} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      کل فیدبک‌ها
                    </p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                      {analytics.totalFeedbacks || 0}
                    </p>
                  </div>
                  <BarChart3 className="text-blue-500" size={40} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      بخش‌های فعال
                    </p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                      {analytics.activeDepartments || 0}
                    </p>
                  </div>
                  <TrendingUp className="text-green-500" size={40} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  فیدبک‌ها بر اساس بخش
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.feedbacksByDepartment || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  توزیع امتیازها
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.ratingDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analytics.ratingDistribution || []).map(
                        (entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

