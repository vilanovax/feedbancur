"use client";

import { useEffect, useState } from "react";
import { X, Eye, EyeOff, User, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface ViewerData {
  id: string;
  name: string;
  mobile: string;
  role: string;
  department: {
    id: string;
    name: string;
  } | null;
  viewed: boolean;
  viewedAt: string | null;
}

interface Stats {
  totalTarget: number;
  totalViewed: number;
  totalNotViewed: number;
  viewPercentage: number;
}

interface AnnouncementData {
  id: string;
  title: string;
  priority: string | null;
  createdAt: string;
  departmentId: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

interface AnnouncementViewersModalProps {
  announcementId: string;
  onClose: () => void;
}

export default function AnnouncementViewersModal({
  announcementId,
  onClose,
}: AnnouncementViewersModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<ViewerData[]>([]);
  const [filter, setFilter] = useState<"all" | "viewed" | "not-viewed">("all");

  useEffect(() => {
    fetchViewers();
  }, [announcementId]);

  const fetchViewers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements/${announcementId}/viewers`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncement(data.announcement);
        setStats(data.stats);
        setUsers(data.users);
      } else {
        const error = await res.json();
        toast.error(error.error || "خطا در دریافت اطلاعات");
        onClose();
      }
    } catch (error) {
      console.error("Error fetching viewers:", error);
      toast.error("خطا در دریافت اطلاعات");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "viewed") return user.viewed;
    if (filter === "not-viewed") return !user.viewed;
    return true;
  });

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
            بالا
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
            متوسط
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
            کم
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Eye size={24} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                گزارش بازدید اعلان
              </h2>
            </div>
            {!loading && announcement && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {announcement.title}
                  </span>
                  {announcement.priority && getPriorityBadge(announcement.priority)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  ایجاد شده توسط: {announcement.createdBy.name} •{" "}
                  {announcement.department ? announcement.department.name : "همه شرکت"}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
            </div>
          ) : (
            <div className="p-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    کل مخاطبان
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {stats?.totalTarget || 0}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                    مشاهده کرده‌اند
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {stats?.totalViewed || 0}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400 mb-1">
                    مشاهده نکرده‌اند
                  </div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-300">
                    {stats?.totalNotViewed || 0}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                    درصد مشاهده
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {stats?.viewPercentage || 0}%
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    filter === "all"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  همه ({users.length})
                </button>
                <button
                  onClick={() => setFilter("viewed")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    filter === "viewed"
                      ? "border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  مشاهده شده ({stats?.totalViewed || 0})
                </button>
                <button
                  onClick={() => setFilter("not-viewed")}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    filter === "not-viewed"
                      ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  مشاهده نشده ({stats?.totalNotViewed || 0})
                </button>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    کاربری یافت نشد
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        user.viewed
                          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {user.viewed ? (
                          <CheckCircle
                            size={20}
                            className="text-green-600 dark:text-green-400 flex-shrink-0"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="text-red-600 dark:text-red-400 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User size={14} className="text-gray-500 dark:text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {user.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({user.mobile})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.department?.name || "بدون بخش"} •{" "}
                            {user.role === "MANAGER" ? "مدیر" : "کارمند"}
                          </div>
                        </div>
                      </div>
                      {user.viewed && user.viewedAt && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Calendar size={14} />
                          <span>
                            {new Date(user.viewedAt).toLocaleDateString("fa-IR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
