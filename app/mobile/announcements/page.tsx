"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";
import AnnouncementModal from "@/components/AnnouncementModal";
import { Bell, AlertTriangle, AlertCircle, Info, Calendar, User, ArrowUpDown, Paperclip, Plus } from "lucide-react";
import { format } from "date-fns";

type SortOption = "newest" | "oldest" | "priority" | "title";

export default function MobileAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(false);
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
      checkAnnouncementPermission();
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

  const checkAnnouncementPermission = async () => {
    // فقط برای مدیران چک می‌کنیم
    if (session?.user?.role !== "MANAGER" || !session?.user?.departmentId) {
      setCanCreateAnnouncement(false);
      return;
    }

    try {
      const res = await fetch(`/api/departments/${session.user.departmentId}`);
      if (res.ok) {
        const department = await res.json();
        setCanCreateAnnouncement(department.canCreateAnnouncement || false);
      }
    } catch (error) {
      console.error("Error checking announcement permission:", error);
      setCanCreateAnnouncement(false);
    }
  };

  const openModal = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
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
              <Link
                key={announcement.id}
                href={`/announcements/${announcement.id}`}
                className={`block w-full text-right bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all ${getPriorityColor(
                  announcement.priority
                )}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-1">
                    {getPriorityIcon(announcement.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">
                        {announcement.title}
                      </h3>
                      {announcement.attachments && Array.isArray(announcement.attachments) && announcement.attachments.length > 0 && (
                        <Paperclip size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {announcement.department ? (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{announcement.department.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="text-blue-600 dark:text-blue-400">همه واحدها</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      برای مشاهده جزئیات کلیک کنید
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* مودال نمایش جزئیات */}
      {showModal && selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={closeModal}
        />
      )}

      {/* دکمه Float برای مدیران با مجوز ایجاد اعلان */}
      {canCreateAnnouncement && (
        <Link
          href="/mobile/manager/announcements/create"
          className="fixed bottom-20 left-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 active:scale-95 z-40"
          aria-label="ایجاد اعلان جدید"
        >
          <Plus size={28} />
        </Link>
      )}
    </MobileLayout>
  );
}

