"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import MobileLayout from "@/components/MobileLayout";
import { ResultRadarChart } from "@/components/ResultRadarChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle2, Clock, Trophy, Maximize2, X } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const assessmentId = params.id as string;
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // تشخیص موبایل
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    // تعیین رنگ و گرادیانت بر اساس نوع DISC
    const getTypeStyle = (type: string) => {
      switch (type?.toUpperCase()) {
        case "D":
          return {
            gradient: "from-red-500 via-orange-500 to-red-600",
            bgGradient: "from-red-50 via-orange-50 to-red-100 dark:from-red-900/40 dark:via-orange-900/40 dark:to-red-900/40",
            borderColor: "border-red-300 dark:border-red-700",
            headerGradient: "from-red-200 to-orange-200 dark:from-red-800/50 dark:to-orange-800/50",
            iconBg: "bg-gradient-to-br from-red-400 to-orange-500"
          };
        case "I":
          return {
            gradient: "from-yellow-400 via-amber-500 to-yellow-600",
            bgGradient: "from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/40 dark:via-amber-900/40 dark:to-yellow-900/40",
            borderColor: "border-yellow-300 dark:border-yellow-700",
            headerGradient: "from-yellow-200 to-amber-200 dark:from-yellow-800/50 dark:to-amber-800/50",
            iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500"
          };
        case "S":
          return {
            gradient: "from-green-500 via-emerald-500 to-green-600",
            bgGradient: "from-green-50 via-emerald-50 to-green-100 dark:from-green-900/40 dark:via-emerald-900/40 dark:to-green-900/40",
            borderColor: "border-green-300 dark:border-green-700",
            headerGradient: "from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50",
            iconBg: "bg-gradient-to-br from-green-400 to-emerald-500"
          };
        case "C":
          return {
            gradient: "from-blue-500 via-indigo-500 to-blue-600",
            bgGradient: "from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-blue-900/40",
            borderColor: "border-blue-300 dark:border-blue-700",
            headerGradient: "from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50",
            iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500"
          };
        default:
          return {
            gradient: "from-blue-500 to-green-500",
            bgGradient: "from-blue-50 to-green-50 dark:from-blue-900/40 dark:to-green-900/40",
            borderColor: "border-blue-300 dark:border-blue-700",
            headerGradient: "from-blue-200 to-green-200 dark:from-blue-800/50 dark:to-green-800/50",
            iconBg: "bg-gradient-to-br from-blue-400 to-green-500"
          };
      }
    };

    const typeStyle = getTypeStyle(resultData.type);

    return (
      <>
        <Card className={`mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br ${typeStyle.bgGradient} border-2 ${typeStyle.borderColor} shadow-xl overflow-hidden`}>
          <CardHeader className="text-center px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-8">
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div className="inline-flex items-center justify-center">
                <div className={`relative ${typeStyle.iconBg} rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                    {resultData.type}
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white rounded-full opacity-80 animate-pulse"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 px-2">
              {resultData.typeName}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white font-medium leading-relaxed max-w-2xl mx-auto px-2">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* نمودار پروفایل DISC */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 dark:text-white font-bold">
                نمودار پروفایل DISC
              </CardTitle>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChartModalOpen(true);
                }}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="بزرگنمایی نمودار"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            </CardHeader>
          <CardContent 
            className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 cursor-pointer"
            onClick={() => setIsChartModalOpen(true)}
          >
            <div className="w-full h-48 sm:h-56 md:h-64 lg:h-80">
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
            <div className="mt-2 text-center">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                برای مشاهده کامل نمودار کلیک کنید
              </span>
              </div>
            </CardContent>
          </Card>

        {/* مودال نمودار */}
        {isChartModalOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setIsChartModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} p-4 sm:p-6`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    نمودار پروفایل DISC
                  </h2>
                  <button
                    onClick={() => setIsChartModalOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 p-2 rounded-lg transition"
                    aria-label="بستن"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Chart Content */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="w-full h-[60vh] min-h-[400px] sm:min-h-[500px]">
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
              </div>
            </div>
          </div>
        )}

        {/* امتیازات DISC */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5`}>
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 dark:text-white font-bold">
              امتیازات DISC
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6">
              {/* D - Dominance */}
              <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                    D - سلطه‌گری (Dominance)
                  </span>
                  <Badge className="text-xs sm:text-sm w-fit bg-red-500 text-white border-red-600 shrink-0">
                    {percentages.D || 0}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${percentages.D || 0}%` }}
                  />
                </div>
              </div>

              {/* I - Influence */}
              <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                    I - تأثیرگذاری (Influence)
                  </span>
                  <Badge className="text-xs sm:text-sm w-fit bg-yellow-500 text-white border-yellow-600 shrink-0">
                    {percentages.I || 0}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${percentages.I || 0}%` }}
                  />
                </div>
              </div>

              {/* S - Steadiness */}
              <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                    S - پایداری (Steadiness)
                  </span>
                  <Badge className="text-xs sm:text-sm w-fit bg-green-500 text-white border-green-600 shrink-0">
                    {percentages.S || 0}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${percentages.S || 0}%` }}
                  />
                </div>
              </div>

              {/* C - Conscientiousness */}
              <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                    C - وظیفه‌شناسی (Conscientiousness)
                  </span>
                  <Badge className="text-xs sm:text-sm w-fit bg-blue-500 text-white border-blue-600 shrink-0">
                    {percentages.C || 0}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${percentages.C || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        {resultData.strengths && resultData.strengths.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/50 dark:to-yellow-800/50 border-b-2 border-amber-300 dark:border-amber-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl flex items-center gap-2 sm:gap-3 text-amber-900 dark:text-amber-100 font-bold">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 rounded-lg shadow-md shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span>ویژگی‌های اصلی</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {resultData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors bg-white/70 dark:bg-gray-800/70 border border-amber-200 dark:border-amber-800">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base break-words">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderHollandResult = (resultData: any) => {
    const scores = resultData.scores || {};
    const percentages = resultData.percentages || {};
    
    // تعیین رنگ و گرادیانت بر اساس نوع هالند
    const getTypeStyle = (type: string) => {
      const primaryType = type.charAt(0);
      switch (primaryType?.toUpperCase()) {
        case "R":
          return {
            gradient: "from-orange-500 via-red-500 to-orange-600",
            bgGradient: "from-orange-50 via-red-50 to-orange-100 dark:from-orange-900/40 dark:via-red-900/40 dark:to-orange-900/40",
            borderColor: "border-orange-300 dark:border-orange-700",
            headerGradient: "from-orange-200 to-red-200 dark:from-orange-800/50 dark:to-red-800/50",
            iconBg: "bg-gradient-to-br from-orange-400 to-red-500"
          };
        case "I":
          return {
            gradient: "from-blue-500 via-indigo-500 to-blue-600",
            bgGradient: "from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-blue-900/40",
            borderColor: "border-blue-300 dark:border-blue-700",
            headerGradient: "from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50",
            iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500"
          };
        case "A":
          return {
            gradient: "from-pink-500 via-purple-500 to-pink-600",
            bgGradient: "from-pink-50 via-purple-50 to-pink-100 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-pink-900/40",
            borderColor: "border-pink-300 dark:border-pink-700",
            headerGradient: "from-pink-200 to-purple-200 dark:from-pink-800/50 dark:to-purple-800/50",
            iconBg: "bg-gradient-to-br from-pink-400 to-purple-500"
          };
        case "S":
          return {
            gradient: "from-green-500 via-emerald-500 to-green-600",
            bgGradient: "from-green-50 via-emerald-50 to-green-100 dark:from-green-900/40 dark:via-emerald-900/40 dark:to-green-900/40",
            borderColor: "border-green-300 dark:border-green-700",
            headerGradient: "from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50",
            iconBg: "bg-gradient-to-br from-green-400 to-emerald-500"
          };
        case "E":
          return {
            gradient: "from-yellow-500 via-amber-500 to-yellow-600",
            bgGradient: "from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-900/40 dark:via-amber-900/40 dark:to-yellow-900/40",
            borderColor: "border-yellow-300 dark:border-yellow-700",
            headerGradient: "from-yellow-200 to-amber-200 dark:from-yellow-800/50 dark:to-amber-800/50",
            iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500"
          };
        case "C":
          return {
            gradient: "from-gray-500 via-slate-500 to-gray-600",
            bgGradient: "from-gray-50 via-slate-50 to-gray-100 dark:from-gray-900/40 dark:via-slate-900/40 dark:to-gray-900/40",
            borderColor: "border-gray-300 dark:border-gray-700",
            headerGradient: "from-gray-200 to-slate-200 dark:from-gray-800/50 dark:to-slate-800/50",
            iconBg: "bg-gradient-to-br from-gray-400 to-slate-500"
          };
        default:
          return {
            gradient: "from-green-500 to-emerald-500",
            bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40",
            borderColor: "border-green-300 dark:border-green-700",
            headerGradient: "from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50",
            iconBg: "bg-gradient-to-br from-green-400 to-emerald-500"
          };
      }
    };

    const typeStyle = getTypeStyle(resultData.type);
    
    // نام‌های فارسی برای تیپ‌های هالند
    const typeNames: { [key: string]: string } = {
      R: "واقع‌گرا",
      I: "جستجوگر",
      A: "هنری",
      S: "اجتماعی",
      E: "متهور",
      C: "قراردادی",
    };

    const getTypeName = (type: string) => {
      return type.split("").map(t => typeNames[t] || t).join(" - ");
    };

    return (
      <>
        <Card className={`mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br ${typeStyle.bgGradient} border-2 ${typeStyle.borderColor} shadow-xl overflow-hidden`}>
          <CardHeader className="text-center px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-8">
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div className="inline-flex items-center justify-center">
                <div className={`relative ${typeStyle.iconBg} rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                    {resultData.type}
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white rounded-full opacity-80 animate-pulse"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 px-2">
              {getTypeName(resultData.type)}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white font-medium leading-relaxed max-w-2xl mx-auto px-2">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* نمودار پروفایل هالند */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 dark:text-white font-bold">
                نمودار پروفایل هالند
              </CardTitle>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChartModalOpen(true);
                }}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-label="بزرگنمایی نمودار"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </CardHeader>
          <CardContent 
            className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 cursor-pointer"
            onClick={() => setIsChartModalOpen(true)}
          >
            <div className="w-full h-48 sm:h-56 md:h-64 lg:h-80">
              <ResultRadarChart
                data={{
                  labels: ["واقع‌گرا (R)", "جستجوگر (I)", "هنری (A)", "اجتماعی (S)", "متهور (E)", "قراردادی (C)"],
                  values: [
                    percentages.R || 0,
                    percentages.I || 0,
                    percentages.A || 0,
                    percentages.S || 0,
                    percentages.E || 0,
                    percentages.C || 0,
                  ],
                }}
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                برای مشاهده کامل نمودار کلیک کنید
              </span>
            </div>
          </CardContent>
        </Card>

        {/* مودال نمودار */}
        {isChartModalOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setIsChartModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} p-4 sm:p-6`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    نمودار پروفایل هالند
                  </h2>
                  <button
                    onClick={() => setIsChartModalOpen(false)}
                    className="text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/50 p-2 rounded-lg transition"
                    aria-label="بستن"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Chart Content */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="w-full h-[60vh] min-h-[400px] sm:min-h-[500px]">
                  <ResultRadarChart
                    data={{
                      labels: ["واقع‌گرا (R)", "جستجوگر (I)", "هنری (A)", "اجتماعی (S)", "متهور (E)", "قراردادی (C)"],
                      values: [
                        percentages.R || 0,
                        percentages.I || 0,
                        percentages.A || 0,
                        percentages.S || 0,
                        percentages.E || 0,
                        percentages.C || 0,
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* امتیازات هالند */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <CardHeader className={`bg-gradient-to-r ${typeStyle.headerGradient} border-b ${typeStyle.borderColor} px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5`}>
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-900 dark:text-white font-bold">
              امتیازات هالند
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6">
            {/* R - Realistic */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  R - واقع‌گرا (Realistic)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-orange-500 text-white border-orange-600 shrink-0">
                  {percentages.R || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.R || 0}%` }}
                />
              </div>
            </div>

            {/* I - Investigative */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  I - جستجوگر (Investigative)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-blue-500 text-white border-blue-600 shrink-0">
                  {percentages.I || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.I || 0}%` }}
                />
              </div>
            </div>

            {/* A - Artistic */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  A - هنری (Artistic)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-pink-500 text-white border-pink-600 shrink-0">
                  {percentages.A || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.A || 0}%` }}
                />
              </div>
            </div>

            {/* S - Social */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  S - اجتماعی (Social)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-green-500 text-white border-green-600 shrink-0">
                  {percentages.S || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.S || 0}%` }}
                />
              </div>
            </div>

            {/* E - Enterprising */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  E - متهور (Enterprising)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-yellow-500 text-white border-yellow-600 shrink-0">
                  {percentages.E || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.E || 0}%` }}
                />
              </div>
        </div>

            {/* C - Conventional */}
            <div className="space-y-2 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/30">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 dark:text-white break-words">
                  C - قراردادی (Conventional)
                </span>
                <Badge className="text-xs sm:text-sm w-fit bg-gray-500 text-white border-gray-600 shrink-0">
                  {percentages.C || 0}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-gray-500 via-gray-600 to-slate-600 h-2.5 sm:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${percentages.C || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نقاط قوت و مهارت‌ها */}
        {resultData.strengths && resultData.strengths.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-200 to-yellow-200 dark:from-amber-800/50 dark:to-yellow-800/50 border-b-2 border-amber-300 dark:border-amber-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl flex items-center gap-2 sm:gap-3 text-amber-900 dark:text-amber-100 font-bold">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 rounded-lg shadow-md shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span>نقاط قوت و مهارت‌ها</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {resultData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors bg-white/70 dark:bg-gray-800/70 border border-amber-200 dark:border-amber-800">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base break-words">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* شغل‌های پیشنهادی */}
        {resultData.careers && resultData.careers.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-purple-900/40 border-2 border-blue-300 dark:border-blue-700 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50 border-b-2 border-blue-300 dark:border-blue-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-900 dark:text-blue-100 font-bold flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 rounded-lg shadow-md shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>شغل‌های پیشنهادی</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {resultData.careers.map((career: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors bg-white/70 dark:bg-gray-800/70 border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">→</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base break-words">{career}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* محیط کار مناسب */}
        {resultData.workEnvironment && resultData.workEnvironment.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/40 dark:via-teal-900/40 dark:to-cyan-900/40 border-2 border-emerald-300 dark:border-emerald-700 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-200 to-teal-200 dark:from-emerald-800/50 dark:to-teal-800/50 border-b-2 border-emerald-300 dark:border-emerald-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-emerald-900 dark:text-emerald-100 font-bold flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-600 rounded-lg shadow-md shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span>محیط کار مناسب</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {resultData.workEnvironment.map((env: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors bg-white/70 dark:bg-gray-800/70 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">🏢</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base break-words">{env}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderMSQResult = (resultData: any) => {
    const { scores, percentages, level, description, intrinsicDescription, extrinsicDescription, recommendations } = resultData;

    const getLevelColor = (level: string) => {
      switch (level) {
        case "خیلی بالا":
          return {
            bg: "from-green-500 to-emerald-500",
            text: "text-green-700 dark:text-green-300",
            badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          };
        case "بالا":
          return {
            bg: "from-blue-500 to-cyan-500",
            text: "text-blue-700 dark:text-blue-300",
            badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          };
        case "متوسط":
          return {
            bg: "from-yellow-500 to-orange-500",
            text: "text-yellow-700 dark:text-yellow-300",
            badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          };
        case "پایین":
          return {
            bg: "from-orange-500 to-red-500",
            text: "text-orange-700 dark:text-orange-300",
            badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
          };
        case "خیلی پایین":
          return {
            bg: "from-red-500 to-pink-500",
            text: "text-red-700 dark:text-red-300",
            badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          };
        default:
          return {
            bg: "from-gray-500 to-slate-500",
            text: "text-gray-700 dark:text-gray-300",
            badge: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
          };
      }
    };

    const levelColor = getLevelColor(level);

    // داده‌های برای نمودار
    const chartData = {
      labels: ["رضایت درونی", "رضایت بیرونی", "رضایت کل"],
      values: [percentages.intrinsic, percentages.extrinsic, percentages.total],
    };

    return (
      <>
        {/* کارت اصلی */}
        <Card className={`mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/40 dark:via-amber-900/40 dark:to-yellow-900/40 border-2 border-orange-300 dark:border-orange-700 shadow-xl overflow-hidden`}>
          <CardHeader className="text-center px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-8">
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div className="inline-flex items-center justify-center">
                <div className={`relative bg-gradient-to-br ${levelColor.bg} rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300`}>
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                    {percentages.total}%
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white rounded-full opacity-80 animate-pulse"></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 px-2">
              سطح رضایت شغلی: {level}
            </CardTitle>
            <Badge className={`${levelColor.badge} text-sm sm:text-base px-3 py-1 mb-3 sm:mb-4`}>
              {level}
            </Badge>
            <CardDescription className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white font-medium leading-relaxed max-w-2xl mx-auto px-2">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* نمودار رضایت */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 border-b-2 border-orange-300 dark:border-orange-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-orange-900 dark:text-orange-100 font-bold flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-600 rounded-lg shadow-md shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span>نمودار رضایت شغلی</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChartModalOpen(true)}
                className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent 
            className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50 cursor-pointer"
            onClick={() => setIsChartModalOpen(true)}
          >
            <div className="h-48 sm:h-56 md:h-64 lg:h-80">
              <ResultRadarChart data={chartData} />
            </div>
          </CardContent>
        </Card>

        {/* امتیازات تفصیلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
          {/* رضایت درونی */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-800/50 dark:to-cyan-800/50 border-b-2 border-blue-300 dark:border-blue-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <CardTitle className="text-sm sm:text-base md:text-lg text-blue-900 dark:text-blue-100 font-bold">
                رضایت درونی
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
              <div className="mb-3 sm:mb-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {percentages.intrinsic}%
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  امتیاز: {scores.intrinsic} از {12 * 5}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 sm:h-4 rounded-full transition-all duration-500"
                  style={{ width: `${percentages.intrinsic}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {intrinsicDescription}
              </p>
            </CardContent>
          </Card>

          {/* رضایت بیرونی */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-2 border-purple-300 dark:border-purple-700 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50 border-b-2 border-purple-300 dark:border-purple-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <CardTitle className="text-sm sm:text-base md:text-lg text-purple-900 dark:text-purple-100 font-bold">
                رضایت بیرونی
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
              <div className="mb-3 sm:mb-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {percentages.extrinsic}%
                </div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  امتیاز: {scores.extrinsic} از {8 * 5}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 mb-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 sm:h-4 rounded-full transition-all duration-500"
                  style={{ width: `${percentages.extrinsic}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {extrinsicDescription}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* توصیه‌ها */}
        {recommendations && recommendations.length > 0 && (
          <Card className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-teal-900/40 dark:via-cyan-900/40 dark:to-blue-900/40 border-2 border-teal-300 dark:border-teal-700 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-200 to-cyan-200 dark:from-teal-800/50 dark:to-cyan-800/50 border-b-2 border-teal-300 dark:border-teal-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-teal-900 dark:text-teal-100 font-bold flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-600 rounded-lg shadow-md shrink-0">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span>توصیه‌ها و پیشنهادات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 pt-3 sm:pt-4 md:pt-6 bg-white/50 dark:bg-gray-800/50">
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                {recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors bg-white/70 dark:bg-gray-800/70 border border-teal-200 dark:border-teal-800">
                    <span className="text-teal-600 dark:text-teal-400 mt-0.5 sm:mt-1 font-bold text-base sm:text-lg flex-shrink-0">✓</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base break-words">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* مودال نمودار */}
        {isChartModalOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setIsChartModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 border-b-2 border-orange-300 dark:border-orange-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-orange-900 dark:text-orange-100">
                  نمودار کامل رضایت شغلی
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChartModalOpen(false)}
                  className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 sm:p-6 md:p-8">
                <div className="h-96 sm:h-[500px] md:h-[600px]">
                  <ResultRadarChart data={chartData} maxValue={100} />
                </div>
              </div>
            </div>
          </div>
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

  // محتوای صفحه
  const pageContent = (
    <>
      <div className="mb-3 sm:mb-4 md:mb-8">
        {!isMobile && (
          <Button
            variant="ghost"
            onClick={() => router.push(getBackPath())}
            className="mb-3 sm:mb-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm sm:text-base"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به آزمون‌های من
          </Button>
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {result?.assessment?.title || "نتیجه آزمون"}
          </h1>
        {result && (
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
        )}
        </div>

      {result && result.assessment && (
        <>
        {result.assessment.type === "MBTI" && renderMBTIResult(result.result)}
        {result.assessment.type === "DISC" && renderDISCResult(result.result)}
          {result.assessment.type === "HOLLAND" && renderHollandResult(result.result)}
          {result.assessment.type === "MSQ" && renderMSQResult(result.result)}
        {result.assessment.type === "CUSTOM" && renderCustomResult(result.result)}
        </>
      )}
    </>
  );

  // Loading state
  if (isLoading) {
    if (isMobile && session?.user?.role) {
      const userRole = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";
      return (
        <MobileLayout role={userRole} title="نتیجه آزمون">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </MobileLayout>
      );
    }
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

  // No result state
  if (!result || !result.result) {
    if (isMobile && session?.user?.role) {
      const userRole = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";
      return (
        <MobileLayout role={userRole} title="نتیجه آزمون">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
          </div>
        </MobileLayout>
      );
    }
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

  // Mobile view
  if (isMobile && session?.user?.role) {
    const userRole = session.user.role === "EMPLOYEE" ? "EMPLOYEE" : "MANAGER";
    return (
      <MobileLayout 
        role={userRole} 
        title={result.assessment.title}
        showBackButton={true}
        backHref={getBackPath()}
      >
        <div className="px-2">
          {pageContent}
        </div>
      </MobileLayout>
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
        <div className="p-2 sm:p-4 md:p-6 lg:p-8">
          <div className="container mx-auto max-w-6xl">
            {pageContent}
          </div>
        </div>
      </main>
    </div>
  );
}
