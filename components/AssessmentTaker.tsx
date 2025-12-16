"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "./QuestionRenderer";
import { ChevronLeft, ChevronRight, Clock, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "RATING_SCALE" | "TRUE_FALSE" | "TEXT";
  order: number;
  isRequired: boolean;
  options: any;
  image?: string | null;
}

interface AssessmentTakerProps {
  assessmentId: string;
  assessment: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    timeLimit?: number | null;
    totalQuestions: number;
  };
  questions: Question[];
  initialAnswers?: Record<string, string>;
  initialQuestion?: number;
}

export function AssessmentTaker({
  assessmentId,
  assessment,
  questions,
  initialAnswers = {},
  initialQuestion = 0,
}: AssessmentTakerProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestion);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    assessment.timeLimit ? assessment.timeLimit * 60 : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // بررسی اینکه آیا همه سوالات پاسخ داده شده‌اند
  const allQuestionsAnswered = questions.every(
    (q) => answers[q.id] && answers[q.id] !== ""
  );

  // Removed auto-navigation useEffect - users should be able to view answered questions

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [answers, currentQuestionIndex]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const saveProgress = async () => {
    if (isSaving || isSubmitting) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          lastQuestion: currentQuestionIndex,
        }),
      });

      if (!response.ok) throw new Error("Failed to save progress");
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      saveProgress();
    } else {
      // اگر به آخرین سوال رسیدیم، بررسی می‌کنیم که آیا سوالات پاسخ داده نشده وجود دارد
      const unansweredQuestions = questions.filter(
        (q) => !answers[q.id] || answers[q.id] === ""
      );
      
      if (unansweredQuestions.length > 0) {
        // پیدا کردن index اولین سوال پاسخ داده نشده
        const firstUnansweredIndex = questions.findIndex(
          (q) => !answers[q.id] || answers[q.id] === ""
        );
        
        if (firstUnansweredIndex !== -1) {
          setCurrentQuestionIndex(firstUnansweredIndex);
          saveProgress();
        }
      } else {
        // اگر همه سوالات پاسخ داده شده‌اند، پیشرفت را ذخیره می‌کنیم
        saveProgress();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Check required questions
    const unansweredRequired = questions.filter(
      (q) => q.isRequired && (!answers[q.id] || answers[q.id] === "")
    );

    if (unansweredRequired.length > 0) {
      toast.error(`لطفاً به ${unansweredRequired.length} سوال اجباری پاسخ دهید`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error("Failed to submit assessment");

      const data = await response.json();
      toast.success("آزمون با موفقیت ثبت شد!");

      // Redirect to result page
      router.push(`/assessments/${assessmentId}/result`);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("خطا در ثبت آزمون");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = async () => {
    await saveProgress();
    toast.success("پیشرفت ذخیره شد");
    router.push("/my-assessments");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assessment.title}</h1>
            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className="flex items-center gap-2 text-lg font-mono">
                  <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span
                    className={
                      timeRemaining < 300 
                        ? "text-red-500 dark:text-red-400" 
                        : "text-gray-700 dark:text-gray-300"
                    }
                  >
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndExit}
                disabled={isSaving}
                className="border-gray-300 dark:border-gray-600"
              >
                <Save className="w-4 h-4 ml-2" />
                ذخیره و خروج
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                سوال {currentQuestionIndex + 1} از {questions.length}
              </span>
              <span>{Math.round(progress)}% تکمیل شده</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
            سوال {currentQuestion.order || currentQuestionIndex + 1}
          </div>

          <QuestionRenderer
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            onAutoNext={
              currentQuestion.questionType === "MULTIPLE_CHOICE"
                ? handleNext
                : undefined
            }
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronRight className="w-4 h-4 ml-2" />
            قبلی
          </Button>

          {allQuestionsAnswered ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4 ml-2" />
              {isSubmitting ? "در حال ثبت..." : "آماده نمایش پاسخ"}
            </Button>
          ) : currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              <Send className="w-4 h-4 ml-2" />
              {isSubmitting ? "در حال ثبت..." : "ثبت نهایی"}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              بعدی
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>

        {/* Unanswered questions indicator */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-2 text-gray-900 dark:text-white">وضعیت پاسخ‌ها:</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const isAnswered = answers[q.id] && answers[q.id] !== "";
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : isAnswered
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700"
                      : q.isRequired
                      ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            سبز: پاسخ داده شده | قرمز: اجباری | خاکستری: اختیاری
          </p>
        </div>
      </div>
    </div>
  );
}
