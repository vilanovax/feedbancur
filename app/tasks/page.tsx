"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Grid3x3, List, Building2, Users } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

type ViewMode = "grid" | "list";

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>(() => {
    // بارگذاری از cache در صورت وجود (فقط برای حالت بدون فیلتر)
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("tasks_cache");
      const cacheTime = localStorage.getItem("tasks_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 3 دقیقه معتبر است
        if (timeDiff < 3 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("tasks_cache");
            localStorage.removeItem("tasks_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tasksStatusFilter") || "";
    }
    return "";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tasksViewMode") as ViewMode;
      if (saved && (saved === "grid" || saved === "list")) {
        return saved;
      }
    }
    return "list";
  });
  const isFirstRender = useRef(true);

  // ذخیره وضعیت در localStorage (نه در اولین render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("tasksViewMode", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("tasksStatusFilter", statusFilter);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router, statusFilter]);

  const fetchTasks = async () => {
    // اگر فیلتر خالی است و cache معتبر وجود دارد، از آن استفاده کن
    if (!statusFilter) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("tasks_cache");
        const cacheTime = localStorage.getItem("tasks_cache_time");
        if (cached && cacheTime) {
          const timeDiff = Date.now() - parseInt(cacheTime);
          if (timeDiff < 3 * 60 * 1000) {
            try {
              const cachedData = JSON.parse(cached);
              setTasks(cachedData);
              setLoading(false);
              // در پس‌زمینه به‌روزرسانی کن
              fetchTasksFromAPI();
              return;
            } catch (e) {
              // اگر parse نشد، ادامه بده و از API بگیر
            }
          }
        }
      }
    }

    // اگر cache وجود ندارد یا فیلتر اعمال شده، از API بگیر
    await fetchTasksFromAPI();
  };

  const fetchTasksFromAPI = async () => {
    try {
      let url = "/api/tasks";
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        // ذخیره در cache فقط اگر فیلتر خالی باشد
        if (!statusFilter) {
          if (typeof window !== "undefined") {
            localStorage.setItem("tasks_cache", JSON.stringify(data));
            localStorage.setItem("tasks_cache_time", Date.now().toString());
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="text-green-500" size={20} />;
      case "IN_PROGRESS":
        return <Clock className="text-blue-500" size={20} />;
      case "PENDING":
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "تکمیل شده";
      case "IN_PROGRESS":
        return "در حال انجام";
      case "PENDING":
        return "در انتظار";
      case "FORWARDED":
        return "فوروارد شده";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            مدیریت تسک‌ها
          </h1>
          <Link
            href="/"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowRight size={20} className="ml-2" />
            بازگشت به داشبورد
          </Link>
        </div>

        {/* فیلترها و تغییر نمایش */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="PENDING">در انتظار</option>
                <option value="IN_PROGRESS">در حال انجام</option>
                <option value="COMPLETED">تکمیل شده</option>
                <option value="FORWARDED">فوروارد شده</option>
              </select>
            </div>
            <div className="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title="نمایش گریدی"
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title="نمایش لیستی"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* لیست یا گرید تسک‌ها */}
        {loading && tasks.length === 0 ? (
          // Skeleton Loading
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 mb-3"></div>
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3"></div>
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              هیچ تسکی یافت نشد
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    {getStatusIcon(task.status)}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                      {task.title}
                    </h3>
                  </div>
                </div>
                {task.priority && (
                  <div className="mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority === "HIGH"
                        ? "بالا"
                        : task.priority === "MEDIUM"
                        ? "متوسط"
                        : "پایین"}
                    </span>
                  </div>
                )}
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-3 flex-1">
                  {task.description}
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} />
                    <span>{task.department?.name || "بدون بخش"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span>{getStatusText(task.status)}</span>
                  </div>
                  {task.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>
                        تکمیل:{" "}
                        {new Date(task.completedAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  )}
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Users size={14} className="mt-0.5" />
                      <span className="line-clamp-2">
                        {task.assignedTo
                          .map(
                            (assignment: any) =>
                              assignment.employee?.name ||
                              assignment.user?.name
                          )
                          .join("، ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {task.title}
                      </h3>
                      {task.priority && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority === "HIGH"
                            ? "بالا"
                            : task.priority === "MEDIUM"
                            ? "متوسط"
                            : "پایین"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {task.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>بخش: {task.department?.name}</span>
                      <span>وضعیت: {getStatusText(task.status)}</span>
                      {task.completedAt && (
                        <span>
                          تکمیل شده:{" "}
                          {new Date(task.completedAt).toLocaleDateString(
                            "fa-IR"
                          )}
                        </span>
                      )}
                    </div>
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        مسئولین:{" "}
                        {task.assignedTo
                          .map(
                            (assignment: any) =>
                              assignment.employee?.name ||
                              assignment.user?.name
                          )
                          .join("، ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
