"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { AssessmentCard } from "@/components/AssessmentCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Settings, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Assessment {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  isActive: boolean;
  timeLimit?: number | null;
  createdAt: string;
  _count: {
    questions: number;
    assignments: number;
    results: number;
  };
}

export default function AssessmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const typeFilterLabels: Record<string, string> = {
    all: "همه انواع",
    MBTI: "MBTI - مایرز بریگز",
    DISC: "DISC - رفتارشناسی",
    CUSTOM: "سفارشی",
  };

  const statusFilterLabels: Record<string, string> = {
    all: "همه آزمون‌ها",
    active: "فعال",
    inactive: "غیرفعال",
  };

  useEffect(() => {
    if (session?.user.role !== "ADMIN" && session?.user.role !== "MANAGER") {
      router.push("/");
      return;
    }
    fetchAssessments();
  }, [session, typeFilter, statusFilter]);

  const fetchAssessments = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all")
        params.append("isActive", statusFilter === "active" ? "true" : "false");

      const response = await fetch(`/api/assessments?${params}`);
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

  if (session?.user.role !== "ADMIN" && session?.user.role !== "MANAGER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">آزمون‌های شخصیت‌سنجی</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                مدیریت آزمون‌های MBTI، DISC و سایر آزمون‌ها
              </p>
            </div>
            {session?.user.role === "ADMIN" && (
              <Button onClick={() => router.push("/assessments/new")} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 ml-2" />
                آزمون جدید
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع آزمون
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="نوع آزمون" value={typeFilterLabels[typeFilter] || "نوع آزمون"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="MBTI">MBTI - مایرز بریگز</SelectItem>
                    <SelectItem value="DISC">DISC - رفتارشناسی</SelectItem>
                    <SelectItem value="CUSTOM">سفارشی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="وضعیت" value={statusFilterLabels[statusFilter] || "وضعیت"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه آزمون‌ها</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assessments Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">هیچ آزمونی یافت نشد</p>
              {session?.user.role === "ADMIN" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/assessments/new")}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد اولین آزمون
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  showStats
                  actions={
                    <div className="flex flex-wrap gap-2 w-full">
                      {session?.user.role === "ADMIN" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px]"
                            onClick={() =>
                              router.push(`/assessments/${assessment.id}/edit`)
                            }
                          >
                            <Settings className="w-4 h-4 ml-2" />
                            ویرایش
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px]"
                            onClick={() =>
                              router.push(`/assessments/${assessment.id}/assign`)
                            }
                          >
                            <Users className="w-4 h-4 ml-2" />
                            تخصیص
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[100px]"
                        onClick={() =>
                          router.push(`/assessments/${assessment.id}/results`)
                        }
                      >
                        <BarChart3 className="w-4 h-4 ml-2" />
                        گزارش
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
