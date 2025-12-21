"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { AssessmentForm } from "@/components/AssessmentForm";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:mr-64">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-5xl">
            {/* Header Section */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push("/assessments")}
                className="mb-6 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                بازگشت به لیست آزمون‌ها
              </Button>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  ایجاد آزمون جدید
                </h1>
                <p className="text-blue-100 text-base sm:text-lg">
                  پس از ایجاد آزمون، می‌توانید سوالات را اضافه کنید
                </p>
              </div>
            </div>

            {/* Form Card */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200 rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-gray-800">مشخصات آزمون</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  اطلاعات اولیه آزمون را وارد کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <AssessmentForm
                  onSubmit={handleSubmit}
                  onCancel={() => router.push("/assessments")}
                  submitLabel="ایجاد آزمون"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
