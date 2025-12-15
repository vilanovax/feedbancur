"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, Home, Loader2 } from "lucide-react";

interface AssessmentResult {
  id: string;
  score: number;
  personality: string;
  completedAt: string;
  assessment: {
    id: string;
    title: string;
    type: string;
    passingScore: number | null;
    showResults: boolean;
  };
}

export default function AssessmentResultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && assessmentId) {
      fetchResult();
    }
  }, [status, assessmentId]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/result`);

      if (!response.ok) {
        throw new Error("خطا در بارگذاری نتیجه");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Error fetching result:", error);
      setError(error.message || "خطا در بارگذاری نتیجه");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">در حال بارگذاری نتیجه...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">خطا</h3>
          <p className="text-gray-600 mb-4">{error || "نتیجه یافت نشد"}</p>
          <Button onClick={() => router.push("/")}>
            <Home className="w-4 h-4 ml-2" />
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    );
  }

  const isPassed = result.assessment.passingScore
    ? result.score >= result.assessment.passingScore
    : true;

  const getPersonalityDescription = (type: string, personality: string) => {
    if (type === "MBTI") {
      const descriptions: Record<string, string> = {
        INTJ: "معمار - استراتژیست خلاق با برنامه‌ای برای هر چیز",
        INTP: "منطق‌دان - مخترع نوآور با عطش دانش بی‌پایان",
        ENTJ: "فرمانده - رهبر قاطع با جسارت و اراده قوی",
        ENTP: "بحث‌کننده - متفکر هوشمند و کنجکاو",
        INFJ: "حامی - ایده‌آلیست ساکت و رازآلود اما الهام‌بخش",
        INFP: "میانجی - شاعرانه، مهربان و نوع‌دوست",
        ENFJ: "قهرمان - رهبر کاریزماتیک و الهام‌بخش",
        ENFP: "فعال - روحی مشتاق، خلاق و اجتماعی",
        ISTJ: "لجستیک‌کار - عملی و واقع‌گرا",
        ISFJ: "مدافع - محافظ فداکار و صبور",
        ESTJ: "مجری - مدیر عالی در اداره امور",
        ESFJ: "کنسول - دلسوز و محبوب و همیشه مشتاق کمک",
        ISTP: "صنعتگر - تجربه‌گر با سلطه بر ابزار",
        ISFP: "ماجراجو - هنرمند انعطاف‌پذیر و جذاب",
        ESTP: "کارآفرین - هوشمند، پرانرژی و هوشیار",
        ESFP: "سرگرم‌کننده - خودجوش، پرشور و سرگرم‌کننده",
      };
      return descriptions[personality] || personality;
    } else if (type === "DISC") {
      const descriptions: Record<string, string> = {
        D: "سلطه‌گر - مستقیم و نتیجه‌گرا",
        I: "تأثیرگذار - اجتماعی و متقاعدکننده",
        S: "پایدار - همکار صبور و قابل اعتماد",
        C: "با وجدان - دقیق و تحلیل‌گر",
      };
      return descriptions[personality] || personality;
    }
    return personality;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <div className="mb-4">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            آزمون با موفقیت تکمیل شد!
          </h1>
          <p className="text-gray-600">{result.assessment.title}</p>
        </div>

        {/* Results */}
        {result.assessment.showResults && (
          <div className="space-y-6">
            {/* Personality Type */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">نوع شخصیت شما</h2>
                  <p className="text-sm text-gray-600">بر اساس آزمون {result.assessment.type}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white text-center">
                <div className="text-5xl font-bold mb-2">{result.personality}</div>
                <p className="text-purple-100">
                  {getPersonalityDescription(result.assessment.type, result.personality)}
                </p>
              </div>
            </div>

            {/* Score */}
            {result.assessment.passingScore && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">نمره شما</h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-800">{result.score}</span>
                      <span className="text-gray-600">امتیاز</span>
                    </div>
                    {result.assessment.passingScore && (
                      <p className="text-sm text-gray-600 mt-2">
                        نمره قبولی: {result.assessment.passingScore}
                      </p>
                    )}
                  </div>
                  <div
                    className={`px-6 py-3 rounded-lg font-medium ${
                      isPassed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isPassed ? "قبول ✓" : "مردود ✗"}
                  </div>
                </div>
              </div>
            )}

            {/* Completion Date */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600">
                <p>
                  تاریخ تکمیل:{" "}
                  {new Date(result.completedAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {!result.assessment.showResults && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600">
              نتایج این آزمون برای شما نمایش داده نمی‌شود.
              <br />
              لطفاً با مدیر خود تماس بگیرید.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={() => {
              if (session?.user.role === "EMPLOYEE") {
                router.push("/mobile/employee/assessments");
              } else if (session?.user.role === "MANAGER") {
                router.push("/mobile/manager/assessments");
              } else {
                router.push("/");
              }
            }}
            size="lg"
          >
            <Home className="w-4 h-4 ml-2" />
            بازگشت به لیست آزمون‌ها
          </Button>
        </div>
      </div>
    </div>
  );
}
