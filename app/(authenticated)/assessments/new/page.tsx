"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AssessmentForm } from "@/components/AssessmentForm";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewAssessmentPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create assessment");

      const assessment = await response.json();
      toast.success("آزمون با موفقیت ایجاد شد!");
      router.push(`/assessments/${assessment.id}/edit`);
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast.error("خطا در ایجاد آزمون");
      throw error;
    }
  };

  if (session?.user.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/assessments")}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-3xl font-bold">ایجاد آزمون جدید</h1>
        <p className="text-muted-foreground mt-2">
          پس از ایجاد آزمون، می‌توانید سوالات را اضافه کنید
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <AssessmentForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/assessments")}
          submitLabel="ایجاد آزمون"
        />
      </div>
    </div>
  );
}
