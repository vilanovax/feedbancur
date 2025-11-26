"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Bell, AlertTriangle, AlertCircle, Info, Calendar, User, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

type SortOption = "newest" | "oldest" | "priority" | "title";

export default function MobileAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mobileAnnouncementsSortOption") as SortOption;
      if (saved && ["newest", "oldest", "priority", "title"].includes(saved)) {
        return saved;
      }
    }
    return "newest";
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchAnnouncements();
    }
  }, [session]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return <AlertTriangle className="text-red-500" size={20} />;
      case "MEDIUM":
        return <AlertCircle className="text-yellow-500" size={20} />;
      case "LOW":
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return "border-r-4 border-red-500 bg-red-50 dark:bg-red-900/20";
      case "MEDIUM":
        return "border-r-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "LOW":
        return "border-r-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-r-4 border-gray-300";
    }
  };

  const getPriorityValue = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return 3;
      case "MEDIUM":
        return 2;
      case "LOW":
        return 1;
      default:
        return 0;
    }
  };

  // ذخیره تنظیمات مرتب‌سازی در localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mobileAnnouncementsSortOption", sortOption);
    }
  }, [sortOption]);

  // مرتب‌سازی اعلانات
  const sortedAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority":
          const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title, "fa");
        default:
          return 0;
      }
    });
    return sorted;
  }, [announcements, sortOption]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  const role = session?.user?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  return (
    <MobileLayout role={role} title="اعلانات">
      <div className="space-y-4">
        {/* Sort Options */}
        {!loading && announcements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                مرتب‌سازی:
              </label>
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="priority">اولویت</option>
              <option value="title">عنوان</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">اعلانی یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 ${getPriorityColor(
                  announcement.priority
                )}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {announcement.department && (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{announcement.department.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {format(
                            new Date(announcement.createdAt),
                            "yyyy/MM/dd"
                          )}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

