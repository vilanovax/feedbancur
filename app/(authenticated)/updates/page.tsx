"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Newspaper,
  ArrowRight,
  Search,
  Filter,
  Loader2,
  Plus,
  Sparkles,
  Bug,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { useUpdates } from "@/lib/swr/hooks";
import { UpdateCard } from "@/components/UpdateCard";
import { UpdateModal } from "@/components/UpdateModal";
import { UpdateCategory } from "@prisma/client";

const categoryOptions: { value: UpdateCategory | ""; label: string }[] = [
  { value: "", label: "همه دسته‌ها" },
  { value: "FEATURE", label: "قابلیت جدید" },
  { value: "BUG_FIX", label: "رفع مشکل" },
  { value: "IMPROVEMENT", label: "بهبود" },
  { value: "NEWS", label: "خبر" },
  { value: "FEEDBACK_COMPLETED", label: "فیدبک تکمیل شده" },
];

export default function UpdatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<UpdateCategory | "">("");
  const [page, setPage] = useState(1);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);

  const { data, isLoading, error } = useUpdates({
    category: category || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const updates = data?.data || [];
  const pagination = data?.pagination;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex"
      dir="rtl"
    >
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Newspaper className="text-blue-500" />
                اطلاع‌رسانی‌ها
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                آخرین اخبار، بهبودها و تغییرات سیستم
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت
              </Link>
              {session?.user?.role === "ADMIN" && (
                <Link
                  href="/updates/manage"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  مدیریت
                </Link>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* جستجو */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="جستجو در عنوان و محتوا..."
                  className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* فیلتر دسته‌بندی */}
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as UpdateCategory | "");
                    setPage(1);
                  }}
                  className="pr-10 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Updates List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-red-500">خطا در بارگذاری اطلاع‌رسانی‌ها</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Newspaper className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {search || category
                  ? "نتیجه‌ای یافت نشد"
                  : "هنوز اطلاع‌رسانی‌ای وجود ندارد"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {updates.map((update: any) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    onClick={() => setSelectedUpdate(update)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    قبلی
                  </button>
                  <span className="text-gray-600 dark:text-gray-400">
                    صفحه {pagination.page} از {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </div>
  );
}
