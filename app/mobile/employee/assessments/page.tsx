"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { ClipboardList, FileQuestion, Play, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  isActive: boolean;
  timeLimit: number | null;
  _count: {
    questions: number;
  };
  userStatus?: {
    hasCompleted: boolean;
    inProgress: boolean;
    lastQuestion: number;
  };
  hasStarted?: boolean;
  hasCompleted?: boolean;
}

export default function EmployeeAssessmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "in-progress" | "completed">("available");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "EMPLOYEE") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "EMPLOYEE") {
      fetchAssessments();
    }
  }, [session]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch("/api/assessments/available");
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      }
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <MobileLayout role="EMPLOYEE" title="آزمون‌های شخصیت‌سنجی">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </MobileLayout>
    );
  }

  if (session?.user.role !== "EMPLOYEE") {
    return null;
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MBTI":
        return "MBTI";
      case "DISC":
        return "DISC";
      case "CUSTOM":
        return "سفارشی";
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "MBTI":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "DISC":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "CUSTOM":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Filter assessments based on status
  const availableAssessments = assessments.filter(
    (a) => {
      const hasCompleted = a.userStatus?.hasCompleted || a.hasCompleted || false;
      const inProgress = a.userStatus?.inProgress || a.hasStarted || false;
      return !hasCompleted && !inProgress;
    }
  );
  const inProgressAssessments = assessments.filter(
    (a) => {
      const hasCompleted = a.userStatus?.hasCompleted || a.hasCompleted || false;
      const inProgress = a.userStatus?.inProgress || a.hasStarted || false;
      return inProgress && !hasCompleted;
    }
  );
  const completedAssessments = assessments.filter(
    (a) => a.userStatus?.hasCompleted || a.hasCompleted || false
  );

  const getFilteredAssessments = () => {
    switch (activeTab) {
      case "available":
        return availableAssessments;
      case "in-progress":
        return inProgressAssessments;
      case "completed":
        return completedAssessments;
      default:
        return [];
    }
  };

  const filteredAssessments = getFilteredAssessments();

  return (
    <MobileLayout role="EMPLOYEE" title="آزمون‌های شخصیت‌سنجی">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-8 h-8" />
            <h2 className="text-2xl font-bold">آزمون‌های من</h2>
          </div>
          <p className="text-blue-100">
            مشاهده و انجام آزمون‌های اختصاص یافته
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "available"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              در دسترس ({availableAssessments.length})
            </button>
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "in-progress"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              در حال انجام ({inProgressAssessments.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              تکمیل شده ({completedAssessments.length})
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {assessments.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              آزمون موجود
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <FileQuestion className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {assessments.reduce((sum, a) => sum + a._count.questions, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">سوال</p>
          </div>
        </div>

        {/* Assessments List */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {activeTab === "available" && "همه آزمون‌های موجود را انجام داده‌اید"}
              {activeTab === "in-progress" && "هیچ آزمون ناتمامی ندارید"}
              {activeTab === "completed" && "هنوز هیچ آزمونی را تکمیل نکرده‌اید"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === "available" && "آزمون جدیدی برای شما تخصیص داده نشده است"}
              {activeTab === "in-progress" && "شما در حال حاضر هیچ آزمونی را شروع نکرده‌اید"}
              {activeTab === "completed" && "پس از تکمیل آزمون‌ها، نتایج در اینجا نمایش داده می‌شود"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((assessment) => {
              const hasCompleted = assessment.userStatus?.hasCompleted || assessment.hasCompleted || false;
              const inProgress = assessment.userStatus?.inProgress || assessment.hasStarted || false;
              
              return (
                <Link
                  key={assessment.id}
                  href={`/mobile/employee/assessments/${assessment.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-r-4 border-blue-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                        {assessment.title}
                      </h3>
                      {assessment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                        assessment.type
                      )}`}
                    >
                      {getTypeLabel(assessment.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      <span>{assessment._count.questions} سوال</span>
                    </div>
                    {assessment.timeLimit && (
                      <div className="flex items-center gap-1">
                        <span>⏱️ {assessment.timeLimit} دقیقه</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    {hasCompleted ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">تکمیل شده</span>
                      </div>
                    ) : inProgress ? (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Play className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          سوال {assessment.userStatus?.lastQuestion ? assessment.userStatus.lastQuestion + 1 : 1} از {assessment._count.questions}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Play className="w-4 h-4" />
                        <span className="text-sm font-medium">شروع آزمون</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
