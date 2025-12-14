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
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full px-8 py-4">
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
              <CardTitle>نمودار ابعاد شخصیتی</CardTitle>
            </CardHeader>
            <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ابعاد شخصیتی شما</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">برونگرا (E) / درونگرا (I)</span>
                  <Badge variant={scores.E > scores.I ? "default" : "secondary"}>
                    {scores.E > scores.I ? `E: ${percentages.E}%` : `I: ${percentages.I}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">حسی (S) / شهودی (N)</span>
                  <Badge variant={scores.S > scores.N ? "default" : "secondary"}>
                    {scores.S > scores.N ? `S: ${percentages.S}%` : `N: ${percentages.N}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">فکری (T) / احساسی (F)</span>
                  <Badge variant={scores.T > scores.F ? "default" : "secondary"}>
                    {scores.T > scores.F ? `T: ${percentages.T}%` : `F: ${percentages.F}%`}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">قضاوتی (J) / ادراکی (P)</span>
                  <Badge variant={scores.J > scores.P ? "default" : "secondary"}>
                    {scores.J > scores.P ? `J: ${percentages.J}%` : `P: ${percentages.P}%`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {resultData.strengths && resultData.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  نقاط قوت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {resultData.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-sm">{strength}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {resultData.careers && resultData.careers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">شغل‌های پیشنهادی</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {resultData.careers.map((career: string, index: number) => (
                    <li key={index} className="text-sm">{career}</li>
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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/my-assessments")}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت به آزمون‌ها
        </Button>
        <h1 className="text-3xl font-bold">{result.assessment.title}</h1>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            تکمیل شده در {new Date(result.completedAt).toLocaleDateString("fa-IR")}
          </div>
          {result.timeTaken && (
            <div className="flex items-center gap-2">
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
  );
}
