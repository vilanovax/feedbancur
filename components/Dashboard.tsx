"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import AppHeader from "./AdminHeader";
import DashboardSkeleton from "./DashboardSkeleton";
import { useStats, useMyAssessmentResults } from "@/lib/swr";
import { UpdatesWidget } from "@/components/UpdatesWidget";
import StatCardEnhanced from "@/components/dashboard/StatCardEnhanced";
import {
  MessageSquare,
  BarChart3,
  Users,
  Plus,
  Building2,
  CheckSquare,
  Bell,
  Trophy,
  CheckCircle,
  Clock,
  Archive,
  ClipboardList,
  ArrowLeft,
  Newspaper,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Use SWR for data fetching with caching
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: assessmentResults, isLoading: resultsLoading } = useMyAssessmentResults();

  const loading = statsLoading || resultsLoading;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const getResultDisplay = useCallback((result: any) => {
    if (result.assessment.type === "MBTI" && result.result) {
      return result.result.type || "N/A";
    } else if (result.assessment.type === "DISC" && result.result) {
      return result.result.type || "N/A";
    } else if (result.assessment.type === "HOLLAND" && result.result) {
      return result.result.type || "N/A";
    } else if (result.assessment.type === "MSQ" && result.result) {
      return result.result.level || `${result.result.totalPercentage}%` || "N/A";
    } else if (result.score !== null) {
      return `${result.score}%`;
    }
    return "N/A";
  }, []);

  const typeLabels = useMemo(() => ({
    MBTI: "MBTI",
    DISC: "DISC",
    HOLLAND: "هالند",
    MSQ: "MSQ",
    CUSTOM: "سفارشی",
  }), []);

  const getTypeLabel = useCallback((type: string) => {
    return typeLabels[type as keyof typeof typeLabels] || type;
  }, [typeLabels]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
          <DashboardSkeleton />
        </main>
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
        {/* Stat Cards با Mini Charts و Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCardEnhanced
            title="کل فیدبک‌ها"
            value={stats?.totalFeedbacks ?? 0}
            icon={MessageSquare}
            color="blue"
            trend={stats?.trends?.totalFeedbacks}
            miniChartData={stats?.miniChartData}
            href="/feedback"
          />

          <StatCardEnhanced
            title="فیدبک‌های در انتظار"
            value={stats?.pendingFeedbacks ?? 0}
            icon={BarChart3}
            color="yellow"
            trend={stats?.trends?.pendingFeedbacks}
            miniChartData={stats?.miniChartData}
            href="/feedback?status=PENDING"
          />

          <StatCardEnhanced
            title="فیدبک‌های تکمیل شده"
            value={stats?.completedFeedbacks ?? 0}
            icon={CheckCircle}
            color="green"
            trend={stats?.trends?.completedFeedbacks}
            miniChartData={stats?.miniChartData}
            href="/feedback?status=COMPLETED"
          />

          <StatCardEnhanced
            title="فیدبک‌های موکول شده"
            value={stats?.deferredFeedbacks ?? 0}
            icon={Clock}
            color="orange"
            trend={stats?.trends?.deferredFeedbacks}
            miniChartData={stats?.miniChartData}
            href="/feedback?status=DEFERRED"
          />
        </div>

        {/* Stat Cards اضافی */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCardEnhanced
            title="فیدبک‌های آرشیو شده"
            value={stats?.archivedFeedbacks ?? 0}
            icon={Archive}
            color="gray"
            href="/feedback?status=ARCHIVED"
          />

          <StatCardEnhanced
            title="بخش‌ها"
            value={stats?.departments ?? 0}
            icon={Building2}
            color="purple"
            href="/departments"
          />
        </div>

        {/* باکس‌های آماری اعلانات و نظرسنجی‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* اعلانات فعال */}
          <Link href="/announcements" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">اعلانات فعال</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats?.activeAnnouncements ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  از {stats?.totalAnnouncements ?? 0} کل
                </p>
              </div>
              <div className="relative">
                <Bell className="text-yellow-500" size={40} />
                {(stats?.newAnnouncements ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {stats?.newAnnouncements}
                  </span>
                )}
              </div>
            </div>
            {(stats?.newAnnouncements ?? 0) > 0 && (
              <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-2 py-1 inline-block">
                {stats?.newAnnouncements} اعلان جدید در ۲۴ ساعت گذشته
              </div>
            )}
          </Link>

          {/* نظرسنجی‌های فعال */}
          <Link href="/polls" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">نظرسنجی‌های فعال</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats?.activePolls ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  از {stats?.totalPolls ?? 0} کل
                </p>
              </div>
              <div className="relative">
                <CheckSquare className="text-indigo-500" size={40} />
                {(stats?.newPolls ?? 0) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {stats?.newPolls}
                  </span>
                )}
              </div>
            </div>
            {(stats?.newPolls ?? 0) > 0 && (
              <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1 inline-block">
                {stats?.newPolls} نظرسنجی جدید در ۲۴ ساعت گذشته
              </div>
            )}
          </Link>

          {/* کل اعلانات */}
          <Link href="/announcements/manage" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کل اعلانات</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats?.totalAnnouncements ?? 0}
                </p>
              </div>
              <Bell className="text-gray-400" size={40} />
            </div>
          </Link>

          {/* کل نظرسنجی‌ها */}
          <Link href="/polls/manage" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">کل نظرسنجی‌ها</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats?.totalPolls ?? 0}
                </p>
              </div>
              <CheckSquare className="text-gray-400" size={40} />
            </div>
          </Link>
        </div>

        {/* ویجت اطلاع‌رسانی‌ها */}
        <div className="mb-8">
          <UpdatesWidget />
        </div>

        {/* نتایج آزمون‌ها */}
        {(assessmentResults?.length ?? 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              نتایج آزمون‌های شما
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessmentResults?.map((result) => (
                <Link
                  key={result.id}
                  href={`/assessments/${result.assessmentId}/result`}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-r-4 border-indigo-600 dark:border-indigo-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-[5px]">
                      <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                        <ClipboardList className="text-indigo-600 dark:text-indigo-400" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                          {result.assessment.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getTypeLabel(result.assessment.type)}
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      {getResultDisplay(result)}
                    </div>
                    {result.completedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(result.completedAt).toLocaleDateString("fa-IR")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/feedback/new"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-reverse">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg flex-shrink-0">
                <Plus className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div className="mr-[5px]">
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
            <div className="flex items-center space-x-reverse">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg flex-shrink-0">
                <MessageSquare className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div className="mr-[5px]">
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
            href="/announcements"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-reverse">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg flex-shrink-0">
                <Bell className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <div className="mr-[5px]">
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
            href="/updates"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-reverse">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg flex-shrink-0">
                <Newspaper className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div className="mr-[5px]">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  اطلاع‌رسانی‌ها
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  بهبودها و تغییرات
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/public-board"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-reverse">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-lg flex-shrink-0">
                <Trophy className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <div className="mr-[5px]">
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
                <div className="flex items-center space-x-reverse">
                  <div className="bg-cyan-100 dark:bg-cyan-900 p-3 rounded-lg flex-shrink-0">
                    <Users className="text-cyan-600 dark:text-cyan-400" size={24} />
                  </div>
                  <div className="mr-[5px]">
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
                <div className="flex items-center space-x-reverse">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg flex-shrink-0">
                    <Building2 className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  <div className="mr-[5px]">
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
                <div className="flex items-center space-x-reverse">
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg flex-shrink-0">
                    <BarChart3 className="text-orange-600 dark:text-orange-400" size={24} />
                  </div>
                  <div className="mr-[5px]">
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

