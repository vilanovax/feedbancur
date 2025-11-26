"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Star, Calendar, Building2, User, ArrowUpDown, Send, X, Archive, CheckCircle, Filter, Clock, Send as SendIcon, FolderArchive, Trash2, AlertTriangle, MessageCircle, Check } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

export default function FeedbacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "forwarded" | "archived" | "deferred" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "rating" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [forwardNotes, setForwardNotes] = useState("");
  const [forwardingFeedback, setForwardingFeedback] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveAdminNotes, setArchiveAdminNotes] = useState("");
  const [archiveUserResponse, setArchiveUserResponse] = useState("");
  const [archivingFeedback, setArchivingFeedback] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeUserResponse, setCompleteUserResponse] = useState("");
  const [completingFeedback, setCompletingFeedback] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [newMessageTexts, setNewMessageTexts] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, []);

  // دریافت تعداد پیام‌های خوانده نشده برای همه فیدبک‌ها
  useEffect(() => {
    if (feedbacks.length > 0) {
      feedbacks.forEach((feedback) => {
        if (feedback.forwardedToId) {
          fetchUnreadCount(feedback.id);
        }
      });
    }
  }, [feedbacks]);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedDepartment, selectedStatus, quickFilter]);

  // دریافت تعداد پیام‌های خوانده نشده برای همه فیدبک‌ها
  useEffect(() => {
    if (feedbacks.length > 0) {
      feedbacks.forEach((feedback) => {
        if (feedback.forwardedToId) {
          fetchUnreadCount(feedback.id);
        }
      });
    }
  }, [feedbacks]);

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
      console.log("Fetching from:", url);
      
      const res = await fetch(url);
      console.log("Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("API Response:", data.length, "feedbacks");
        console.log("Sample feedback:", data[0]);
        console.log("Quick Filter:", quickFilter);
        console.log("Selected Status:", selectedStatus);
        
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
              console.log("Active filtered:", filteredData.length, "from", data.length);
              break;
            case "forwarded":
              // فیدبک‌های ارجاع شده
              filteredData = data.filter((f: any) => f.forwardedToId && f.status !== "ARCHIVED");
              console.log("Forwarded filtered:", filteredData.length, "from", data.length);
              break;
            case "archived":
              // فیدبک‌های آرشیو شده (API قبلاً فیلتر کرده)
              filteredData = data;
              console.log("Archived filtered:", filteredData.length);
              break;
            case "deferred":
              // فیدبک‌های رسیدگی آینده (API قبلاً فیلتر کرده)
              filteredData = data;
              console.log("Deferred filtered:", filteredData.length);
              break;
            case "completed":
              // فیدبک‌های انجام شده (API قبلاً فیلتر کرده)
              filteredData = data;
              console.log("Completed filtered:", filteredData.length);
              break;
            case "all":
            default:
              // همه فیدبک‌ها (به جز آرشیو شده‌ها) - بدون فیلتر اضافی
              filteredData = data;
              console.log("All filter - showing all:", filteredData.length, "from", data.length);
              break;
          }
        } else {
          // اگر selectedStatus تنظیم شده، از داده‌های API استفاده کن (بدون فیلتر اضافی)
          filteredData = data;
          console.log("Using selectedStatus filter:", filteredData.length);
        }

        console.log("Final feedbacks to display:", filteredData.length);
        setFeedbacks(filteredData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "DEFERRED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "در انتظار";
      case "REVIEWED":
        return "بررسی شده";
      case "ARCHIVED":
        return "آرشیو شده";
      case "DEFERRED":
        return "رسیدگی آینده";
      case "COMPLETED":
        return "انجام شد";
      default:
        return status;
    }
  };

  const sortFeedbacks = (feedbacksToSort: any[]) => {
    const sorted = [...feedbacksToSort].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

  const handleForwardFeedback = async () => {
    if (!selectedManager || !selectedFeedback) {
      alert("لطفا مدیر مقصد را انتخاب کنید");
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
        alert("فیدبک با موفقیت ارجاع داده شد");
        closeForwardModal();
        fetchFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در ارجاع فیدبک");
      }
    } catch (error) {
      console.error("Error forwarding feedback:", error);
      alert("خطا در ارجاع فیدبک");
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
        fetchFeedbacks();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف فیدبک");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      alert("خطا در حذف فیدبک");
    } finally {
      setDeletingFeedback(false);
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
        alert("فیدبک با موفقیت آرشیو شد");
        closeArchiveModal();
        fetchFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در آرشیو کردن فیدبک");
      }
    } catch (error) {
      console.error("Error archiving feedback:", error);
      alert("خطا در آرشیو کردن فیدبک");
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
        alert("وضعیت فیدبک با موفقیت تغییر کرد");
        fetchFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در تغییر وضعیت");
      }
    } catch (error) {
      console.error("Error changing status:", error);
      alert("خطا در تغییر وضعیت");
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
        alert("فیدبک با موفقیت تکمیل شد");
        setShowCompleteModal(false);
        setSelectedFeedback(null);
        setCompleteUserResponse("");
        fetchFeedbacks();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در تکمیل فیدبک");
      }
    } catch (error) {
      console.error("Error completing feedback:", error);
      alert("خطا در تکمیل فیدبک");
    } finally {
      setCompletingFeedback(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "در انتظار",
      REVIEWED: "بررسی شده",
      ARCHIVED: "آرشیو شده",
      DEFERRED: "رسیدگی آینده",
      COMPLETED: "انجام شد",
    };
    return labels[status] || status;
  };

  // توابع مدیریت چت
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
        const msgs = await res.json();
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
    if (!text) return;

    try {
      const res = await fetch(`/api/feedback/${feedbackId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => ({
          ...prev,
          [feedbackId]: [...(prev[feedbackId] || []), newMessage],
        }));
        setNewMessageTexts((prev) => ({ ...prev, [feedbackId]: "" }));
        // اسکرول به پایین
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        // به‌روزرسانی پیام‌ها برای دریافت isRead به‌روز شده
        setTimeout(() => {
          fetchMessages(feedbackId);
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            فیدبک‌ها
          </h1>
          <Link
            href="/feedback/new"
            className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>فیدبک جدید</span>
          </Link>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">فیلتر سریع</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setQuickFilter("all");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Filter size={16} />
              همه
            </button>
            <button
              onClick={() => {
                setQuickFilter("active");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <CheckCircle size={16} />
              فعال
            </button>
            <button
              onClick={() => {
                setQuickFilter("forwarded");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "forwarded"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <SendIcon size={16} />
              ارجاع شده
            </button>
            <button
              onClick={() => {
                setQuickFilter("deferred");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "deferred"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <Clock size={16} />
              رسیدگی آینده
            </button>
            <button
              onClick={() => {
                setQuickFilter("completed");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <CheckCircle size={16} />
              انجام شد
            </button>
            <button
              onClick={() => {
                setQuickFilter("archived");
                setSelectedStatus("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                quickFilter === "archived"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <FolderArchive size={16} />
              آرشیو
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                فیلتر بر اساس بخش
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه بخش‌ها</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                فیلتر بر اساس وضعیت
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setQuickFilter("all");
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="PENDING">در انتظار</option>
                <option value="REVIEWED">بررسی شده</option>
                <option value="DEFERRED">رسیدگی آینده</option>
                <option value="COMPLETED">انجام شد</option>
                <option value="ARCHIVED">آرشیو شده</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">مرتب‌سازی:</span>
              <button
                onClick={() => toggleSort("date")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                  sortBy === "date"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                تاریخ
                {sortBy === "date" && <ArrowUpDown size={14} />}
              </button>
              <button
                onClick={() => toggleSort("rating")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                  sortBy === "rating"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                امتیاز
                {sortBy === "rating" && <ArrowUpDown size={14} />}
              </button>
              <button
                onClick={() => toggleSort("status")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
                  sortBy === "status"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                وضعیت
                {sortBy === "status" && <ArrowUpDown size={14} />}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              در حال بارگذاری...
            </div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-600 dark:text-gray-400">
              فیدبکی یافت نشد
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortFeedbacks(feedbacks).map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
                    {feedback.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    {feedback.forwardedToId && (
                      <button
                        onClick={() => openChatModal(feedback.id)}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition relative"
                        title="چت با مدیر"
                      >
                        <MessageCircle size={18} />
                        {unreadCounts[feedback.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCounts[feedback.id]}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {getStatusText(feedback.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Building2 size={14} />
                    <span>{feedback.department.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <User size={14} />
                    <span>{feedback.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Calendar size={14} />
                    <span>
                      {format(new Date(feedback.createdAt), "yyyy/MM/dd")}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                  {feedback.content}
                </p>

                {(session?.user.role === "ADMIN" || session?.user.role === "MANAGER") && (
                  <div className="space-y-2">
                    {/* Status Dropdown */}
                    <select
                      value={feedback.status}
                      onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="PENDING">در انتظار</option>
                      <option value="REVIEWED">بررسی شده</option>
                      <option value="DEFERRED">رسیدگی آینده</option>
                      <option value="COMPLETED">انجام شد</option>
                      <option value="ARCHIVED">آرشیو</option>
                    </select>

                    <div className="flex gap-2">
                      {/* Forward Button */}
                      <button
                        onClick={() => openForwardModal(feedback)}
                        disabled={feedback.status === "ARCHIVED" || feedback.status === "COMPLETED"}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                        ارجاع
                      </button>

                      {/* Archive Button */}
                      <button
                        onClick={() => openArchiveModal(feedback)}
                        disabled={feedback.status === "ARCHIVED"}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
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
              <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
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
                  disabled={!newMessageTexts[selectedFeedbackForChat]?.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  ارسال
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

