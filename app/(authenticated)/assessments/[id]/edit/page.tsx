"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessment();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">آزمون یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/assessments")}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-3xl font-bold">ویرایش آزمون</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Assessment Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>مشخصات آزمون</CardTitle>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>سوالات آزمون</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
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
                <div className="text-center py-12 text-muted-foreground">
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
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">#{index + 1}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getQuestionTypeLabel(question.questionType)}
                              </Badge>
                              {question.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  اجباری
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{question.questionText}</p>
                            {question.options &&
                              Array.isArray(question.options) &&
                              question.options.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {question.options.length} گزینه
                                </div>
                              )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(question.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
  );
}
