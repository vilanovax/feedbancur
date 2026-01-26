"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Star, Calendar, Building2, User, ArrowUpDown, Send, X, Archive, CheckCircle, Filter, Clock, Send as SendIcon, FolderArchive, Trash2, AlertTriangle, MessageCircle, Check, Paperclip, Image as ImageIcon, ArrowRight, XCircle, RefreshCw, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";
import { getStatusColor } from "@/lib/status-utils";
import { useStatusTexts } from "@/lib/hooks/useStatusTexts";
import { getCompletionTime, WorkingHoursSettings } from "@/lib/working-hours-utils";
import Image from "next/image";
import { useToast } from "@/contexts/ToastContext";
import ViewToggle from "@/components/feedback/ViewToggle";
import AdvancedFilters from "@/components/feedback/AdvancedFilters";
import QuickFilterChips from "@/components/feedback/QuickFilterChips";
import FeedbackTableView from "@/components/feedback/FeedbackTableView";
import BulkActionsBar from "@/components/feedback/BulkActionsBar";
import BulkForwardModal from "@/components/feedback/BulkForwardModal";
import StatusBadge from "@/components/feedback/StatusBadge";
import PriorityBadge from "@/components/feedback/PriorityBadge";

function FeedbacksPageContent() {
  const toast = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]); // همه فیدبک‌ها برای محاسبه تعداد
  const [feedbacks, setFeedbacks] = useState<any[]>(() => {
    // بارگذاری از cache در صورت وجود (فقط برای حالت بدون فیلتر)
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("feedbacks_cache");
      const cacheTime = localStorage.getItem("feedbacks_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 2 دقیقه معتبر است (چون فیدبک‌ها بیشتر تغییر می‌کنند)
        if (timeDiff < 2 * 60 * 1000) {
          try {
            const parsed = JSON.parse(cached);
            setAllFeedbacks(parsed); // ذخیره همه فیدبک‌ها
            return parsed;
          } catch (e) {
            localStorage.removeItem("feedbacks_cache");
            localStorage.removeItem("feedbacks_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [departments, setDepartments] = useState<any[]>(() => {
    // بارگذاری بخش‌ها از cache
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("departments_cache");
      const cacheTime = localStorage.getItem("departments_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 10 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            localStorage.removeItem("departments_cache");
            localStorage.removeItem("departments_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(() => {
    // بارگذاری status از URL query parameter
    try {
      const urlStatus = searchParams.get("status");
      if (urlStatus && ["PENDING", "REVIEWED", "COMPLETED", "DEFERRED", "ARCHIVED"].includes(urlStatus)) {
        return urlStatus;
      }
    } catch (e) {
      // در SSR ممکن است searchParams در دسترس نباشد
    }
    return "";
  });
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "forwarded" | "archived" | "deferred" | "completed">(() => {
    // Load from localStorage for admin
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_feedback_quick_filter");
      if (saved && ["all", "active", "forwarded", "archived", "deferred", "completed"].includes(saved)) {
        return saved as typeof quickFilter;
      }
    }
    return "all";
  });
  const [loading, setLoading] = useState(true);
  const { getStatusTextLocal } = useStatusTexts();
  const [sortBy, setSortBy] = useState<"date" | "rating" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("feedback_view_mode");
      if (saved === "table" || saved === "list" || saved === "grid") {
        return saved;
      }
    }
    return "grid";
  });
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [forwardNotes, setForwardNotes] = useState("");
  const [forwardingFeedback, setForwardingFeedback] = useState(false);
  const [cancelingForward, setCancelingForward] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveAdminNotes, setArchiveAdminNotes] = useState("");
  const [archiveUserResponse, setArchiveUserResponse] = useState("");
  const [archivingFeedback, setArchivingFeedback] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeUserResponse, setCompleteUserResponse] = useState("");
  const [completingFeedback, setCompletingFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState(false);
  // Bulk selection states
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false);
  const [showBulkForwardModal, setShowBulkForwardModal] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [messageImages, setMessageImages] = useState<Record<string, File | null>>({});
  const [chatImagePreviews, setChatImagePreviews] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatImageModalOpen, setChatImageModalOpen] = useState(false);
  const [selectedChatImage, setSelectedChatImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [workingHoursSettings, setWorkingHoursSettings] = useState<WorkingHoursSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Save viewMode to localStorage
  useEffect(() => {
    localStorage.setItem("feedback_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // بارگذاری موازی داده‌های اولیه برای سرعت بیشتر
  useEffect(() => {
    Promise.all([
      fetchDepartments(),
      fetchManagers(),
      fetchWorkingHoursSettings()
    ]);
  }, []);

  const fetchWorkingHoursSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.workingHoursSettings) {
          setWorkingHoursSettings(data.workingHoursSettings);
        }
      }
    } catch (error) {
      console.error("Error fetching working hours settings:", error);
    }
  };

  // Save quick filter to localStorage when changed (only for admin)
  useEffect(() => {
    if (session?.user.role === "ADMIN" && typeof window !== "undefined") {
      localStorage.setItem("admin_feedback_quick_filter", quickFilter);
    }
  }, [quickFilter, session?.user.role]);

  // دریافت تعداد پیام‌های خوانده نشده به صورت bulk (یک query به جای N query)
  useEffect(() => {
    const forwardedFeedbacks = feedbacks.filter((f) => f.forwardedToId);
    if (forwardedFeedbacks.length > 0) {
      fetchAllUnreadCounts(forwardedFeedbacks.map((f) => f.id));
    }
  }, [feedbacks]);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedDepartment, selectedStatus, quickFilter]);

  const fetchDepartments = async () => {
    // اگر cache معتبر وجود دارد، از آن استفاده کن
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("departments_cache");
      const cacheTime = localStorage.getItem("departments_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 10 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setDepartments(cachedData);
            // در پس‌زمینه به‌روزرسانی کن
            fetchDepartmentsFromAPI();
            return;
          } catch (e) {
            // اگر parse نشد، ادامه بده و از API بگیر
          }
        }
      }
    }

    // اگر cache وجود ندارد یا منقضی شده، از API بگیر
    await fetchDepartmentsFromAPI();
  };

  const fetchDepartmentsFromAPI = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        // ذخیره در cache
        if (typeof window !== "undefined") {
          localStorage.setItem("departments_cache", JSON.stringify(data));
          localStorage.setItem("departments_cache_time", Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/users?role=MANAGER");
      if (res.ok) {
        const data = await res.json();
        setManagers(data);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const fetchFeedbacks = async () => {
    // اگر فیلترها خالی هستند و cache معتبر وجود دارد، از آن استفاده کن
    const hasFilters = selectedDepartment || selectedStatus || (quickFilter !== "all");
    
    if (!hasFilters) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("feedbacks_cache");
        const cacheTime = localStorage.getItem("feedbacks_cache_time");
        if (cached && cacheTime) {
          const timeDiff = Date.now() - parseInt(cacheTime);
          if (timeDiff < 2 * 60 * 1000) {
            try {
              const cachedData = JSON.parse(cached);
              setFeedbacks(cachedData);
              setAllFeedbacks(cachedData); // ذخیره همه فیدبک‌ها برای محاسبه تعداد
              setLoading(false);
              // در پس‌زمینه به‌روزرسانی کن
              fetchFeedbacksFromAPI();
              return;
            } catch (e) {
              // اگر parse نشد، ادامه بده و از API بگیر
            }
          }
        }
      }
    }

    // اگر cache وجود ندارد یا فیلترها اعمال شده‌اند، از API بگیر
    await fetchFeedbacksFromAPI();
  };

  const fetchFeedbacksFromAPI = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append("departmentId", selectedDepartment);
      
      // اگر selectedStatus تنظیم شده، از آن استفاده کن
      if (selectedStatus) {
        params.append("status", selectedStatus);
      } else {
        // اگر quick filter انتخاب شده، بر اساس آن فیلتر کن
        switch (quickFilter) {
          case "archived":
            params.append("status", "ARCHIVED");
            break;
          case "deferred":
            params.append("status", "DEFERRED");
            break;
          case "completed":
            params.append("status", "COMPLETED");
            break;
          // برای active و forwarded و all، status را ارسال نمی‌کنیم
          // تا همه فیدبک‌ها را بگیریم و بعد فیلتر کنیم
        }
      }

      const url = `/api/feedback?${params.toString()}`;
      
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();

        let filteredData = data;

        // اعمال quick filter (فقط اگر selectedStatus خالی باشد)
        if (!selectedStatus) {
          switch (quickFilter) {
            case "active":
              // فیدبک‌های فعال (PENDING و REVIEWED) که ارجاع نشده‌اند
              filteredData = data.filter(
                (f: any) => 
                  !f.forwardedToId && 
                  (f.status === "PENDING" || f.status === "REVIEWED") &&
                  f.status !== "ARCHIVED"
              );
              break;
            case "forwarded":
              // فیدبک‌های ارجاع شده (بدون انجام شده و آرشیو شده)
              filteredData = data.filter((f: any) => 
                f.forwardedToId && 
                f.status !== "ARCHIVED" && 
                f.status !== "COMPLETED"
              );
              break;
            case "archived":
            case "deferred":
            case "completed":
              // این فیلترها قبلاً در API اعمال شده‌اند
              filteredData = data;
              break;
            case "all":
            default:
              filteredData = data;
              break;
          }
        } else {
          filteredData = data;
        }

        setFeedbacks(filteredData);
        
        // ذخیره همه فیدبک‌ها برای محاسبه تعداد
        setAllFeedbacks(data);
        
        // ذخیره در cache فقط اگر فیلترها خالی باشند
        if (!selectedDepartment && !selectedStatus && quickFilter === "all") {
          if (typeof window !== "undefined") {
            localStorage.setItem("feedbacks_cache", JSON.stringify(filteredData));
            localStorage.setItem("feedbacks_cache_time", Date.now().toString());
          }
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error fetching feedbacks:", res.status, res.statusText, errorData);
        setFeedbacks([]);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  // getStatusTextLocal is now provided by useStatusTexts hook

  // محاسبه تعداد فیدبک‌های فعال
  const activeCount = allFeedbacks.filter(
    (f: any) => 
      !f.forwardedToId && 
      (f.status === "PENDING" || f.status === "REVIEWED") &&
      f.status !== "ARCHIVED"
  ).length;

  // محاسبه تعداد فیدبک‌های ارجاع شده
  const forwardedCount = allFeedbacks.filter(
    (f: any) => f.forwardedToId && f.status !== "ARCHIVED"
  ).length;

  // Counts for QuickFilterChips
  const counts = {
    all: allFeedbacks.length,
    pending: allFeedbacks.filter((f: any) => f.status === "PENDING" || f.status === "REVIEWED").length,
    completed: allFeedbacks.filter((f: any) => f.status === "COMPLETED").length,
    deferred: allFeedbacks.filter((f: any) => f.status === "DEFERRED").length,
    archived: allFeedbacks.filter((f: any) => f.status === "ARCHIVED").length,
  };

  // Apply search filter
  const applySearchFilter = (feedbacksToFilter: any[]) => {
    if (!searchQuery) return feedbacksToFilter;

    const query = searchQuery.toLowerCase();
    return feedbacksToFilter.filter((feedback) => {
      const matchesTitle = feedback.title?.toLowerCase().includes(query);
      const matchesDescription = feedback.description?.toLowerCase().includes(query);
      const matchesUser = feedback.users?.name?.toLowerCase().includes(query);
      return matchesTitle || matchesDescription || matchesUser;
    });
  };

  const sortFeedbacks = (feedbacksToSort: any[]) => {
    const sorted = [...feedbacksToSort].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        // برای فیدبک‌های COMPLETED از completedAt استفاده کن، در غیر این صورت از createdAt
        const aDate = a.status === "COMPLETED" && a.completedAt
          ? new Date(a.completedAt).getTime()
          : new Date(a.createdAt).getTime();
        const bDate = b.status === "COMPLETED" && b.completedAt
          ? new Date(b.completedAt).getTime()
          : new Date(b.createdAt).getTime();
        comparison = aDate - bDate;
      } else if (sortBy === "rating") {
        comparison = (a.rating || 0) - (b.rating || 0);
      } else if (sortBy === "status") {
        const statusOrder = { PENDING: 0, REVIEWED: 1, ARCHIVED: 2 };
        comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const openForwardModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    setShowForwardModal(true);
    setSelectedManager("");
    setForwardNotes("");
  };

  const closeForwardModal = () => {
    setShowForwardModal(false);
    setSelectedFeedback(null);
    setSelectedManager("");
    setForwardNotes("");
  };

  const handleCancelForward = async (feedbackId: string) => {
    if (!confirm("آیا از لغو ارجاع این فیدبک اطمینان دارید؟")) {
      return;
    }

    setCancelingForward(feedbackId);
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/cancel-forward`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("ارجاع فیدبک با موفقیت لغو شد");
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در لغو ارجاع");
      }
    } catch (error) {
      console.error("Error canceling forward:", error);
      toast.error("خطا در لغو ارجاع");
    } finally {
      setCancelingForward(null);
    }
  };

  const handleForwardFeedback = async () => {
    if (!selectedManager || !selectedFeedback) {
      toast.info("لطفا مدیر مقصد را انتخاب کنید");
      return;
    }

    setForwardingFeedback(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/forward`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          managerId: selectedManager,
          notes: forwardNotes,
        }),
      });

      if (res.ok) {
        toast.success("فیدبک با موفقیت ارجاع داده شد");
        closeForwardModal();
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ارجاع فیدبک");
      }
    } catch (error) {
      console.error("Error forwarding feedback:", error);
      toast.error("خطا در ارجاع فیدبک");
    } finally {
      setForwardingFeedback(false);
    }
  };

  const toggleSort = (newSortBy: "date" | "rating" | "status") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const openArchiveModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    setShowArchiveModal(true);
    setArchiveAdminNotes("");
    setArchiveUserResponse("");
  };

  const handleDeleteFeedback = async () => {
    if (!selectedFeedback) return;
    setDeletingFeedback(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/delete`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedFeedback(null);
        toast.success("فیدبک با موفقیت حذف شد");
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در حذف فیدبک");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("خطا در حذف فیدبک");
    } finally {
      setDeletingFeedback(false);
    }
  };

  // Bulk selection functions
  const toggleFeedbackSelection = (feedbackId: string) => {
    setSelectedFeedbackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFeedbackIds.size === feedbacks.length) {
      setSelectedFeedbackIds(new Set());
    } else {
      setSelectedFeedbackIds(new Set(feedbacks.map(f => f.id)));
    }
  };

  const clearSelection = () => {
    setSelectedFeedbackIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedFeedbackIds.size === 0) return;
    setBulkOperationLoading(true);

    try {
      const res = await fetch("/api/feedback/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedFeedbackIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} فیدبک با موفقیت حذف شد`);
        setShowBulkDeleteModal(false);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در حذف گروهی فیدبک‌ها");
      }
    } catch (error) {
      console.error("Error bulk deleting feedbacks:", error);
      toast.error("خطا در حذف گروهی فیدبک‌ها");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Bulk archive handler
  const handleBulkArchive = async () => {
    if (selectedFeedbackIds.size === 0) return;
    setBulkOperationLoading(true);

    try {
      const res = await fetch("/api/feedback/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedFeedbackIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} فیدبک با موفقیت آرشیو شد`);
        setShowBulkArchiveModal(false);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در آرشیو گروهی فیدبک‌ها");
      }
    } catch (error) {
      console.error("Error bulk archiving feedbacks:", error);
      toast.error("خطا در آرشیو گروهی فیدبک‌ها");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Bulk complete handler
  const handleBulkComplete = async () => {
    if (selectedFeedbackIds.size === 0) return;
    setBulkOperationLoading(true);

    try {
      const res = await fetch("/api/feedback/bulk-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedFeedbackIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} فیدبک با موفقیت تکمیل شد`);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در تکمیل گروهی فیدبک‌ها");
      }
    } catch (error) {
      console.error("Error bulk completing feedbacks:", error);
      toast.error("خطا در تکمیل گروهی فیدبک‌ها");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Bulk deferred handler
  const handleBulkDeferred = async () => {
    if (selectedFeedbackIds.size === 0) return;
    setBulkOperationLoading(true);

    try {
      const res = await fetch("/api/feedback/bulk-deferred", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedFeedbackIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} فیدبک با موفقیت موکول شد`);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در موکول گروهی فیدبک‌ها");
      }
    } catch (error) {
      console.error("Error bulk deferring feedbacks:", error);
      toast.error("خطا در موکول گروهی فیدبک‌ها");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Bulk forward handler
  const handleBulkForward = async (managerId: string) => {
    if (selectedFeedbackIds.size === 0 || !managerId) return;
    setBulkOperationLoading(true);

    try {
      const res = await fetch("/api/feedback/bulk-forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedFeedbackIds),
          managerId
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} فیدبک با موفقیت ارجاع شد`);
        setShowBulkForwardModal(false);
        clearSelection();
        // پاک کردن cache
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ارجاع گروهی فیدبک‌ها");
      }
    } catch (error) {
      console.error("Error bulk forwarding feedbacks:", error);
      toast.error("خطا در ارجاع گروهی فیدبک‌ها");
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setSelectedFeedback(null);
    setArchiveAdminNotes("");
    setArchiveUserResponse("");
  };

  const handleArchiveFeedback = async () => {
    if (!selectedFeedback) return;

    setArchivingFeedback(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminNotes: archiveAdminNotes,
          userResponse: archiveUserResponse,
        }),
      });

      if (res.ok) {
        toast.success("فیدبک با موفقیت آرشیو شد");
        closeArchiveModal();
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در آرشیو کردن فیدبک");
      }
    } catch (error) {
      console.error("Error archiving feedback:", error);
      toast.error("خطا در آرشیو کردن فیدبک");
    } finally {
      setArchivingFeedback(false);
    }
  };

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    if (newStatus === "COMPLETED") {
      // Open complete modal for user response
      const feedback = feedbacks.find(f => f.id === feedbackId);
      setSelectedFeedback(feedback);
      setShowCompleteModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("وضعیت فیدبک با موفقیت تغییر کرد");
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleCompleteFeedback = async () => {
    if (!selectedFeedback) return;

    setCompletingFeedback(true);
    try {
      const res = await fetch(`/api/feedback/${selectedFeedback.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
          userResponse: completeUserResponse,
        }),
      });

      if (res.ok) {
        toast.success("فیدبک با موفقیت تکمیل شد");
        setShowCompleteModal(false);
        setSelectedFeedback(null);
        setCompleteUserResponse("");
        // پاک کردن cache برای به‌روزرسانی
        if (typeof window !== "undefined") {
          localStorage.removeItem("feedbacks_cache");
          localStorage.removeItem("feedbacks_cache_time");
        }
        fetchFeedbacks();
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در تکمیل فیدبک");
      }
    } catch (error) {
      console.error("Error completing feedback:", error);
      toast.error("خطا در تکمیل فیدبک");
    } finally {
      setCompletingFeedback(false);
    }
  };


  // توابع مدیریت چت
  // دریافت تعداد پیام‌های خوانده نشده به صورت bulk (بهینه‌تر)
  const fetchAllUnreadCounts = async (feedbackIds: string[]) => {
    if (feedbackIds.length === 0) return;
    try {
      const res = await fetch(`/api/feedback/messages/unread-count?feedbackIds=${feedbackIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        if (data.counts) {
          setUnreadCounts((prev) => ({ ...prev, ...data.counts }));
        }
      }
    } catch (error) {
      console.error("Error fetching bulk unread counts:", error);
    }
  };

  const fetchUnreadCount = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages/unread`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCounts((prev) => ({ ...prev, [feedbackId]: data.count }));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchMessages = async (feedbackId: string) => {
    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`);
      if (res.ok) {
        const result = await res.json();
        // API برمی‌گرداند { data: [...], pagination: {...} }
        const msgs = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : []);
        setMessages((prev) => ({ ...prev, [feedbackId]: msgs }));
        // به‌روزرسانی تعداد خوانده نشده
        fetchUnreadCount(feedbackId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const openChatModal = (feedbackId: string) => {
    setSelectedFeedbackForChat(feedbackId);
    setChatModalOpen(true);
    fetchMessages(feedbackId);
    // پاک کردن تعداد خوانده نشده
    setUnreadCounts((prev) => ({ ...prev, [feedbackId]: 0 }));
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedFeedbackForChat(null);
  };

  // به‌روزرسانی خودکار پیام‌ها وقتی مودال باز است
  useEffect(() => {
    if (chatModalOpen && selectedFeedbackForChat) {
      const interval = setInterval(() => {
        fetchMessages(selectedFeedbackForChat);
      }, 3000); // هر 3 ثانیه یکبار

      return () => clearInterval(interval);
    }
  }, [chatModalOpen, selectedFeedbackForChat]);

  const sendMessage = async (feedbackId: string) => {
    const text = newMessageTexts[feedbackId]?.trim();
    const image = messageImages[feedbackId];

    if (!text && !image) return;

    try {
      const formData = new FormData();
      if (text) {
        formData.append("content", text);
      }
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`/api/feedback/${feedbackId}/messages`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => {
          const existingMessages = Array.isArray(prev[feedbackId]) ? prev[feedbackId] : [];
          return {
            ...prev,
            [feedbackId]: [...existingMessages, newMessage],
          };
        });
        setNewMessageTexts((prev) => ({ ...prev, [feedbackId]: "" }));
        setMessageImages((prev) => ({ ...prev, [feedbackId]: null }));
        setChatImagePreviews((prev) => {
          const newPreviews = { ...prev };
          delete newPreviews[feedbackId];
          return newPreviews;
        });
        // اسکرول به پایین
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        // به‌روزرسانی پیام‌ها برای دریافت isRead به‌روز شده
        setTimeout(() => {
          fetchMessages(feedbackId);
        }, 500);
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در ارسال پیام");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("خطا در ارسال پیام");
    }
  };

  const handleChatImageSelect = (feedbackId: string, file: File | null) => {
    if (!file) {
      setMessageImages((prev) => ({ ...prev, [feedbackId]: null }));
      setChatImagePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[feedbackId];
        return newPreviews;
      });
      return;
    }

    // بررسی حجم فایل (5MB پیش‌فرض)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.info(`حجم فایل نباید بیشتر از 5 مگابایت باشد`);
      return;
    }

    // بررسی فرمت فایل
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.info("فرمت فایل مجاز نیست. فقط تصاویر JPEG، PNG، GIF و WebP مجاز است.");
      return;
    }

    setMessageImages((prev) => ({ ...prev, [feedbackId]: file }));

    // ایجاد preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setChatImagePreviews((prev) => ({
        ...prev,
        [feedbackId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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
              onClick={fetchFeedbacks}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="بروزرسانی"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
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
          onFilterChange={(filter) => {
            setQuickFilter(filter);
            setSelectedStatus("");
          }}
          counts={counts}
        />

        {/* Bulk Actions Bar - فقط برای ADMIN */}
        {session?.user?.role === "ADMIN" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {selectedFeedbackIds.size === feedbacks.length && feedbacks.length > 0 ? (
                    <CheckSquare size={18} className="text-blue-600" />
                  ) : (
                    <Square size={18} />
                  )}
                  {selectedFeedbackIds.size === feedbacks.length && feedbacks.length > 0
                    ? "لغو انتخاب همه"
                    : "انتخاب همه"}
                </button>
                {selectedFeedbackIds.size > 0 && (
                  <>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFeedbackIds.size} مورد انتخاب شده
                    </span>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      پاک کردن
                    </button>
                  </>
                )}
              </div>

              {selectedFeedbackIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkArchiveModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Archive size={16} />
                    آرشیو گروهی ({selectedFeedbackIds.size})
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    حذف گروهی ({selectedFeedbackIds.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <AdvancedFilters
          departments={departments}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          selectedStatus={selectedStatus}
          onStatusChange={(status) => {
            setSelectedStatus(status);
            setQuickFilter("all");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={() => {
            setSelectedDepartment("");
            setSelectedStatus("");
            setSearchQuery("");
            setQuickFilter("all");
          }}
        />

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          نمایش <span className="font-semibold">{applySearchFilter(feedbacks).length}</span> از{" "}
          <span className="font-semibold">{feedbacks.length}</span> فیدبک
        </div>

        {loading && feedbacks.length === 0 ? (
          // Skeleton Loading
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            </div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-20 mb-3"></div>
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">
              فیدبکی یافت نشد
            </p>
          </div>
        ) : viewMode === "table" ? (
          <FeedbackTableView
            feedbacks={sortFeedbacks(applySearchFilter(feedbacks))}
            selectedFeedbacks={Array.from(selectedFeedbackIds)}
            onSelectFeedback={(id) => toggleFeedbackSelection(id)}
            onSelectAll={toggleSelectAll}
            onOpenActions={(feedback) => setSelectedFeedback(feedback)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortFeedbacks(applySearchFilter(feedbacks)).map((feedback) => (
              <div
                key={feedback.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col relative ${
                  selectedFeedbackIds.has(feedback.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {/* Checkbox for ADMIN */}
                {session?.user?.role === "ADMIN" && (
                  <button
                    onClick={() => toggleFeedbackSelection(feedback.id)}
                    className="absolute top-3 left-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                  >
                    {selectedFeedbackIds.has(feedback.id) ? (
                      <CheckSquare size={20} className="text-blue-600" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                  </button>
                )}
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 ${session?.user?.role === "ADMIN" ? "pr-0 ml-8" : ""}`}>
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {feedback.image && (() => {
                      // Parse image - می‌تواند string یا JSON array باشد
                      let images: string[] = [];
                      try {
                        const parsed = JSON.parse(feedback.image);
                        images = Array.isArray(parsed) ? parsed : [feedback.image];
                      } catch {
                        images = [feedback.image];
                      }
                      
                      return images.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedImages(images);
                            setCurrentImageIndex(0);
                            setImageModalOpen(true);
                          }}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition relative"
                          title={`مشاهده ضمیمه${images.length > 1 ? ` (${images.length} تصویر)` : ""}`}
                        >
                          <Paperclip size={18} />
                          {images.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {images.length}
                            </span>
                          )}
                        </button>
                      ) : null;
                    })()}
                    {feedback.forwardedToId && (
                      <button
                        onClick={() => openChatModal(feedback.id)}
                        className={`p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition relative ${
                          (feedback._count?.messages > 0 || messages[feedback.id]?.length > 0)
                            ? "text-green-700 dark:text-green-500"
                            : "text-green-600 dark:text-green-400"
                        }`}
                        title="چت با مدیر"
                      >
                        <MessageCircle 
                          size={18} 
                          fill={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? "currentColor" : "none"}
                          strokeWidth={(feedback._count?.messages > 0 || messages[feedback.id]?.length > 0) ? 2 : 1.5}
                        />
                        {unreadCounts[feedback.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[feedback.id]}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse mb-3 flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusTextLocal(feedback.status)}
                  </span>
                  {feedback.department?.allowDirectFeedback && feedback.forwardedToId && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      مستقیم
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-reverse">
                    <Building2 size={14} />
                    <span className="mr-[5px]">
                      {feedback.department?.name || "نامشخص"}
                      {feedback.department?.manager && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}({feedback.department.manager.name})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <User size={14} />
                    <span>{feedback.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Calendar size={14} />
                    <span>
                      {formatPersianDate(feedback.createdAt)} ({getTimeAgo(feedback.createdAt)})
                    </span>
                  </div>
                  {/* نمایش زمان انجام کار برای فیدبک‌های تکمیل شده */}
                  {feedback.status === "COMPLETED" && feedback.completedAt && feedback.forwardedAt && workingHoursSettings && (
                    <div className="flex items-center space-x-1 space-x-reverse text-green-600 dark:text-green-400 font-medium">
                      <Clock size={14} />
                      <span>
                        زمان انجام: {getCompletionTime(feedback.forwardedAt, feedback.completedAt, workingHoursSettings)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                  {feedback.content}
                </p>

                {(session?.user.role === "ADMIN" || session?.user.role === "MANAGER") && (
                  <div className="space-y-2">
                    {/* Status Dropdown - فقط برای مدیر */}
                    {session?.user.role === "MANAGER" && (
                    <select
                      value={feedback.status}
                      onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="PENDING">{getStatusTextLocal("PENDING")}</option>
                      <option value="REVIEWED">{getStatusTextLocal("REVIEWED")}</option>
                      <option value="DEFERRED">{getStatusTextLocal("DEFERRED")}</option>
                      <option value="COMPLETED">{getStatusTextLocal("COMPLETED")}</option>
                      <option value="ARCHIVED">{getStatusTextLocal("ARCHIVED")}</option>
                    </select>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {/* Cancel Forward Button - فقط برای فیدبک‌های ارجاع شده */}
                      {feedback.forwardedToId && session?.user?.role === "ADMIN" && (
                        <button
                          onClick={() => handleCancelForward(feedback.id)}
                          disabled={cancelingForward === feedback.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                        >
                          {cancelingForward === feedback.id ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              در حال لغو...
                            </>
                          ) : (
                            <>
                              <XCircle size={14} />
                              لغو ارجاع
                            </>
                          )}
                        </button>
                      )}

                      {/* Forward Button - فقط برای فیدبک‌های ارجاع نشده */}
                      {!feedback.forwardedToId && (
                        <button
                          onClick={() => openForwardModal(feedback)}
                          disabled={feedback.status === "ARCHIVED" || feedback.status === "COMPLETED"}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                        >
                          <Send size={14} />
                          ارجاع
                        </button>
                      )}

                      {/* Archive Button */}
                      <button
                        onClick={() => openArchiveModal(feedback)}
                        disabled={feedback.status === "ARCHIVED"}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                      >
                        <Archive size={14} />
                        آرشیو
                      </button>

                      {/* Delete Button - فقط برای ADMIN */}
                      {session?.user?.role === "ADMIN" && (
                        <button
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setShowDeleteModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm min-w-[120px]"
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Forward Modal */}
        {showForwardModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  ارجاع فیدبک
                </h2>
                <button
                  onClick={closeForwardModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {selectedFeedback.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFeedback.content}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  انتخاب مدیر مقصد <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">یک مدیر را انتخاب کنید</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} - {manager.department?.name || "بدون بخش"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="توضیحات یا یادداشت‌های اضافی برای مدیر مقصد..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeForwardModal}
                  disabled={forwardingFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleForwardFeedback}
                  disabled={forwardingFeedback || !selectedManager}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forwardingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال ارجاع...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      ارجاع فیدبک
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Modal */}
        {showArchiveModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  آرشیو فیدبک
                </h2>
                <button
                  onClick={closeArchiveModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {selectedFeedback.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFeedback.content}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  پاسخ به کاربر (اختیاری)
                </label>
                <textarea
                  value={archiveUserResponse}
                  onChange={(e) => setArchiveUserResponse(e.target.value)}
                  placeholder="پاسخی که به کاربر ارسال خواهد شد..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت‌های ادمین (اختیاری)
                </label>
                <textarea
                  value={archiveAdminNotes}
                  onChange={(e) => setArchiveAdminNotes(e.target.value)}
                  placeholder="یادداشت‌های داخلی برای ادمین..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeArchiveModal}
                  disabled={archivingFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleArchiveFeedback}
                  disabled={archivingFeedback}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {archivingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال آرشیو...
                    </>
                  ) : (
                    <>
                      <Archive size={18} />
                      آرشیو فیدبک
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Modal */}
        {showCompleteModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  تکمیل فیدبک
                </h2>
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedFeedback(null);
                    setCompleteUserResponse("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {selectedFeedback.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFeedback.content}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  پیام به کاربر
                </label>
                <textarea
                  value={completeUserResponse}
                  onChange={(e) => setCompleteUserResponse(e.target.value)}
                  placeholder="پیامی که به کاربر درباره تکمیل فیدبک ارسال می‌شود..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedFeedback(null);
                    setCompleteUserResponse("");
                  }}
                  disabled={completingFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCompleteFeedback}
                  disabled={completingFeedback}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال تکمیل...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      تکمیل فیدبک
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  حذف فیدبک
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید این فیدبک را حذف کنید؟ فیدبک به سطل آشغال منتقل می‌شود و می‌توانید بعداً آن را بازگردانید یا به طور کامل حذف کنید.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-6">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedFeedback.title}
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedFeedback(null);
                  }}
                  disabled={deletingFeedback}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleDeleteFeedback}
                  disabled={deletingFeedback}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      حذف
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {chatModalOpen && selectedFeedbackForChat && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    چت با مدیر
                  </h2>
                </div>
                <button
                  onClick={closeChatModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages[selectedFeedbackForChat]?.length > 0 ? (
                  messages[selectedFeedbackForChat].map((message: any) => {
                    const isMyMessage = message.senderId === session?.user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            isMyMessage
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <div className="text-xs mb-1 opacity-75">
                            {message.sender.name} ({message.sender.role === "ADMIN" ? "ادمین" : "مدیر"})
                          </div>
                          {message.content && (
                            <div className="text-sm whitespace-pre-wrap mb-2">{message.content}</div>
                          )}
                          {message.image && (
                            <div
                              className="mb-2 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                setSelectedChatImage(message.image);
                                setChatImageModalOpen(true);
                              }}
                            >
                              <img
                                src={
                                  message.image.includes("liara.space")
                                    ? `/api/image-proxy?url=${encodeURIComponent(message.image)}`
                                    : message.image
                                }
                                alt="ضمیمه"
                                className="max-w-full h-auto rounded-lg"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-75">
                            <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                            {isMyMessage && (
                              <Check
                                size={14}
                                className={message.isRead ? "text-blue-300" : "text-white/50"}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    پیامی وجود ندارد. اولین پیام را ارسال کنید.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                {/* Image Preview */}
                {chatImagePreviews[selectedFeedbackForChat] && (
                  <div className="relative inline-block max-w-xs">
                    <img
                      src={chatImagePreviews[selectedFeedbackForChat]}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={() => handleChatImageSelect(selectedFeedbackForChat, null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="flex-shrink-0 cursor-pointer p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <ImageIcon size={20} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleChatImageSelect(selectedFeedbackForChat, file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={newMessageTexts[selectedFeedbackForChat] || ""}
                    onChange={(e) =>
                      setNewMessageTexts((prev) => ({
                        ...prev,
                        [selectedFeedbackForChat]: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(selectedFeedbackForChat);
                      }
                    }}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => sendMessage(selectedFeedbackForChat)}
                    disabled={!newMessageTexts[selectedFeedbackForChat]?.trim() && !messageImages[selectedFeedbackForChat]}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    ارسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Image Modal */}
        {chatImageModalOpen && selectedChatImage && (
          <div
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setChatImageModalOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setChatImageModalOpen(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition z-10"
              >
                <X size={20} />
              </button>
              <img
                src={
                  selectedChatImage.includes("liara.space")
                    ? `/api/image-proxy?url=${encodeURIComponent(selectedChatImage)}`
                    : selectedChatImage
                }
                alt="تصویر چت"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </div>
          </div>
        )}

        {/* مودال نمایش تصویر ضمیمه */}
        {imageModalOpen && selectedImages.length > 0 && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setImageModalOpen(false);
              setSelectedImages([]);
              setCurrentImageIndex(0);
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  ضمیمه فیدبک {selectedImages.length > 1 && `(${currentImageIndex + 1} از ${selectedImages.length})`}
                </h3>
                <button
                  onClick={() => {
                    setImageModalOpen(false);
                    setSelectedImages([]);
                    setCurrentImageIndex(0);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px] relative">
                {selectedImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => 
                          prev > 0 ? prev - 1 : selectedImages.length - 1
                        );
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <ArrowRight size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => 
                          prev < selectedImages.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <ArrowRight size={24} className="rotate-180" />
                    </button>
                  </>
                )}
                <div className="relative w-full h-full max-h-[70vh] min-h-[400px]">
                  <Image
                    src={
                      selectedImages[currentImageIndex]?.includes("liara.space")
                        ? `/api/image-proxy?url=${encodeURIComponent(selectedImages[currentImageIndex])}`
                        : selectedImages[currentImageIndex]
                    }
                    alt={`ضمیمه فیدبک ${currentImageIndex + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    onError={(e) => {
                      // Fallback به URL مستقیم در صورت خطا
                      const img = e.target as HTMLImageElement;
                      if (img.src.includes("/api/image-proxy")) {
                        img.src = selectedImages[currentImageIndex];
                      }
                    }}
                  />
                </div>
                {selectedImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition ${
                          index === currentImageIndex
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  حذف گروهی فیدبک‌ها
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-bold text-red-600">{selectedFeedbackIds.size}</span> فیدبک را حذف کنید؟
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 block">
                  فیدبک‌ها به سطل آشغال منتقل می‌شوند و می‌توانید بعداً آن‌ها را بازگردانید.
                </span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      حذف {selectedFeedbackIds.size} فیدبک
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Archive Modal */}
        {showBulkArchiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <Archive className="text-gray-600 dark:text-gray-400" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  آرشیو گروهی فیدبک‌ها
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-bold text-gray-700 dark:text-gray-200">{selectedFeedbackIds.size}</span> فیدبک را آرشیو کنید؟
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowBulkArchiveModal(false)}
                  disabled={bulkOperationLoading}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleBulkArchive}
                  disabled={bulkOperationLoading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      در حال آرشیو...
                    </>
                  ) : (
                    <>
                      <Archive size={18} />
                      آرشیو {selectedFeedbackIds.size} فیدبک
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Bulk Forward Modal */}
        <BulkForwardModal
          isOpen={showBulkForwardModal}
          onClose={() => setShowBulkForwardModal(false)}
          onConfirm={handleBulkForward}
          managers={managers}
          selectedCount={selectedFeedbackIds.size}
          loading={bulkOperationLoading}
        />

        {/* New BulkActionsBar Component */}
        <BulkActionsBar
          selectedCount={selectedFeedbackIds.size}
          onClearSelection={clearSelection}
          onForward={() => setShowBulkForwardModal(true)}
          onArchive={() => setShowBulkArchiveModal(true)}
          onDelete={() => setShowBulkDeleteModal(true)}
          onMarkComplete={handleBulkComplete}
          onMarkDeferred={handleBulkDeferred}
        />
      </main>
    </div>
  );
}

export default function FeedbacksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <AppHeader />
        <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-xl">در حال بارگذاری...</div>
            </div>
          </div>
        </main>
      </div>
    }>
      <FeedbacksPageContent />
    </Suspense>
  );
}

