"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Download, Users, Clock, Trophy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    fetchResults();
  }, [departmentFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== "all") {
        params.append("departmentId", departmentFilter);
      }

      const response = await fetch(
        `/api/assessments/${assessmentId}/results?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch results");

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("خطا در دریافت گزارش");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const exportToCSV = () => {
    if (!data || !data.results) return;

    const headers = ["نام", "بخش", "نتیجه", "نمره", "زمان (ثانیه)", "تاریخ تکمیل"];
    const rows = data.results.map((r: any) => [
      r.user.name,
      r.user.department?.name || "-",
      typeof r.result === "object" ? r.result.type || "-" : "-",
      r.score || "-",
      r.timeTaken || "-",
      new Date(r.completedAt).toLocaleDateString("fa-IR"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `assessment-results-${assessmentId}.csv`;
    link.click();

    toast.success("فایل CSV دانلود شد");
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
        <p className="text-muted-foreground">خطا در بارگذاری داده‌ها</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">گزارش نتایج آزمون</h1>
            <p className="text-muted-foreground mt-2">
              مشاهده و تحلیل نتایج شرکت‌کنندگان
            </p>
          </div>
          <Button onClick={exportToCSV} disabled={!data.results || data.results.length === 0}>
            <Download className="w-4 h-4 ml-2" />
            دانلود CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد شرکت‌کنندگان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalParticipants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین نمره</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.averageScore?.toFixed(1) || "-"}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین زمان</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.averageTime ? formatTime(Math.round(data.stats.averageTime)) : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ قبولی</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.passRate?.toFixed(1) || "-"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="فیلتر بخش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه بخش‌ها</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست نتایج</CardTitle>
        </CardHeader>
        <CardContent>
          {data.results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              هنوز هیچ نتیجه‌ای ثبت نشده است
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-3 px-4">نام</th>
                    <th className="text-right py-3 px-4">بخش</th>
                    <th className="text-right py-3 px-4">نتیجه</th>
                    <th className="text-right py-3 px-4">نمره</th>
                    <th className="text-right py-3 px-4">زمان</th>
                    <th className="text-right py-3 px-4">تاریخ</th>
                    <th className="text-right py-3 px-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((result: any) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{result.user.name}</td>
                      <td className="py-3 px-4">
                        {result.user.department?.name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {result.result?.type ? (
                          <Badge variant="secondary">{result.result.type}</Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {result.score !== null ? `${result.score}%` : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {result.timeTaken ? formatTime(result.timeTaken) : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(result.completedAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="py-3 px-4">
                        {result.isPassed !== null ? (
                          <Badge
                            variant={result.isPassed ? "default" : "destructive"}
                          >
                            {result.isPassed ? "قبول" : "مردود"}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
