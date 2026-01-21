"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ViewToggle from "./ViewToggle";
import AdvancedFilters from "./AdvancedFilters";
import QuickFilterChips from "./QuickFilterChips";
import FeedbackTableView from "./FeedbackTableView";
import BulkActionsBar from "./BulkActionsBar";
import Link from "next/link";

interface FeedbackPageEnhancedProps {
  feedbacks: any[];
  departments: any[];
  loading: boolean;
  onRefresh: () => void;
  children: React.ReactNode; // برای نمایش Grid/List View فعلی
}

export default function FeedbackPageEnhanced({
  feedbacks,
  departments,
  loading,
  onRefresh,
  children,
}: FeedbackPageEnhancedProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("feedback_view_mode");
      if (saved === "table" || saved === "list" || saved === "grid") {
        return saved;
      }
    }
    return "grid";
  });

  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<
    "all" | "active" | "forwarded" | "archived" | "deferred" | "completed"
  >("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ذخیره view mode در localStorage
  useEffect(() => {
    localStorage.setItem("feedback_view_mode", viewMode);
  }, [viewMode]);

  // فیلتر کردن feedbacks
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    // Quick Filter
    if (quickFilter === "active" && feedback.status !== "PENDING") return false;
    if (quickFilter === "completed" && feedback.status !== "COMPLETED")
      return false;
    if (quickFilter === "deferred" && feedback.status !== "DEFERRED")
      return false;
    if (quickFilter === "archived" && feedback.status !== "ARCHIVED")
      return false;

    // Department Filter
    if (
      selectedDepartment &&
      feedback.departmentId !== selectedDepartment
    )
      return false;

    // Status Filter
    if (selectedStatus && feedback.status !== selectedStatus) return false;

    // Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = feedback.title?.toLowerCase().includes(query);
      const matchesDescription = feedback.description
        ?.toLowerCase()
        .includes(query);
      const matchesUser = feedback.users?.name?.toLowerCase().includes(query);

      if (!matchesTitle && !matchesDescription && !matchesUser) return false;
    }

    return true;
  });

  // محاسبه counts برای Quick Filter Chips
  const counts = {
    all: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === "PENDING").length,
    completed: feedbacks.filter((f) => f.status === "COMPLETED").length,
    deferred: feedbacks.filter((f) => f.status === "DEFERRED").length,
    archived: feedbacks.filter((f) => f.status === "ARCHIVED").length,
  };

  // Bulk Selection Handlers
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

  const handleClearSelection = () => {
    setSelectedFeedbacks([]);
  };

  const handleClearFilters = () => {
    setSelectedDepartment("");
    setSelectedStatus("");
    setSearchQuery("");
    setQuickFilter("all");
  };

  // Bulk Actions (Placeholder - باید به API متصل شود)
  const handleBulkForward = () => {
    console.log("Bulk forward:", selectedFeedbacks);
    alert(`ارجاع ${selectedFeedbacks.length} فیدبک`);
  };

  const handleBulkArchive = () => {
    console.log("Bulk archive:", selectedFeedbacks);
    alert(`آرشیو ${selectedFeedbacks.length} فیدبک`);
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `آیا از حذف ${selectedFeedbacks.length} فیدبک اطمینان دارید؟`
      )
    ) {
      console.log("Bulk delete:", selectedFeedbacks);
      alert(`حذف ${selectedFeedbacks.length} فیدبک`);
    }
  };

  const handleBulkMarkComplete = () => {
    console.log("Bulk mark complete:", selectedFeedbacks);
    alert(`تکمیل ${selectedFeedbacks.length} فیدبک`);
  };

  const handleBulkMarkDeferred = () => {
    console.log("Bulk mark deferred:", selectedFeedbacks);
    alert(`موکول ${selectedFeedbacks.length} فیدبک`);
  };

  const handleOpenActions = (feedback: any) => {
    console.log("Open actions for:", feedback);
    // اینجا می‌توانید منوی عملیات را باز کنید
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            فیدبک‌ها
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            مدیریت و پیگیری فیدبک‌های دریافتی
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="بروزرسانی"
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin" : ""}
            />
          </button>

          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          <Link
            href="/feedback/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">فیدبک جدید</span>
          </Link>
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
        departments={departments}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        نمایش <span className="font-semibold">{filteredFeedbacks.length}</span>{" "}
        از <span className="font-semibold">{feedbacks.length}</span> فیدبک
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <FeedbackTableView
          feedbacks={filteredFeedbacks}
          selectedFeedbacks={selectedFeedbacks}
          onSelectFeedback={handleSelectFeedback}
          onSelectAll={handleSelectAll}
          onOpenActions={handleOpenActions}
        />
      ) : (
        // برای Grid و List از children استفاده می‌کنیم (کامپوننت فعلی)
        children
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedFeedbacks.length}
        onClearSelection={handleClearSelection}
        onForward={handleBulkForward}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onMarkComplete={handleBulkMarkComplete}
        onMarkDeferred={handleBulkMarkDeferred}
      />
    </div>
  );
}
