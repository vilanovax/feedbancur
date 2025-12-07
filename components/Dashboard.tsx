"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Sidebar from "./Sidebar";
import AppHeader from "./AdminHeader";
import {
  MessageSquare,
  BarChart3,
  Users,
  LogOut,
  Plus,
  Building2,
  CheckSquare,
  Bell,
  Trophy,
  CheckCircle,
  Clock,
  Archive
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
    departments: 0,
    completedFeedbacks: 0,
    deferredFeedbacks: 0,
    archivedFeedbacks: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />

      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کل فیدبک‌ها</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.totalFeedbacks}
                </p>
              </div>
              <MessageSquare className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">فیدبک‌های در انتظار</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.pendingFeedbacks}
                </p>
              </div>
              <BarChart3 className="text-yellow-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">فیدبک‌های انجام شده</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.completedFeedbacks}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">فیدبک‌های برای آینده</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.deferredFeedbacks}
                </p>
              </div>
              <Clock className="text-orange-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">فیدبک‌های آرشیو شده</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.archivedFeedbacks}
                </p>
              </div>
              <Archive className="text-gray-500" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">بخش‌ها</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.departments}
                </p>
              </div>
              <Building2 className="text-purple-500" size={40} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/feedback/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Plus className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  ثبت فیدبک جدید
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  فیدبک جدید ثبت کنید
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/feedback"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <MessageSquare className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  مشاهده فیدبک‌ها
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  لیست تمام فیدبک‌ها
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/tasks"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                <CheckSquare className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  تسک‌ها
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  مدیریت و پیگیری تسک‌ها
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/announcements"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                <Bell className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  اعلانات
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  اعلانات و اطلاعیه‌ها
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/public-board"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-lg">
                <Trophy className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  بورد افتخارات
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  تسک‌های تکمیل شده
                </p>
              </div>
            </div>
          </Link>

          {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
            <>
              <Link
                href="/users"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-cyan-100 dark:bg-cyan-900 p-3 rounded-lg">
                    <Users className="text-cyan-600 dark:text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      مدیریت کاربران
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      مدیران و کارمندان بخش‌ها
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/departments"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      مدیریت بخش‌ها
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      مدیریت بخش‌های شرکت
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/analytics"
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                    <BarChart3 className="text-orange-600 dark:text-orange-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      آمار و تحلیل
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      گزارش‌های تحلیلی
                    </p>
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

