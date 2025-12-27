"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trophy, CheckCircle, ArrowRight } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";

export default function MobilePublicBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("public_board_cache");
      const cacheTime = localStorage.getItem("public_board_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 5 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("public_board_cache");
            localStorage.removeItem("public_board_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("public_board_cache");
      const cacheTime = localStorage.getItem("public_board_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 5 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setTasks(cachedData);
            setLoading(false);
            fetchTasksFromAPI();
            return;
          } catch (e) {
            // continue to fetch from API
          }
        }
      }
    }
    await fetchTasksFromAPI();
  };

  const fetchTasksFromAPI = async () => {
    try {
      const res = await fetch("/api/public-board");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (typeof window !== "undefined") {
          localStorage.setItem("public_board_cache", JSON.stringify(data));
          localStorage.setItem("public_board_cache_time", Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Error fetching public board:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <MobileLayout title="بورد افتخارات">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="بورد افتخارات">
      <div className="p-4 space-y-4">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={32} />
            <h1 className="text-xl font-bold">بورد افتخارات</h1>
          </div>
          <p className="text-sm opacity-90">
            تسک‌هایی که با موفقیت تکمیل شده‌اند
          </p>
        </div>

        {/* Tasks List */}
        {loading && tasks.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-10 h-10"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              هنوز هیچ تسک تکمیل شده‌ای برای نمایش وجود ندارد
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                    <CheckCircle
                      className="text-green-600 dark:text-green-400"
                      size={20}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      {task.title}
                    </h3>
                    {task.department?.name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.department.name}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                  {task.description}
                </p>

                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-medium">مسئولین: </span>
                      {task.assignedTo
                        .map(
                          (assignment: any) =>
                            assignment.employee?.name || assignment.user?.name
                        )
                        .join("، ")}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span>
                    تکمیل:{" "}
                    {new Date(task.completedAt).toLocaleDateString("fa-IR")}
                  </span>
                  {task.priority && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {task.priority === "HIGH"
                        ? "بالا"
                        : task.priority === "MEDIUM"
                        ? "متوسط"
                        : "پایین"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
