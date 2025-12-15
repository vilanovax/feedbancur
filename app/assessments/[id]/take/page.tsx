"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AssessmentTaker } from "@/components/AssessmentTaker";
import { Loader2 } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "RATING_SCALE" | "TRUE_FALSE" | "TEXT";
  order: number;
  isRequired: boolean;
  options: any;
  image?: string | null;
}

interface AssessmentData {
  assessment: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    timeLimit?: number | null;
    totalQuestions: number;
  };
  questions: Question[];
  progress: {
    id: string;
    answers: Record<string, string>;
    lastQuestion: number;
    startedAt: string;
  };
}

export default function TakeAssessmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;

  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && assessmentId) {
      startAssessment();
    }
  }, [status, assessmentId]);

  const startAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در شروع آزمون");
      }

      const data = await response.json();
      setAssessmentData(data);
    } catch (error: any) {
      console.error("Error starting assessment:", error);
      setError(error.message || "خطا در بارگذاری آزمون");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">در حال بارگذاری آزمون...</p>
        </div>
      </div>
    );
  }

  if (error || !assessmentData) {
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
          <p className="text-gray-600 mb-4">{error || "آزمون یافت نشد"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentTaker
      assessmentId={assessmentId}
      assessment={assessmentData.assessment}
      questions={assessmentData.questions}
      initialAnswers={assessmentData.progress.answers}
      initialQuestion={assessmentData.progress.lastQuestion}
    />
  );
}
