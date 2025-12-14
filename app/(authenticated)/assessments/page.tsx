"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">آزمون‌های شخصیت‌سنجی</h1>
          <p className="text-muted-foreground mt-2">
            مدیریت آزمون‌های MBTI، DISC و سایر آزمون‌ها
          </p>
        </div>
        {session?.user.role === "ADMIN" && (
          <Button onClick={() => router.push("/assessments/new")}>
            <Plus className="w-4 h-4 ml-2" />
            آزمون جدید
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="نوع آزمون" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انواع</SelectItem>
            <SelectItem value="MBTI">MBTI</SelectItem>
            <SelectItem value="DISC">DISC</SelectItem>
            <SelectItem value="CUSTOM">سفارشی</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="inactive">غیرفعال</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assessments Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">هیچ آزمونی یافت نشد</p>
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
                <div className="flex gap-2 w-full">
                  {session?.user.role === "ADMIN" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
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
  );
}
