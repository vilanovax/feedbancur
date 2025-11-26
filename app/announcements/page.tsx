"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ArrowRight, AlertCircle, Info, AlertTriangle, Plus, Settings, Grid3x3, List, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AdminHeader";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "priority" | "title";

export default function AnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>(() => {
    // بارگذاری از cache در صورت وجود
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("announcements_cache");
      const cacheTime = localStorage.getItem("announcements_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Cache برای 5 دقیقه معتبر است
        if (timeDiff < 5 * 60 * 1000) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            // اگر parse نشد، cache را پاک کن
            localStorage.removeItem("announcements_cache");
            localStorage.removeItem("announcements_cache_time");
          }
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("announcementsSortOption") as SortOption;
      if (saved && ["newest", "oldest", "priority", "title"].includes(saved)) {
        return saved;
      }
    }
    return "newest";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("announcementsViewMode") as ViewMode;
      if (saved && (saved === "grid" || saved === "list")) {
        return saved;
      }
    }
    return "list";
  });
  const isFirstRender = useRef(true);

  // ذخیره وضعیت در localStorage (نه در اولین render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("announcementsViewMode", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("announcementsSortOption", sortOption);
    }
  }, [sortOption]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchAnnouncements();
    }
  }, [status, router]);

  const fetchAnnouncements = async () => {
    // اگر cache معتبر وجود دارد، از آن استفاده کن
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("announcements_cache");
      const cacheTime = localStorage.getItem("announcements_cache_time");
      if (cached && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        if (timeDiff < 5 * 60 * 1000) {
          try {
            const cachedData = JSON.parse(cached);
            setAnnouncements(cachedData);
            setLoading(false);
            // در پس‌زمینه به‌روزرسانی کن
            fetchAnnouncementsFromAPI();
            return;
          } catch (e) {
            // اگر parse نشد، ادامه بده و از API بگیر
          }
        }
      }
    }

    // اگر cache وجود ندارد یا منقضی شده، از API بگیر
    await fetchAnnouncementsFromAPI();
  };

  const fetchAnnouncementsFromAPI = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
        // ذخیره در cache
        if (typeof window !== "undefined") {
          localStorage.setItem("announcements_cache", JSON.stringify(data));
          localStorage.setItem("announcements_cache_time", Date.now().toString());
        }
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
        return <AlertTriangle className="text-red-500" size={24} />;
      case "MEDIUM":
        return <AlertCircle className="text-yellow-500" size={24} />;
      case "LOW":
        return <Info className="text-blue-500" size={24} />;
      default:
        return <Bell className="text-gray-500" size={24} />;
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

  // فیلتر و مرتب‌سازی اعلانات
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements;

    // جستجو
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(query) ||
          announcement.content.toLowerCase().includes(query) ||
          announcement.createdBy?.name?.toLowerCase().includes(query) ||
          announcement.department?.name?.toLowerCase().includes(query)
      );
    }

    // مرتب‌سازی
    const sorted = [...filtered].sort((a, b) => {
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
  }, [announcements, searchQuery, sortOption]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex" dir="rtl">
      <Sidebar />
      <AppHeader />
      <main className="flex-1 lg:mr-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Bell size={32} />
            اعلانات
          </h1>
          <div className="flex gap-3">
            {(session?.user.role === "ADMIN" || session?.user.role === "MANAGER") && (
              <>
                <Link
                  href="/announcements/create"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus size={20} />
                  اعلان جدید
                </Link>
                <Link
                  href="/announcements/manage"
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  <Settings size={20} />
                  مدیریت اعلانات
                </Link>
              </>
            )}
          </div>
        </div>

        {/* جستجو، سورت و تغییر نمایش */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* جستجو */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="جستجو در عنوان، محتوا، نویسنده یا بخش..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {/* سورت */}
            <div className="flex gap-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="priority">اولویت</option>
                <option value="title">عنوان (الفبایی)</option>
              </select>
              {/* تغییر نمایش */}
              <div className="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="نمایش گریدی"
                >
                  <Grid3x3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="نمایش لیستی"
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* لیست یا گرید اعلانات */}
        {loading && announcements.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedAnnouncements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? "نتیجه‌ای یافت نشد" : "هیچ اعلانی وجود ندارد"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col ${getPriorityColor(
                  announcement.priority
                )}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 mb-2">
                      {announcement.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(announcement.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm line-clamp-3 flex-1">
                  {announcement.content}
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center gap-2">
                    <span>از طرف: {announcement.createdBy?.name}</span>
                  </div>
                  {announcement.department ? (
                    <div className="flex items-center gap-2">
                      <span>بخش: {announcement.department.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-400">اعلان عمومی</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${getPriorityColor(
                  announcement.priority
                )}`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {announcement.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(announcement.createdAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>از طرف: {announcement.createdBy?.name}</span>
                      {announcement.department && (
                        <span>بخش: {announcement.department.name}</span>
                      )}
                      {!announcement.department && (
                        <span className="text-blue-600 dark:text-blue-400">
                          اعلان عمومی
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
