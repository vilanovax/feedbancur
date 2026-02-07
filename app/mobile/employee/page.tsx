"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import MobileDashboardSkeleton from "@/components/MobileDashboardSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import Image from "next/image";
import { MessageSquare, CheckSquare, Trophy, User, Bell, BarChart3, ClipboardList, ArrowLeft, Newspaper } from "lucide-react";
import Link from "next/link";
import { badgeVariants } from "@/lib/design-tokens";

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
        {/* Welcome Card - کوچک‌تر و بهینه‌شده */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-lg p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {(session?.user as any)?.avatar ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                  <Image
                    src={(session.user as any).avatar}
                    alt="پروفایل"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">خوش آمدید</p>
              <h2 className="text-lg font-bold truncate">{session?.user?.name}</h2>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {stats.myFeedbacks}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">فیدبک‌ها</p>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
                <CheckSquare className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {stats.myTasks}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">تسک‌ها</p>
          </div>

          <Link
            href="/mobile/employee/assessments"
            className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {stats.assessments}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">آزمون‌ها</p>
          </Link>

          {/* اعلانات فعال */}
          <Link
            href="/mobile/announcements"
            className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="relative p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
                <Bell className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                {stats.newAnnouncements > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {stats.newAnnouncements}
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {stats.activeAnnouncements}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">اعلانات</p>
            {stats.newAnnouncements > 0 && (
              <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                {stats.newAnnouncements} جدید
              </p>
            )}
          </Link>

          {/* نظرسنجی‌های فعال */}
          <Link
            href="/mobile/polls"
            className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="relative p-2 rounded-lg bg-info-100 dark:bg-info-900/30">
                <BarChart3 className="w-5 h-5 text-info-600 dark:text-info-400" />
                {stats.newPolls > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {stats.newPolls}
                  </span>
                )}
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {stats.activePolls}
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">نظرسنجی‌ها</p>
            {stats.newPolls > 0 && (
              <p className="text-xs text-info-600 dark:text-info-400 mt-1">
                {stats.newPolls} جدید
              </p>
            )}
          </Link>

          {/* اطلاع‌رسانی‌ها */}
          <Link
            href="/mobile/updates"
            className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Newspaper className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">اطلاع‌رسانی‌ها</p>
            <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
              بهبودها و تغییرات
            </p>
          </Link>
        </div>

        {/* Assessment Results */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-secondary-800 dark:text-white">
            نتایج آزمون‌های بخش
          </h3>
          {assessmentResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {assessmentResults.map((result) => (
                <Link
                  key={result.id}
                  href={`/assessments/${result.assessmentId}/result`}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-r-4 border-purple-500"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badgeVariants.purple}`}>
                          {getTypeLabel(result.assessment.type)}
                        </span>
                        <h4 className="font-semibold text-secondary-800 dark:text-white text-sm">
                          {result.assessment.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {getResultDisplay(result)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {result.score !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-secondary-600 dark:text-secondary-400">نمره</span>
                            <span className="text-secondary-900 dark:text-white font-medium">{result.score}%</span>
                          </div>
                          <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                              style={{width: `${result.score}%`}}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <ArrowLeft className="w-5 h-5 text-secondary-400 dark:text-secondary-500 flex-shrink-0 mr-2" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-secondary-800 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
                هنوز آزمونی تکمیل نکرده‌اید
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                پس از تکمیل آزمون‌ها، نتایج در اینجا نمایش داده می‌شود
              </p>
              <Link
                href="/mobile/employee/assessments"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                مشاهده آزمون‌های موجود
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-secondary-800 dark:text-white">
            دسترسی سریع
          </h3>

          <Link
            href="/mobile/tasks"
            className="flex items-center gap-4 bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-secondary-800 dark:text-white">تسک‌ها</h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                مدیریت و پیگیری تسک‌ها
              </p>
            </div>
            <ArrowLeft className="w-5 h-5 text-secondary-400 flex-shrink-0" />
          </Link>

          <Link
            href="/mobile/public-board"
            className="flex items-center gap-4 bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-secondary-800 dark:text-white">
                بورد افتخارات
              </h4>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                تسک‌های تکمیل شده
              </p>
            </div>
            <ArrowLeft className="w-5 h-5 text-secondary-400 flex-shrink-0" />
          </Link>
        </div>
      </div>
      </ErrorBoundary>
    </MobileLayout>
  );
}

