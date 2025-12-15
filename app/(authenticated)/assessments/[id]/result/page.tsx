"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResultRadarChart } from "@/components/ResultRadarChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CheckCircle2, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        <Card className="mb-6 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mb-6">
              <div className="inline-block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-2xl px-10 py-6 shadow-xl transform hover:scale-105 transition-transform">
                <div className="text-6xl font-bold tracking-wider">{resultData.type}</div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {resultData.typeName}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-xl text-gray-900 dark:text-white">نمودار ابعاد شخصیتی</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-xl text-gray-900 dark:text-white">ابعاد شخصیتی شما</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">برونگرا (E) / درونگرا (I)</span>
                  <Badge variant={scores.E > scores.I ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {scores.E > scores.I ? `E: ${percentages.E}%` : `I: ${percentages.I}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">حسی (S) / شهودی (N)</span>
                  <Badge variant={scores.S > scores.N ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {scores.S > scores.N ? `S: ${percentages.S}%` : `N: ${percentages.N}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">فکری (T) / احساسی (F)</span>
                  <Badge variant={scores.T > scores.F ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {scores.T > scores.F ? `T: ${percentages.T}%` : `F: ${percentages.F}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">قضاوتی (J) / ادراکی (P)</span>
                  <Badge variant={scores.J > scores.P ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {scores.J > scores.P ? `J: ${percentages.J}%` : `P: ${percentages.P}%`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resultData.strengths && resultData.strengths.length > 0 && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg">
              <CardHeader className="border-b border-yellow-200 dark:border-yellow-800">
                <CardTitle className="text-xl flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-yellow-400 dark:bg-yellow-600 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-900 dark:text-yellow-100" />
                  </div>
                  نقاط قوت
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {resultData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-yellow-500 dark:text-yellow-400 mt-1">•</span>
                      <span className="font-medium">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {resultData.careers && resultData.careers.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="border-b border-blue-200 dark:border-blue-800">
                <CardTitle className="text-xl text-gray-900 dark:text-white">شغل‌های پیشنهادی</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {resultData.careers.map((career: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 mt-1">•</span>
                      <span className="font-medium">{career}</span>
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
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full px-8 py-4">
                <div className="text-5xl font-bold">{resultData.type}</div>
              </div>
            </div>
            <CardTitle className="text-2xl">{resultData.typeName}</CardTitle>
            <CardDescription className="text-base">
              {resultData.description}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>نمودار پروفایل DISC</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">امتیازات DISC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">D - سلطه‌گری (Dominance)</span>
                  <Badge>{percentages.D}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${percentages.D}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">I - تأثیرگذاری (Influence)</span>
                  <Badge>{percentages.I}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${percentages.I}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">S - پایداری (Steadiness)</span>
                  <Badge>{percentages.S}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${percentages.S}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">C - وظیفه‌شناسی (Conscientiousness)</span>
                  <Badge>{percentages.C}%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                ویژگی‌های اصلی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 grid md:grid-cols-2 gap-4">
                {resultData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-sm">{strength}</li>
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
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="inline-block bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-full px-8 py-4">
              <div className="text-5xl font-bold">{resultData.percentage}%</div>
            </div>
          </div>
          <CardTitle className="text-2xl">نتیجه آزمون</CardTitle>
          {resultData.isPassed !== null && (
            <Badge
              variant={resultData.isPassed ? "default" : "destructive"}
              className="mt-2"
            >
              {resultData.isPassed ? "قبول" : "مردود"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              امتیاز کسب شده: {resultData.totalScore} از {resultData.maxScore}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result || !result.result) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/my-assessments")}
            className="mb-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت به آزمون‌ها
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {result.assessment.title}
          </h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              تکمیل شده در {new Date(result.completedAt).toLocaleDateString("fa-IR")}
            </div>
            {result.timeTaken && (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                زمان انجام: {formatTime(result.timeTaken)}
              </div>
            )}
          </div>
        </div>

        {result.assessment.type === "MBTI" && renderMBTIResult(result.result)}
        {result.assessment.type === "DISC" && renderDISCResult(result.result)}
        {result.assessment.type === "CUSTOM" && renderCustomResult(result.result)}
      </div>
    </div>
  );
}
