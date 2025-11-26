"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowRight, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

export default function PublicBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/public-board");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching public board:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Trophy className="text-yellow-500" size={40} />
            بورد افتخارات
          </h1>
          <Link
            href="/"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowRight size={20} className="ml-2" />
            بازگشت به داشبورد
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg shadow-xl p-6 mb-6">
          <p className="text-gray-700 dark:text-gray-300 text-lg text-center">
            🎉 تسک‌هایی که با موفقیت تکمیل شده‌اند و برای نمایش عمومی منتشر
            شده‌اند
          </p>
        </div>

        {/* لیست تسک‌های تکمیل شده */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <CheckCircle
                size={64}
                className="mx-auto text-gray-400 mb-4"
              />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                هنوز هیچ تسک تکمیل شده‌ای برای نمایش وجود ندارد
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                      {task.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {task.department?.name}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {task.description}
                </p>

                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                      👏 مسئولین:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                      {task.assignedTo
                        .map(
                          (assignment: any) =>
                            assignment.employee?.name || assignment.user?.name
                        )
                        .join("، ")}
                    </p>
                  </div>
                )}

                {task.feedback && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    📝 مرتبط با فیدبک: {task.feedback.title}
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span>
                    ✅ تکمیل:{" "}
                    {new Date(task.completedAt).toLocaleDateString("fa-IR")}
                  </span>
                  {task.priority && (
                    <span
                      className={`px-2 py-1 rounded ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {task.priority === "HIGH"
                        ? "اولویت بالا"
                        : task.priority === "MEDIUM"
                        ? "اولویت متوسط"
                        : "اولویت پایین"}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
