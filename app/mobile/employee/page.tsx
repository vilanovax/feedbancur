"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import MobileDashboardSkeleton from "@/components/MobileDashboardSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import Image from "next/image";
import { MessageSquare, CheckSquare, Trophy, User, Bell, BarChart3, ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AssessmentResult {
  id: string;
  assessmentId: string;
  assessment: {
    id: string;
    title: string;
    type: string;
  };
  result: any;
  score: number | null;
  isPassed: boolean | null;
  completedAt: Date;
}

export default function EmployeeMobilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [stats, setStats] = useState({
    myFeedbacks: 0,
    myTasks: 0,
    activeAnnouncements: 0,
    newAnnouncements: 0,
    activePolls: 0,
    newPolls: 0,
    assessments: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "EMPLOYEE") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "EMPLOYEE") {
      fetchStats();
      fetchAssessmentResults();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [feedbacksRes, tasksRes, statsRes, assessmentsRes] = await Promise.all([
        fetch("/api/feedback"),
        fetch("/api/tasks"),
        fetch("/api/stats"),
        fetch("/api/assessments/available"),
      ]);

      if (feedbacksRes.ok) {
        const feedbacks = await feedbacksRes.json();
        setStats((prev) => ({ ...prev, myFeedbacks: feedbacks.length }));
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

      if (assessmentsRes.ok) {
        const assessments = await assessmentsRes.json();
        setStats((prev) => ({ ...prev, assessments: assessments.length }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentResults = async () => {
    try {
      const response = await fetch("/api/assessments/my-results");
      if (response.ok) {
        const results = await response.json();
        setAssessmentResults(results);
      }
    } catch {
      // Silently handle error
    }
  };

  const getResultDisplay = (result: AssessmentResult) => {
    // برای آزمون‌های شخصیت‌سنجی، ابتدا result.result را بررسی کن
    if (result.assessment.type === "MBTI" && result.result) {
      // اگر result یک object است و type دارد
      if (typeof result.result === "object" && result.result.type) {
        return result.result.type;
      }
      // اگر result یک string است (مستقیماً type)
      if (typeof result.result === "string") {
        return result.result;
      }
    } else if (result.assessment.type === "DISC" && result.result) {
      if (typeof result.result === "object" && result.result.type) {
        return result.result.type;
      }
      if (typeof result.result === "string") {
        return result.result;
      }
    } else if (result.assessment.type === "HOLLAND" && result.result) {
      if (typeof result.result === "object" && result.result.type) {
        return result.result.type;
      }
      if (typeof result.result === "string") {
        return result.result;
      }
    } else if (result.assessment.type === "MSQ" && result.result) {
      if (typeof result.result === "object") {
        return result.result.level || `${result.result.totalPercentage}%` || "N/A";
      }
    }
    
    // اگر نمره وجود دارد، آن را نمایش بده
    if (result.score !== null && result.score !== undefined) {
      return `${result.score}%`;
    }
    
    // اگر هیچ کدام وجود ندارد، "تکمیل شده" را نمایش بده
    return "تکمیل شده";
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      MBTI: "MBTI",
      DISC: "DISC",
      HOLLAND: "هالند",
      MSQ: "MSQ",
      CUSTOM: "سفارشی",
    };
    return labels[type] || type;
  };

  if (status === "loading" || loading) {
    return (
      <MobileLayout role="EMPLOYEE" title="داشبورد">
        <MobileDashboardSkeleton />
      </MobileLayout>
    );
  }

  if (session?.user.role !== "EMPLOYEE") {
    return null;
  }

  return (
    <MobileLayout role="EMPLOYEE" title="داشبورد">
      <ErrorBoundary>
      <div className="space-y-4">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">سلام {session?.user?.name}!</h2>
              <p className="text-blue-100">به پنل کارمند خوش آمدید</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">فیدبک‌های من</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.myTasks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">تسک‌های من</p>
          </div>

          <Link
            href="/mobile/employee/assessments"
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.assessments}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">آزمون‌ها</p>
          </Link>

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
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
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
            <p className="text-sm text-gray-600 dark:text-gray-400">نظرسنجی‌ها</p>
            {stats.newPolls > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.newPolls} جدید
              </p>
            )}
          </Link>
        </div>

        {/* Assessment Results */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            نتایج آزمون‌های شما
          </h3>
          {assessmentResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {assessmentResults.map((result) => (
                <Link
                  key={result.id}
                  href={`/assessments/${result.assessmentId}/result`}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-r-4 border-indigo-600 dark:border-indigo-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {result.assessment.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {getResultDisplay(result)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({getTypeLabel(result.assessment.type)})
                        </span>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
              <ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                هنوز هیچ نتیجه‌ای ثبت نشده است
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                پس از تکمیل آزمون‌ها، نتایج در اینجا نمایش داده می‌شود
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            دسترسی سریع
          </h3>

          <Link
            href="/mobile/tasks"
            className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 dark:text-white">تسک‌ها</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                مدیریت و پیگیری تسک‌ها
              </p>
            </div>
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
      </ErrorBoundary>
    </MobileLayout>
  );
}

