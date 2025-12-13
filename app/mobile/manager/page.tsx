"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import MobileDashboardSkeleton from "@/components/MobileDashboardSkeleton";
import Image from "next/image";
import { MessageSquare, Trophy, Send, CheckSquare, User, Bell, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function ManagerMobilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myFeedbacks: 0,
    forwardedFeedbacks: 0,
    myTasks: 0,
    activeAnnouncements: 0,
    newAnnouncements: 0,
    activePolls: 0,
    newPolls: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "MANAGER") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "MANAGER") {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [feedbacksRes, forwardedRes, tasksRes, statsRes] = await Promise.all([
        fetch("/api/feedback"),
        fetch("/api/feedback?forwardedToMe=true"),
        fetch("/api/tasks"),
        fetch("/api/stats"),
      ]);

      if (feedbacksRes.ok) {
        const feedbacks = await feedbacksRes.json();
        setStats((prev) => ({ ...prev, myFeedbacks: feedbacks.length }));
      }

      if (forwardedRes.ok) {
        const forwarded = await forwardedRes.json();
        setStats((prev) => ({ ...prev, forwardedFeedbacks: forwarded.length }));
      }

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        setStats((prev) => ({ ...prev, myTasks: tasks.length }));
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats((prev) => ({
          ...prev,
          activeAnnouncements: statsData.activeAnnouncements || 0,
          newAnnouncements: statsData.newAnnouncements || 0,
          activePolls: statsData.activePolls || 0,
          newPolls: statsData.newPolls || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <MobileLayout role="MANAGER" title="داشبورد">
        <MobileDashboardSkeleton />
      </MobileLayout>
    );
  }

  if (session?.user.role !== "MANAGER") {
    return null;
  }

  return (
    <MobileLayout role="MANAGER" title="داشبورد">
      <div className="space-y-4">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">سلام {session?.user?.name}!</h2>
              <p className="text-purple-100">به پنل مدیر خوش آمدید</p>
            </div>
            <div className="flex-shrink-0">
              {(session?.user as any)?.avatar ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white/30">
                  <Image
                    src={(session.user as any).avatar}
                    alt="پروفایل"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center border-2 border-white/30">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.myFeedbacks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">فیدبک‌ها</p>
          </div>

          <Link
            href="/mobile/manager/forwarded"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <Send className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.forwardedFeedbacks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ارجاع شده به من
            </p>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.myTasks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">تسک‌های من</p>
          </div>

          {/* اعلانات فعال */}
          <Link
            href="/mobile/announcements"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="relative">
                <Bell className="w-8 h-8 text-yellow-600" />
                {stats.newAnnouncements > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {stats.newAnnouncements}
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.activeAnnouncements}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">اعلانات فعال</p>
            {stats.newAnnouncements > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.newAnnouncements} جدید
              </p>
            )}
          </Link>

          {/* نظرسنجی‌های فعال */}
          <Link
            href="/mobile/polls"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative col-span-2"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="relative">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                {stats.newPolls > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {stats.newPolls}
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.activePolls}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">نظرسنجی‌های فعال</p>
            {stats.newPolls > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.newPolls} نظرسنجی جدید
              </p>
            )}
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            دسترسی سریع
          </h3>

          <Link
            href="/mobile/manager/forwarded"
            className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-r-4 border-purple-600"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                فیدبک‌های ارجاع شده
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                فیدبک‌هایی که ادمین برای شما ارجاع داده است
              </p>
            </div>
            {stats.forwardedFeedbacks > 0 && (
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {stats.forwardedFeedbacks}
              </div>
            )}
          </Link>

          <Link
            href="/mobile/public-board"
            className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 dark:text-white">
                بورد افتخارات
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تسک‌های تکمیل شده
              </p>
            </div>
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
}

