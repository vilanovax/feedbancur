"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssessmentTaker } from "@/components/AssessmentTaker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TakeAssessmentPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startAssessment();
  }, []);

  const startAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start assessment");
      }

      const result = await response.json();
      setData(result);
    } catch (error: any) {
      console.error("Error starting assessment:", error);
      toast.error(error.message || "خطا در شروع آزمون");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری آزمون...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">خطا در بارگذاری آزمون</p>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Debug: Log questions to see if options are present
  if (data.questions && data.questions.length > 0) {
    console.log('Assessment questions:', data.questions);
    console.log('First question options:', data.questions[0]?.options);
  }

  return (
    <AssessmentTaker
      assessmentId={assessmentId}
      assessment={data.assessment}
      questions={data.questions}
      initialAnswers={data.progress?.answers || {}}
      initialQuestion={data.progress?.lastQuestion || 0}
    />
  );
}
