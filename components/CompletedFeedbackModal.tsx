"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Loader2,
  CheckCircle,
  MessageSquare,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CompletedFeedback {
  id: string;
  title: string;
  type: string;
  userResponse: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
}

interface CompletedFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (feedback: CompletedFeedback) => void;
}

export function CompletedFeedbackModal({
  isOpen,
  onClose,
  onSelect,
}: CompletedFeedbackModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<CompletedFeedback[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch feedbacks
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const res = await fetch(`/api/feedback/completed?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (isOpen) {
      fetchFeedbacks();
    }
  }, [isOpen, fetchFeedbacks]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
      setFeedbacks([]);
      setPagination(null);
    }
  }, [isOpen]);

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      BUG: "باگ",
      SUGGESTION: "پیشنهاد",
      FEATURE: "قابلیت",
      COMPLAINT: "شکایت",
      OTHER: "سایر",
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      BUG: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      SUGGESTION: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      FEATURE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      COMPLAINT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
    };
    return colors[type] || colors.OTHER;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              انتخاب فیدبک تکمیل شده
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان فیدبک..."
              className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
              <p>فیدبک تکمیل شده‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((feedback) => (
                <button
                  key={feedback.id}
                  onClick={() => {
                    onSelect(feedback);
                    onClose();
                  }}
                  className="w-full text-right p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 rounded-lg transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 truncate">
                        {feedback.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-0.5 rounded-full ${getTypeColor(feedback.type)}`}>
                          {getTypeLabel(feedback.type)}
                        </span>

                        {feedback.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {feedback.department.name}
                          </span>
                        )}

                        {feedback.createdBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {feedback.createdBy.name}
                          </span>
                        )}

                        {feedback.completedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(feedback.completedAt).toLocaleDateString("fa-IR")}
                          </span>
                        )}
                      </div>

                      {feedback.userResponse && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {feedback.userResponse}
                        </p>
                      )}
                    </div>

                    <CheckCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-green-500 flex-shrink-0 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} فیدبک | صفحه {pagination.page} از {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
