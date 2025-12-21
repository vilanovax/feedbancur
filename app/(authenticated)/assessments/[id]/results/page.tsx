"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
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
import { Loader2, ArrowRight, Download, Users, Clock, Trophy, CheckCircle2, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

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

  const handleDelete = async (resultId: string) => {
    setDeletingId(resultId);
    try {
      const response = await fetch(`/api/assessment-results/${resultId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در حذف نتیجه");
      }

      toast.success("نتیجه با موفقیت حذف شد");
      fetchResults(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting result:", error);
      toast.error(error.message || "خطا در حذف نتیجه");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">خطا در بارگذاری داده‌ها</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-7xl">
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    گزارش نتایج آزمون
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    مشاهده و تحلیل نتایج شرکت‌کنندگان
                  </p>
                </div>
                <Button 
                  onClick={exportToCSV} 
                  disabled={!data.results || data.results.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 ml-2" />
                  دانلود CSV
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    تعداد شرکت‌کنندگان
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.stats.totalParticipants}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    میانگین نمره
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.stats.averageScore?.toFixed(1) || "-"}%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    میانگین زمان
                  </CardTitle>
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.stats.averageTime ? formatTime(Math.round(data.stats.averageTime)) : "-"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                    نرخ قبولی
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.stats.passRate?.toFixed(1) || "-"}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[250px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
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
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">لیست نتایج</CardTitle>
              </CardHeader>
              <CardContent>
                {data.results.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                    هنوز هیچ نتیجه‌ای ثبت نشده است
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            نام
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            بخش
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            نتیجه
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            نمره
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            زمان
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            تاریخ
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            وضعیت
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.results.map((result: any) => (
                          <tr 
                            key={result.id} 
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {result.user.name}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {result.user.department?.name || "-"}
                            </td>
                            <td className="py-3 px-4">
                              {result.result?.type ? (
                                <Badge variant="secondary">{result.result.type}</Badge>
                              ) : (
                                <span className="text-gray-600 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {result.score !== null ? `${result.score}%` : "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
                              {result.timeTaken ? formatTime(result.timeTaken) : "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-900 dark:text-white">
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
                                <span className="text-gray-600 dark:text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  onClick={() => {
                                    setSelectedResult(result);
                                    setShowResultDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      disabled={deletingId === result.id}
                                    >
                                      {deletingId === result.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>حذف نتیجه آزمون</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        آیا مطمئن هستید که می‌خواهید نتیجه آزمون {result.user?.name} را حذف کنید؟ این عمل قابل بازگشت نیست.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-row-reverse gap-2">
                                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(result.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        حذف
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
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
        </div>

        {/* Result Details Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>جزئیات نتیجه آزمون</DialogTitle>
            </DialogHeader>
            {selectedResult && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">اطلاعات شرکت‌کننده</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">نام:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedResult.user?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">بخش:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedResult.user?.department?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">تاریخ:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">
                        {new Date(selectedResult.completedAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">زمان:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">
                        {selectedResult.timeTaken ? formatTime(selectedResult.timeTaken) : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Info */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">نتیجه</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">نمره:</span>
                      <span className="mr-2 text-gray-900 dark:text-white font-bold text-lg">
                        {selectedResult.score !== null ? `${selectedResult.score}%` : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">وضعیت:</span>
                      <span className="mr-2">
                        {selectedResult.isPassed !== null ? (
                          <Badge variant={selectedResult.isPassed ? "default" : "destructive"}>
                            {selectedResult.isPassed ? "قبول" : "مردود"}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </span>
                    </div>
                    {selectedResult.result?.type && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">نوع شخصیت:</span>
                        <span className="mr-2">
                          <Badge variant="secondary" className="text-base">{selectedResult.result.type}</Badge>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Results */}
                {selectedResult.result && typeof selectedResult.result === 'object' && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">جزئیات تحلیل</h3>

                    {/* For personality assessments like DISC, MBTI, Holland */}
                    {selectedResult.result.scores && (
                      <div className="space-y-3">
                        {Object.entries(selectedResult.result.scores).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                              <div
                                className="bg-blue-600 h-4 rounded-full transition-all"
                                style={{ width: `${Math.min(100, typeof value === 'number' ? value : 0)}%` }}
                              />
                            </div>
                            <span className="w-12 text-sm text-gray-600 dark:text-gray-400 text-left">
                              {typeof value === 'number' ? value.toFixed(1) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Description if available */}
                    {selectedResult.result.description && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedResult.result.description}
                        </p>
                      </div>
                    )}

                    {/* Dominant traits */}
                    {selectedResult.result.dominant && (
                      <div className="mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">ویژگی غالب:</span>
                        <Badge variant="outline" className="mr-2">{selectedResult.result.dominant}</Badge>
                      </div>
                    )}

                    {/* Raw data display for debugging/admin view */}
                    {!selectedResult.result.scores && !selectedResult.result.description && (
                      <pre className="mt-2 p-3 bg-white dark:bg-gray-900 rounded text-xs overflow-x-auto text-gray-600 dark:text-gray-400">
                        {JSON.stringify(selectedResult.result, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end">
                  <Button onClick={() => setShowResultDialog(false)}>
                    بستن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
