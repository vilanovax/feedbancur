"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import ViewToggle from "@/components/feedback/ViewToggle";
import AdvancedFilters from "@/components/feedback/AdvancedFilters";
import QuickFilterChips from "@/components/feedback/QuickFilterChips";
import FeedbackTableView from "@/components/feedback/FeedbackTableView";
import BulkActionsBar from "@/components/feedback/BulkActionsBar";
import StatusBadge from "@/components/feedback/StatusBadge";
import PriorityBadge from "@/components/feedback/PriorityBadge";

// داده‌های نمونه
const mockFeedbacks = [
  {
    id: "1",
    title: "هوا خیلی گرم است",
    description: "لطفاً پنکه برای ما بخرید",
    status: "PENDING",
    priority: "HIGH",
    rating: 4,
    departmentId: "dept1",
    departments: { name: "اداری" },
    users: { name: "فرزاد زارع", avatar: null },
    createdAt: new Date("2025-01-19"),
  },
  {
    id: "2",
    title: "شکایت از آشپزخانه",
    description: "این من شکایت آشپزخانه به صورت انعطافی است",
    status: "COMPLETED",
    priority: "MEDIUM",
    rating: 5,
    departmentId: "dept2",
    departments: { name: "آشپزخانه" },
    users: { name: "مدیر سیستم", avatar: null },
    createdAt: new Date("2025-01-20"),
  },
  {
    id: "3",
    title: "حقوق من فرزاد چی شد ؟",
    description: "متن حقوق مدیر فرزاد چی شد با تصویر. انتقادی",
    status: "PENDING",
    priority: "URGENT",
    rating: null,
    departmentId: "dept1",
    departments: { name: "اداری" },
    users: { name: "فرزاد زارع", avatar: null },
    createdAt: new Date("2025-01-14"),
  },
  {
    id: "4",
    title: "ادمین آشپزخانه ۱",
    description: null,
    status: "DEFERRED",
    priority: "LOW",
    rating: null,
    departmentId: "dept2",
    departments: { name: "آشپزخانه" },
    users: { name: "ادمین", avatar: null },
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "5",
    title: "عنوان ادمین اداری ۲",
    description: null,
    status: "ARCHIVED",
    priority: "MEDIUM",
    rating: 3,
    departmentId: "dept1",
    departments: { name: "اداری" },
    users: { name: "ادمین", avatar: null },
    createdAt: new Date("2025-01-08"),
  },
  {
    id: "6",
    title: "مدیر به اداری",
    description: null,
    status: "COMPLETED",
    priority: null,
    rating: 5,
    departmentId: "dept1",
    departments: { name: "اداری" },
    users: { name: "مدیر سیستم", avatar: null },
    createdAt: new Date("2025-01-10"),
  },
];

const mockDepartments = [
  { id: "dept1", name: "اداری" },
  { id: "dept2", name: "آشپزخانه" },
];

export default function FeedbackDemoPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "forwarded" | "archived" | "deferred" | "completed">("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // فیلتر کردن
  const filteredFeedbacks = mockFeedbacks.filter((feedback) => {
    if (quickFilter === "active" && feedback.status !== "PENDING") return false;
    if (quickFilter === "completed" && feedback.status !== "COMPLETED") return false;
    if (quickFilter === "deferred" && feedback.status !== "DEFERRED") return false;
    if (quickFilter === "archived" && feedback.status !== "ARCHIVED") return false;
    if (selectedDepartment && feedback.departmentId !== selectedDepartment) return false;
    if (selectedStatus && feedback.status !== selectedStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches =
        feedback.title?.toLowerCase().includes(query) ||
        feedback.description?.toLowerCase().includes(query) ||
        feedback.users?.name?.toLowerCase().includes(query);
      if (!matches) return false;
    }
    return true;
  });

  const counts = {
    all: mockFeedbacks.length,
    pending: mockFeedbacks.filter((f) => f.status === "PENDING").length,
    completed: mockFeedbacks.filter((f) => f.status === "COMPLETED").length,
    deferred: mockFeedbacks.filter((f) => f.status === "DEFERRED").length,
    archived: mockFeedbacks.filter((f) => f.status === "ARCHIVED").length,
  };

  const handleSelectFeedback = (id: string) => {
    setSelectedFeedbacks((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedFeedbacks.length === filteredFeedbacks.length) {
      setSelectedFeedbacks([]);
    } else {
      setSelectedFeedbacks(filteredFeedbacks.map((f) => f.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />

      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                فیدبک‌ها (دمو)
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                نمایش کامپوننت‌های جدید UI/UX
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => alert("بروزرسانی")}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>

              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Plus size={18} />
                <span className="hidden sm:inline">فیدبک جدید</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <QuickFilterChips
            activeFilter={quickFilter}
            onFilterChange={setQuickFilter}
            counts={counts}
          />

          {/* Advanced Filters */}
          <AdvancedFilters
            departments={mockDepartments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearFilters={() => {
              setSelectedDepartment("");
              setSelectedStatus("");
              setSearchQuery("");
            }}
          />

          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            نمایش <span className="font-semibold">{filteredFeedbacks.length}</span> از{" "}
            <span className="font-semibold">{mockFeedbacks.length}</span> فیدبک
          </div>

          {/* Content */}
          {viewMode === "table" ? (
            <FeedbackTableView
              feedbacks={filteredFeedbacks}
              selectedFeedbacks={selectedFeedbacks}
              onSelectFeedback={handleSelectFeedback}
              onSelectAll={handleSelectAll}
              onOpenActions={(feedback) => alert(`عملیات برای: ${feedback.title}`)}
            />
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                Grid و List View در صفحه اصلی feedback موجود است
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                برای مشاهده Table View، حالت "table" را انتخاب کنید
              </p>
            </div>
          )}

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedFeedbacks.length}
            onClearSelection={() => setSelectedFeedbacks([])}
            onForward={() => alert(`ارجاع ${selectedFeedbacks.length} فیدبک`)}
            onArchive={() => alert(`آرشیو ${selectedFeedbacks.length} فیدبک`)}
            onDelete={() => {
              if (confirm(`حذف ${selectedFeedbacks.length} فیدبک؟`)) {
                alert("حذف شد");
                setSelectedFeedbacks([]);
              }
            }}
            onMarkComplete={() => alert(`تکمیل ${selectedFeedbacks.length} فیدبک`)}
            onMarkDeferred={() => alert(`موکول ${selectedFeedbacks.length} فیدبک`)}
          />
        </div>
      </main>
    </div>
  );
}
