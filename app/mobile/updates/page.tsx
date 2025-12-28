"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MobileLayout from "@/components/MobileLayout";
import {
  Newspaper,
  Sparkles,
  Bug,
  TrendingUp,
  CheckCircle,
  Calendar,
  ArrowUpDown,
  Search,
  Tag,
  Loader2,
} from "lucide-react";
import { useUpdates } from "@/lib/swr/hooks";

// Lazy load modal component
const UpdateModal = dynamic(
  () => import("@/components/UpdateModal").then((mod) => ({ default: mod.UpdateModal })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48" />
    ),
  }
);

type SortOption = "newest" | "oldest" | "category";
type CategoryFilter = "ALL" | "FEATURE" | "BUG_FIX" | "IMPROVEMENT" | "NEWS" | "FEEDBACK_COMPLETED";

const categoryOptions: {
  value: CategoryFilter;
  label: string;
  icon: typeof Sparkles;
  color: string;
}[] = [
  { value: "ALL", label: "همه", icon: Newspaper, color: "text-gray-500" },
  { value: "FEATURE", label: "قابلیت جدید", icon: Sparkles, color: "text-purple-500" },
  { value: "BUG_FIX", label: "رفع مشکل", icon: Bug, color: "text-red-500" },
  { value: "IMPROVEMENT", label: "بهبود", icon: TrendingUp, color: "text-blue-500" },
  { value: "NEWS", label: "خبر", icon: Newspaper, color: "text-yellow-500" },
  { value: "FEEDBACK_COMPLETED", label: "فیدبک تکمیل شده", icon: CheckCircle, color: "text-green-500" },
];

export default function MobileUpdatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mobileUpdatesSortOption") as SortOption;
      if (saved && ["newest", "oldest", "category"].includes(saved)) {
        return saved;
      }
    }
    return "newest";
  });

  const { data, isLoading, error } = useUpdates({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    search: search || undefined,
    limit: 50,
  });

  const updates = data?.data || [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ذخیره تنظیمات مرتب‌سازی در localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mobileUpdatesSortOption", sortOption);
    }
  }, [sortOption]);

  // مرتب‌سازی
  const sortedUpdates = useMemo(() => {
    const sorted = [...updates].sort((a: any, b: any) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
        case "oldest":
          return new Date(a.publishedAt || a.createdAt).getTime() - new Date(b.publishedAt || b.createdAt).getTime();
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return sorted;
  }, [updates, sortOption]);

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find((opt) => opt.value === category);
    if (!option) return <Newspaper className="text-gray-500" size={20} />;
    const Icon = option.icon;
    return <Icon className={option.color} size={20} />;
  };

  const getCategoryLabel = (category: string) => {
    const option = categoryOptions.find((opt) => opt.value === category);
    return option?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      FEATURE: "border-r-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20",
      BUG_FIX: "border-r-4 border-red-500 bg-red-50 dark:bg-red-900/20",
      IMPROVEMENT: "border-r-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
      NEWS: "border-r-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
      FEEDBACK_COMPLETED: "border-r-4 border-green-500 bg-green-50 dark:bg-green-900/20",
    };
    return colors[category] || "border-r-4 border-gray-300";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <MobileLayout role={role} title="اطلاع‌رسانی‌ها">
      <div className="space-y-4">
        {/* Header with search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-3">
          {/* جستجو */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* فیلتر دسته‌بندی */}
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = categoryFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setCategoryFilter(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent"
                  }`}
                >
                  <Icon size={14} className={opt.color} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        {!isLoading && updates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                مرتب‌سازی:
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="category">دسته‌بندی</option>
              </select>
            </div>
          </div>
        )}

        {/* Updates List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-red-500">خطا در بارگذاری</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">اطلاع‌رسانی‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedUpdates.map((update: any) => (
              <div
                key={update.id}
                onClick={() => setSelectedUpdate(update)}
                className={`block w-full text-right bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${getCategoryColor(
                  update.category
                )}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-1">{getCategoryIcon(update.category)}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
                      {update.title}
                    </h3>
                    {update.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {update.summary}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {getCategoryLabel(update.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(update.publishedAt || update.createdAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    {update.tags && update.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {update.tags.slice(0, 3).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                        {update.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{update.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </MobileLayout>
  );
}
