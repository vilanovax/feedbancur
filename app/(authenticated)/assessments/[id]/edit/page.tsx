"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { AssessmentForm } from "@/components/AssessmentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EditAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => {
    if (session?.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchAssessment();
  }, [session]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`);
      if (!response.ok) throw new Error("Failed to fetch assessment");

      const data = await response.json();
      setAssessment(data);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      toast.error("خطا در بارگذاری آزمون");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssessment = async (data: any) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update assessment");

      toast.success("آزمون با موفقیت به‌روزرسانی شد");
      await fetchAssessment();
    } catch (error) {
      console.error("Error updating assessment:", error);
      toast.error("خطا در به‌روزرسانی آزمون");
      throw error;
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/assessments/${assessmentId}/questions/${questionId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete question");

      toast.success("سوال حذف شد");
      await fetchAssessment();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("خطا در حذف سوال");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete assessment");
      }

      toast.success("آزمون حذف شد");
      router.push("/assessments");
    } catch (error: any) {
      console.error("Error deleting assessment:", error);
      toast.error(error.message || "خطا در حذف آزمون");
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "چند گزینه‌ای";
      case "RATING_SCALE":
        return "مقیاس امتیازی";
      case "TRUE_FALSE":
        return "بله/خیر";
      case "TEXT":
        return "متن آزاد";
      default:
        return type;
    }
  };

  if (session?.user.role !== "ADMIN") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">آزمون یافت نشد</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push("/assessments")}
                className="mb-4"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                بازگشت
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">ویرایش آزمون</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Assessment Form */}
              <div className="md:col-span-1">
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">مشخصات آزمون</CardTitle>
                  </CardHeader>
                  <CardContent>
              <AssessmentForm
                initialData={assessment}
                onSubmit={handleUpdateAssessment}
                submitLabel="به‌روزرسانی"
              />

              <div className="mt-6 pt-6 border-t">
                <AlertDialog>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (assessment._count?.results > 0) {
                        toast.error(
                          "نمی‌توانید آزمونی با نتایج موجود را حذف کنید"
                        );
                      } else {
                        document.getElementById("delete-dialog-trigger")?.click();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف آزمون
                  </Button>
                  <button
                    id="delete-dialog-trigger"
                    className="hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      const dialog = document.querySelector(
                        '[role="alertdialog"]'
                      ) as HTMLElement;
                      if (dialog) dialog.style.display = "block";
                    }}
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف آزمون</AlertDialogTitle>
                      <AlertDialogDescription>
                        آیا مطمئن هستید؟ این عمل قابل بازگشت نیست.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAssessment}>
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

              {/* Right Column - Questions List */}
              <div className="md:col-span-2">
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-900 dark:text-white">سوالات آزمون</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {questions.length} سوال
                        </p>
                      </div>
                <Button
                  onClick={() =>
                    router.push(`/assessments/${assessmentId}/questions/new`)
                  }
                  disabled
                  variant="outline"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن سوال
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                    {questions.length === 0 ? (
                      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>هنوز سوالی اضافه نشده است</p>
                        <p className="text-sm mt-2">
                          این آزمون از seed script ساخته شده است
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                      <div className="flex-shrink-0 mt-1">
                        <GripVertical className="w-5 h-5 text-gray-500 dark:text-gray-400 cursor-move" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                              <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                {getQuestionTypeLabel(question.questionType)}
                              </Badge>
                              {question.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  اجباری
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white">{question.questionText}</p>
                            {question.options &&
                              Array.isArray(question.options) &&
                              question.options.length > 0 && (
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                  {question.options.length} گزینه
                                </div>
                              )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingQuestion(question)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(question.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <AlertDialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>ویرایش سوال</AlertDialogTitle>
              <AlertDialogDescription>
                توجه: برای آزمون‌های MBTI و DISC که از seed ساخته شده‌اند، ویرایش سوالات ممکن است بر روی محاسبات تأثیر بگذارد.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">متن سوال</label>
                <input
                  type="text"
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    questionText: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>

              {editingQuestion.options && Array.isArray(editingQuestion.options) && (
                <div>
                  <label className="text-sm font-medium">گزینه‌ها</label>
                  <div className="space-y-2 mt-2">
                    {editingQuestion.options.map((option: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options];
                            newOptions[index] = { ...option, text: e.target.value };
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions
                            });
                          }}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                try {
                  const response = await fetch(
                    `/api/assessments/${assessmentId}/questions/${editingQuestion.id}`,
                    {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        questionText: editingQuestion.questionText,
                        options: editingQuestion.options,
                      }),
                    }
                  );

                  if (!response.ok) throw new Error("Failed to update question");

                  toast.success("سوال به‌روزرسانی شد");
                  setEditingQuestion(null);
                  await fetchAssessment();
                } catch (error) {
                  console.error("Error updating question:", error);
                  toast.error("خطا در به‌روزرسانی سوال");
                }
              }}>
                ذخیره تغییرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Question Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سوال</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این سوال مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteQuestion(deleteId)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
}
