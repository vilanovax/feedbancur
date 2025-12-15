"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { AssessmentCard } from "@/components/AssessmentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Eye, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AssessmentWithStatus {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  timeLimit?: number | null;
  _count: {
    questions: number;
  };
  assignment: {
    isRequired: boolean;
    startDate: string | null;
    endDate: string | null;
  };
  userStatus: {
    hasCompleted: boolean;
    canRetake: boolean;
    inProgress: boolean;
    lastQuestion: number;
    completedAt: string | null;
  };
}

export default function MyAssessmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch("/api/assessments/available");
      if (!response.ok) throw new Error("Failed to fetch assessments");

      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast.error("خطا در دریافت آزمون‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async (assessmentId: string) => {
    router.push(`/assessments/${assessmentId}/take`);
  };

  const availableAssessments = assessments.filter(
    (a) => !a.userStatus.hasCompleted && !a.userStatus.inProgress
  );
  const inProgressAssessments = assessments.filter(
    (a) => a.userStatus.inProgress
  );
  const completedAssessments = assessments.filter(
    (a) => a.userStatus.hasCompleted
  );

  const renderAssessmentCard = (assessment: AssessmentWithStatus) => {
    const isCompleted = assessment.userStatus.hasCompleted;
    const inProgress = assessment.userStatus.inProgress;
    const canRetake = assessment.userStatus.canRetake;
    const isRequired = assessment.assignment.isRequired;
    const endDate = assessment.assignment.endDate
      ? new Date(assessment.assignment.endDate)
      : null;
    const isExpiringSoon =
      endDate && endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

    return (
      <AssessmentCard
        key={assessment.id}
        assessment={assessment}
        actions={
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              {isRequired && (
                <Badge variant="destructive" className="text-xs">
                  اجباری
                </Badge>
              )}
              {isExpiringSoon && endDate && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 ml-1" />
                  {Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))}{" "}
                  روز مانده
                </Badge>
              )}
            </div>

            {inProgress && (
              <div className="text-sm text-gray-600">
                سوال {assessment.userStatus.lastQuestion + 1} از{" "}
                {assessment._count.questions}
              </div>
            )}

            <div className="flex gap-2">
              {!isCompleted && !inProgress && (
                <Button
                  className="flex-1"
                  onClick={() => handleStart(assessment.id)}
                >
                  <Play className="w-4 h-4 ml-2" />
                  شروع
                </Button>
              )}

              {inProgress && (
                <Button
                  className="flex-1"
                  onClick={() => handleStart(assessment.id)}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  ادامه
                </Button>
              )}

              {isCompleted && (
                <>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() =>
                      router.push(`/assessments/${assessment.id}/result`)
                    }
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    مشاهده نتیجه
                  </Button>
                  {canRetake && (
                    <Button
                      variant="outline"
                      onClick={() => handleStart(assessment.id)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      تکرار
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        }
      />
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] overflow-y-auto p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] overflow-y-auto p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">آزمون‌های من</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                مشاهده و انجام آزمون‌های اختصاص یافته
              </p>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  هیچ آزمونی برای شما تعریف نشده است
                </p>
              </div>
            ) : (
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="available">
              در دسترس ({availableAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              در حال انجام ({inProgressAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              تکمیل شده ({completedAssessments.length})
            </TabsTrigger>
          </TabsList>

              <TabsContent value="available" className="mt-6">
                {availableAssessments.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      همه آزمون‌های موجود را انجام داده‌اید
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableAssessments.map(renderAssessmentCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="mt-6">
                {inProgressAssessments.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      هیچ آزمون ناتمامی ندارید
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressAssessments.map(renderAssessmentCard)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {completedAssessments.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      هنوز هیچ آزمونی را تکمیل نکرده‌اید
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedAssessments.map(renderAssessmentCard)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
