"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import {
  ClipboardList,
  FileQuestion,
  Clock,
  Award,
  Info,
  XCircle,
  Play,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  instructions: string | null;
  isActive: boolean;
  allowRetake: boolean;
  timeLimit: number | null;
  passingScore: number | null;
  showResults: boolean;
  _count: {
    questions: number;
  };
}

export default function AssessmentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasCompleted, setHasCompleted] = useState(false);
  const [canStart, setCanStart] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role !== "EMPLOYEE") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user.role === "EMPLOYEE" && assessmentId) {
      fetchAssessment();
    }
  }, [session, assessmentId]);

  useEffect(() => {
    if (assessment) {
      checkCompletionStatus();
    }
  }, [assessment]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setError("آزمون یافت نشد یا شما دسترسی به این آزمون ندارید");
        } else if (response.status === 403) {
          setError("شما دسترسی به این آزمون ندارید");
        } else {
          setError(errorData.error || "خطا در بارگذاری اطلاعات آزمون");
        }
      }
    } catch (error) {
      console.error("Error fetching assessment:", error);
      setError("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید");
    } finally {
      setLoading(false);
    }
  };

  const checkCompletionStatus = async () => {
    if (!assessment) return;
    
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/result`);
      if (response.ok) {
        const result = await response.json();
        setHasCompleted(true);
        // اگر آزمون تکمیل شده و allowRetake false است، اجازه شروع مجدد نده
        if (!assessment.allowRetake) {
          setCanStart(false);
        } else {
          setCanStart(true);
        }
      } else if (response.status === 404) {
        // آزمون تکمیل نشده است
        setHasCompleted(false);
        setCanStart(true);
      }
    } catch (error) {
      console.error("Error checking completion status:", error);
      // در صورت خطا، اجازه شروع بده
      setCanStart(true);
    }
  };

  const handleStartAssessment = () => {
    if (!canStart) {
      toast.error("شما قبلاً این آزمون را تکمیل کرده‌اید و امکان تکرار وجود ندارد");
      return;
    }
    // ریدایرکت به صفحه انجام آزمون در بخش authenticated
    router.push(`/assessments/${assessmentId}/take`);
  };

  if (status === "loading" || loading) {
    return (
      <MobileLayout role="EMPLOYEE" title="جزئیات آزمون">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </MobileLayout>
    );
  }

  if (session?.user.role !== "EMPLOYEE") {
    return null;
  }

  if (error || !assessment) {
    return (
      <MobileLayout role="EMPLOYEE" title="خطا">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {error || "آزمون یافت نشد"}
          </h3>
          <button
            onClick={() => router.push("/mobile/employee/assessments")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            بازگشت به لیست آزمون‌ها
          </button>
        </div>
      </MobileLayout>
    );
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

  return (
    <MobileLayout role="EMPLOYEE" title="جزئیات آزمون">
      <div className="space-y-4">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{assessment.title}</h2>
              {assessment.description && (
                <p className="text-blue-100 text-sm">{assessment.description}</p>
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
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                assessment.isActive
                  ? "bg-green-500 text-white"
                  : "bg-gray-500 text-white"
              }`}
            >
              {assessment.isActive ? "فعال" : "غیرفعال"}
            </div>
            {assessment.allowRetake && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                قابل تکرار
              </div>
            )}
            {assessment.showResults && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                نمایش نتایج
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {assessment._count.questions}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">سوال</p>
              </div>
            </div>
          </div>

          {assessment.timeLimit && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {assessment.timeLimit}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">دقیقه</p>
                </div>
              </div>
            </div>
          )}

          {assessment.passingScore && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {assessment.passingScore}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    نمره قبولی
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {assessment.instructions && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800 dark:text-white">
                دستورالعمل‌ها
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {assessment.instructions}
            </p>
          </div>
        )}

        {/* Start Button */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          {hasCompleted && !assessment.allowRetake ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-3">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">آزمون تکمیل شده</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                شما قبلاً این آزمون را تکمیل کرده‌اید و امکان تکرار وجود ندارد
              </p>
              <Button
                onClick={() => router.push(`/assessments/${assessmentId}/result`)}
                variant="outline"
                className="w-full"
              >
                مشاهده نتیجه
              </Button>
            </div>
          ) : (
            <>
              <Button
                onClick={handleStartAssessment}
                disabled={!canStart}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-6 text-lg font-semibold rounded-lg flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6" />
                {hasCompleted ? "تکرار آزمون" : "شروع آزمون"}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                {hasCompleted 
                  ? "با کلیک روی دکمه بالا، می‌توانید آزمون را دوباره انجام دهید"
                  : "با کلیک روی دکمه بالا، آزمون شروع می‌شود"
                }
              </p>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
