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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">خطا در بارگذاری آزمون</p>
      </div>
    );
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
