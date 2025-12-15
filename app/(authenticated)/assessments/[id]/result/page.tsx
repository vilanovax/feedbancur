"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { ResultRadarChart } from "@/components/ResultRadarChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle2, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const assessmentId = params.id as string;
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تعیین مسیر بازگشت بر اساس نقش کاربر
  const getBackPath = () => {
    if (session?.user.role === "EMPLOYEE") {
      return "/mobile/employee/assessments";
    } else if (session?.user.role === "MANAGER") {
      return "/mobile/manager/assessments";
    }
    // برای ADMIN و سایر نقش‌ها
    return "/my-assessments";
  };

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/result`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch result");
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error("Error fetching result:", error);
      toast.error(error.message || "خطا در دریافت نتیجه");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقیقه و ${secs} ثانیه`;
  };

  const renderMBTIResult = (resultData: any) => {
    const scores = resultData.scores || {};
    const percentages = resultData.percentages || {};

    return (
      <>
        <Card className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="text-center pb-3 sm:pb-4 px-3 sm:px-6">
            <div className="mb-4 sm:mb-6">
              <div className="inline-block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl px-6 py-4 sm:px-10 sm:py-6 shadow-xl transform hover:scale-105 transition-transform">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider">{resultData.type}</div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              {resultData.typeName}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg md:text-xl text-gray-900 dark:text-white">نمودار ابعاد شخصیتی</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="w-full h-64 sm:h-80">
                <ResultRadarChart
                  data={{
                    labels: ["برونگرایی", "حسی", "فکری", "قضاوتی"],
                    values: [
                      percentages.E || 0,
                      percentages.S || 0,
                      percentages.T || 0,
                      percentages.J || 0,
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl text-gray-900 dark:text-white">ابعاد شخصیتی شما</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">برونگرا (E) / درونگرا (I)</span>
                  <span className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold whitespace-nowrap ${
                    scores.E > scores.I 
                      ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white" 
                      : "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                  }`}>
                    {scores.E > scores.I ? `E: ${percentages.E}%` : `I: ${percentages.I}%`}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">حسی (S) / شهودی (N)</span>
                  <span className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold whitespace-nowrap ${
                    scores.S > scores.N 
                      ? "bg-green-600 text-white dark:bg-green-500 dark:text-white" 
                      : "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white"
                  }`}>
                    {scores.S > scores.N ? `S: ${percentages.S}%` : `N: ${percentages.N}%`}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">فکری (T) / احساسی (F)</span>
                  <span className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold whitespace-nowrap ${
                    scores.T > scores.F 
                      ? "bg-orange-600 text-white dark:bg-orange-500 dark:text-white" 
                      : "bg-pink-600 text-white dark:bg-pink-500 dark:text-white"
                  }`}>
                    {scores.T > scores.F ? `T: ${percentages.T}%` : `F: ${percentages.F}%`}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">قضاوتی (J) / ادراکی (P)</span>
                  <span className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold whitespace-nowrap ${
                    scores.J > scores.P 
                      ? "bg-purple-600 text-white dark:bg-purple-500 dark:text-white" 
                      : "bg-violet-600 text-white dark:bg-violet-500 dark:text-white"
                  }`}>
                    {scores.J > scores.P ? `J: ${percentages.J}%` : `P: ${percentages.P}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {resultData.strengths && resultData.strengths.length > 0 && (
            <Card className="bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/50 dark:to-yellow-800/50 border-b-2 border-amber-300 dark:border-amber-700 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 sm:gap-3 text-amber-900 dark:text-amber-100 font-bold">
                  <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 rounded-lg sm:rounded-xl shadow-md">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  نقاط قوت
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white/50 dark:bg-gray-800/50 px-4 sm:px-6 pb-4 sm:pb-6">
                <ul className="space-y-2 sm:space-y-3">
                  {resultData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {resultData.careers && resultData.careers.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50 border-b-2 border-blue-300 dark:border-blue-700 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg md:text-xl text-blue-900 dark:text-blue-100 font-bold flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 rounded-lg sm:rounded-xl shadow-md">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  شغل‌های پیشنهادی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 bg-white/50 dark:bg-gray-800/50 px-4 sm:px-6 pb-4 sm:pb-6">
                <ul className="space-y-2 sm:space-y-3">
                  {resultData.careers.map((career: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">→</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{career}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  };

  const renderDISCResult = (resultData: any) => {
    const scores = resultData.scores || {};
    const percentages = resultData.percentages || {};

    return (
      <>
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
            <div className="mb-3 sm:mb-4">
              <div className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold">{resultData.type}</div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl">{resultData.typeName}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">نمودار پروفایل DISC</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="w-full h-64 sm:h-80">
                <ResultRadarChart
                  data={{
                    labels: ["سلطه‌گری (D)", "تأثیرگذاری (I)", "پایداری (S)", "وظیفه‌شناسی (C)"],
                    values: [
                      percentages.D || 0,
                      percentages.I || 0,
                      percentages.S || 0,
                      percentages.C || 0,
                    ],
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg md:text-xl">امتیازات DISC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">D - سلطه‌گری (Dominance)</span>
                  <Badge className="text-xs sm:text-sm w-fit">{percentages.D}%</Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${percentages.D}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">I - تأثیرگذاری (Influence)</span>
                  <Badge className="text-xs sm:text-sm w-fit">{percentages.I}%</Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${percentages.I}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">S - پایداری (Steadiness)</span>
                  <Badge className="text-xs sm:text-sm w-fit">{percentages.S}%</Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${percentages.S}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="font-medium text-sm sm:text-base">C - وظیفه‌شناسی (Conscientiousness)</span>
                  <Badge className="text-xs sm:text-sm w-fit">{percentages.C}%</Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percentages.C}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {resultData.strengths && resultData.strengths.length > 0 && (
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                ویژگی‌های اصلی
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <ul className="list-disc list-inside space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {resultData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-xs sm:text-sm">{strength}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderCustomResult = (resultData: any) => {
    return (
      <Card>
        <CardHeader className="text-center px-3 sm:px-6 py-4 sm:py-6">
          <div className="mb-3 sm:mb-4">
            <div className="inline-block bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold">{resultData.percentage}%</div>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl">نتیجه آزمون</CardTitle>
          {resultData.isPassed !== null && (
            <Badge
              variant={resultData.isPassed ? "default" : "destructive"}
              className="mt-2 text-xs sm:text-sm"
            >
              {resultData.isPassed ? "قبول" : "مردود"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="text-center space-y-2">
            <p className="text-sm sm:text-base text-muted-foreground">
              امتیاز کسب شده: {resultData.totalScore} از {resultData.maxScore}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!result || !result.result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-6xl">
        <div className="mb-4 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(getBackPath())}
            className="mb-3 sm:mb-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به آزمون‌های من
          </Button>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {result.assessment.title}
          </h1>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">تکمیل شده در {new Date(result.completedAt).toLocaleDateString("fa-IR")}</span>
            </div>
            {result.timeTaken && (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="whitespace-nowrap">زمان انجام: {formatTime(result.timeTaken)}</span>
              </div>
            )}
          </div>
        </div>

        {result.assessment.type === "MBTI" && renderMBTIResult(result.result)}
        {result.assessment.type === "DISC" && renderDISCResult(result.result)}
        {result.assessment.type === "CUSTOM" && renderCustomResult(result.result)}
          </div>
        </div>
      </main>
    </div>
  );
}
