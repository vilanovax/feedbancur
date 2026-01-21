"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Settings,
  RefreshCw,
  Search,
  Loader2,
  BellOff,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";
import NotificationCard from "@/components/notifications/NotificationCard";
import NotificationFilters, {
  NotificationFilter,
} from "@/components/notifications/NotificationFilters";
import { useNotifications } from "@/lib/swr/hooks";

interface Notification {
  id: string;
  title: string;
  content?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  isRead: boolean;
  createdAt: string;
  createdBy?: {
    name: string;
  };
  department?: {
    name: string;
  };
  link?: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: notifications = [], isLoading, mutate } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    mutate(
      (current: Notification[] | undefined) =>
        current?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      false
    );

    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (!res.ok) {
        // Revert on error
        mutate();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      mutate();
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    mutate(
      (current: Notification[] | undefined) =>
        current?.map((n) => ({ ...n, isRead: true })),
      false
    );

    try {
      const res = await fetch("/api/notifications/all/read", {
        method: "PATCH",
      });

      if (!res.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      mutate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;

    // Optimistic update
    mutate(
      (current: Notification[] | undefined) =>
        current?.filter((n) => n.id !== id),
      false
    );

    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        mutate();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      mutate();
    }
  };

  // Filter and search
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply filter
    switch (activeFilter) {
      case "unread":
        filtered = filtered.filter((n) => !n.isRead);
        break;
      case "important":
        filtered = filtered.filter(
          (n) => n.priority === "HIGH" || n.priority === "MEDIUM"
        );
        break;
      case "read":
        filtered = filtered.filter((n) => n.isRead);
        break;
      default:
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content?.toLowerCase().includes(query) ||
          n.createdBy?.name.toLowerCase().includes(query) ||
          n.department?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeFilter, searchQuery]);

  // Calculate counts
  const counts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      important: notifications.filter(
        (n) => n.priority === "HIGH" || n.priority === "MEDIUM"
      ).length,
      read: notifications.filter((n) => n.isRead).length,
    }),
    [notifications]
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  اعلانات
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {counts.unread > 0
                    ? `${counts.unread} اعلان خوانده نشده`
                    : "همه اعلانات خوانده شده است"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {counts.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors touch-manipulation"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">علامت همه خوانده شده</span>
                  <span className="sm:hidden">خوانده همه</span>
                </button>
              )}

              <button
                onClick={() => mutate()}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors touch-manipulation"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">بروزرسانی</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در اعلانات..."
              className="w-full pr-10 pl-4 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <BellOff className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? "نتیجه‌ای یافت نشد" : "اعلانی وجود ندارد"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "جستجوی خود را تغییر دهید یا فیلتر دیگری انتخاب کنید"
                  : "وقتی اعلان جدیدی داشته باشید، اینجا نمایش داده می‌شود"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
