"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import { Star, Calendar, Building2, User, ArrowUpDown, Filter, X, MessageSquare } from "lucide-react";
import { getStatusColor } from "@/lib/status-utils";
import { useStatusTexts } from "@/lib/hooks/useStatusTexts";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc" | "status";

export default function MobileFeedbacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mobileFeedbacksSortOption") as SortOption;
      if (saved && ["date-desc", "date-asc", "rating-desc", "rating-asc", "status"].includes(saved)) {
        return saved;
      }
    }
    return "date-desc";
  });
  const [showFilters, setShowFilters] = useState(false);
  const { getStatusTextLocal } = useStatusTexts();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchFeedbacks();
      fetchDepartments();
    }
  }, [session]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append("departmentId", selectedDepartment);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // ذخیره تنظیمات مرتب‌سازی در localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mobileFeedbacksSortOption", sortOption);
    }
  }, [sortOption]);

  // فیلتر و مرتب‌سازی فیدبک‌ها
  const filteredAndSortedFeedbacks = useMemo(() => {
    let filtered = [...feedbacks];

    // فیلتر بر اساس نوع
    if (selectedType) {
      filtered = filtered.filter((f) => f.type === selectedType);
    }

    // مرتب‌سازی
    const sorted = filtered.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "rating-asc":
          return (a.rating || 0) - (b.rating || 0);
        case "status":
          const statusOrder = {
            PENDING: 0,
            REVIEWED: 1,
            DEFERRED: 2,
            COMPLETED: 3,
            ARCHIVED: 4,
          };
          return (
            (statusOrder[a.status as keyof typeof statusOrder] || 99) -
            (statusOrder[b.status as keyof typeof statusOrder] || 99)
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [feedbacks, selectedType, sortOption]);

  // به‌روزرسانی فیدبک‌ها هنگام تغییر فیلترها
  useEffect(() => {
    if (session) {
      fetchFeedbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedDepartment, session]);


  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  const hasActiveFilters =
    selectedStatus || selectedDepartment || selectedType;

  const clearFilters = () => {
    setSelectedStatus("");
    setSelectedDepartment("");
    setSelectedType("");
  };

  return (
    <MobileLayout role={role} title="فیدبک‌های من">
      <div className="space-y-4">
        {/* Header Actions — filter only, hidden when list is empty and no filters active */}
        {(feedbacks.length > 0 || hasActiveFilters) && (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter size={16} />
              فیلتر
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[selectedStatus, selectedDepartment, selectedType].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                فیلترها
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 dark:text-blue-400"
                >
                  پاک کردن همه
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                وضعیت
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="PENDING">در انتظار</option>
                <option value="REVIEWED">بررسی شده</option>
                <option value="DEFERRED">رسیدگی آینده</option>
                <option value="COMPLETED">انجام شد</option>
                <option value="ARCHIVED">آرشیو شده</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                بخش
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">همه بخش‌ها</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع فیدبک
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">همه انواع</option>
                <option value="CRITICAL">انتقادی</option>
                <option value="SUGGESTION">پیشنهادی</option>
                <option value="SURVEY">نظرسنجی</option>
              </select>
            </div>
          </div>
        )}

        {/* Sort Options */}
        {!loading && filteredAndSortedFeedbacks.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedFeedbacks.length} فیدبک
            </span>
            <label className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent focus:outline-none pr-1 text-sm text-gray-900 dark:text-white"
                aria-label="مرتب‌سازی"
              >
                <option value="date-desc">جدیدترین</option>
                <option value="date-asc">قدیمی‌ترین</option>
                <option value="rating-desc">امتیاز (بالا به پایین)</option>
                <option value="rating-asc">امتیاز (پایین به بالا)</option>
                <option value="status">وضعیت</option>
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
          </div>
        ) : filteredAndSortedFeedbacks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            {hasActiveFilters ? (
              <>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  فیدبکی با این فیلترها یافت نشد
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  فیلترها را تغییر دهید یا پاک کنید
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                >
                  پاک کردن فیلترها
                </button>
              </>
            ) : (
              <>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  هنوز فیدبکی ثبت نکرده‌اید
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                  اولین فیدبک خود را ثبت کنید و روند پیگیری آن را ببینید
                </p>
                <Link
                  href="/mobile/feedback/new"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  ثبت فیدبک جدید
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
                    {feedback.title}
                  </h3>
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusTextLocal(feedback.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} />
                    <span>{feedback.department.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{feedback.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      {formatPersianDate(feedback.createdAt)} ({getTimeAgo(feedback.createdAt)})
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                  {feedback.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

