"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Bell,
  Trophy,
  Menu,
  X,
  LogOut,
  User,
  Users,
  Send,
  ArrowRight,
  Settings,
  Edit,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import { formatPersianDate } from "@/lib/date-utils";
import { toast } from "sonner";

interface UserStatus {
  id: string;
  name: string;
  color: string;
}

interface MobileLayoutProps {
  children: ReactNode;
  role: "EMPLOYEE" | "MANAGER";
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export default function MobileLayout({ 
  children, 
  role, 
  title,
  showBackButton,
  backHref 
}: MobileLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasAssignedTasks, setHasAssignedTasks] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<UserStatus | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;
  
  // تشخیص صفحه اصلی
  const homePath = role === "EMPLOYEE" ? "/mobile/employee" : "/mobile/manager";
  const isHomePage = pathname === homePath;
  
  // نمایش دکمه بازگشت اگر در صفحه اصلی نیستیم یا به صورت صریح درخواست شده باشد
  const shouldShowBack = showBackButton !== undefined 
    ? showBackButton 
    : !isHomePage;
  
  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.push(homePath);
    }
  };

  // دریافت استتوس‌ها
  useEffect(() => {
    if (session?.user) {
      fetchUserStatuses();
      fetchCurrentStatus();
    }
  }, [session]);

  const fetchUserStatuses = async () => {
    try {
      const userRole = session?.user?.role || "EMPLOYEE";
      const res = await fetch(`/api/user-statuses?role=${userRole}&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        setUserStatuses(data);
      }
    } catch (err) {
      console.error("Error fetching user statuses:", err);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user?.status) {
          setCurrentStatus(data.user.status);
        }
      }
    } catch (err) {
      console.error("Error fetching current status:", err);
    }
  };

  const handleStatusChange = async (status: UserStatus | null) => {
    setStatusLoading(true);
    try {
      // دریافت اطلاعات فعلی کاربر برای حفظ فیلدهای دیگر
      const currentUserRes = await fetch("/api/users/me");
      if (!currentUserRes.ok) {
        throw new Error("خطا در دریافت اطلاعات کاربر");
      }
      const currentUserData = await currentUserRes.json();
      const currentUser = currentUserData.user;

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentUser?.name || session?.user?.name,
          email: currentUser?.email || session?.user?.email || null,
          avatar: currentUser?.avatar || null,
          statusId: status?.id || null,
        }),
      });

      if (res.ok) {
        setCurrentStatus(status);
        setStatusMenuOpen(false);
        toast.success(status ? `استتوس به "${status.name}" تغییر کرد` : "استتوس حذف شد");
      } else {
        const data = await res.json();
        toast.error(data.error || "خطا در تغییر استتوس");
      }
    } catch (err) {
      toast.error("خطا در تغییر استتوس");
    } finally {
      setStatusLoading(false);
    }
  };

  // بستن منوی استتوس با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // دریافت نوتیفیکیشن‌ها
  useEffect(() => {
    if (session?.user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/notifications?unreadOnly=true");
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // دریافت همه نوتیفیکیشن‌ها وقتی مودال باز است
  useEffect(() => {
    if (notificationsOpen && session?.user) {
      const fetchAllNotifications = async () => {
        try {
          const res = await fetch("/api/notifications");
          if (res.ok) {
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchAllNotifications();
      // به‌روزرسانی هر 10 ثانیه یکبار
      const interval = setInterval(fetchAllNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [notificationsOpen, session]);

  // بستن مودال با کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notificationsOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // علامت‌گذاری به عنوان خوانده شده
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // بستن مودال
    setNotificationsOpen(false);

    // انتقال به صفحه مربوطه
    if (notification.redirectUrl) {
      router.push(notification.redirectUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/all/read", {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // بررسی اعلان‌های جدید
  useEffect(() => {
    const checkNewAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const announcements = await res.json();
          // اعلان‌های 24 ساعت گذشته را به عنوان جدید در نظر می‌گیریم
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);

          const newAnnouncements = announcements.filter((announcement: any) => {
            const announcementDate = new Date(announcement.createdAt);
            return announcementDate > oneDayAgo && announcement.isActive;
          });

          setHasNewAnnouncements(newAnnouncements.length > 0);
        }
      } catch (error) {
        console.error("Error checking new announcements:", error);
      }
    };

    if (session) {
      checkNewAnnouncements();
      // بررسی هر 5 دقیقه یکبار
      const interval = setInterval(checkNewAnnouncements, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Heartbeat - ارسال وضعیت آنلاین هر 30 ثانیه
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/users/heartbeat", { method: "POST" });
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    };

    if (session?.user) {
      sendHeartbeat(); // ارسال فوری
      const interval = setInterval(sendHeartbeat, 30000); // هر 30 ثانیه
      return () => clearInterval(interval);
    }
  }, [session]);

  // بررسی تسک‌های ارجاع شده برای مدیر
  useEffect(() => {
    const checkAssignedTasks = async () => {
      if (role !== "MANAGER") return;

      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const tasks = await res.json();
          // تسک‌هایی که status آنها IN_PROGRESS یا TODO باشد
          const activeTasks = tasks.filter((task: any) =>
            task.status === "IN_PROGRESS" || task.status === "TODO"
          );
          setHasAssignedTasks(activeTasks.length > 0);
        }
      } catch (error) {
        console.error("Error checking assigned tasks:", error);
      }
    };

    if (session && role === "MANAGER") {
      checkAssignedTasks();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(checkAssignedTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [session, role]);

  const navItems = [
    {
      name: "داشبورد",
      href: role === "EMPLOYEE" ? "/mobile/employee" : "/mobile/manager",
      icon: Home,
    },
    {
      name: "ثبت فیدبک",
      href: "/mobile/feedback/new",
      icon: MessageSquare,
    },
    {
      name: "فیدبک‌های من",
      href: "/mobile/feedback",
      icon: MessageSquare,
    },
    {
      name: "آزمون‌های شخصیت‌سنجی",
      href: role === "MANAGER" ? "/mobile/manager/assessments" : "/mobile/employee/assessments",
      icon: ClipboardList,
    },
    {
      name: "اعلانات",
      href: "/mobile/announcements",
      icon: Bell,
    },
    {
      name: "نظرسنجی‌ها",
      href: "/mobile/polls",
      icon: CheckSquare,
    },
    {
      name: "بورد افتخارات",
      href: "/mobile/public-board",
      icon: Trophy,
    },
    {
      name: "وضعیت تیم",
      href: role === "MANAGER" ? "/mobile/manager/team-status" : "/mobile/employee/team-status",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            {shouldShowBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="بازگشت"
              >
                <ArrowRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="منو"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white flex-1 text-center">
            {title || (role === "EMPLOYEE" ? "پنل کارمند" : "پنل مدیر")}
          </h1>
          <div className="flex items-center gap-1">
            {/* آیکون نوتیفیکیشن */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="اعلانات"
              >
                <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* باتن شیت نوتیفیکیشن‌ها */}
              {notificationsOpen && (
                <div className="fixed inset-0 z-[100] flex items-end">
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setNotificationsOpen(false)}
                  ></div>
                  <div className="relative bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col z-[101] animate-slide-up">
                    {/* Handle Bar */}
                    <div className="flex justify-center pt-3 pb-2">
                      <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                        اعلانات
                      </h2>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                          >
                            خواندن همه
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {notifications.length > 0 ? (
                        <div className="space-y-3">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                                notification.isRead
                                  ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.isRead
                                    ? "bg-gray-200 dark:bg-gray-600"
                                    : "bg-blue-500"
                                }`}>
                                  <Bell className={`w-5 h-5 ${notification.isRead ? "text-gray-500 dark:text-gray-400" : "text-white"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                                    {notification.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                    {notification.content}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatPersianDate(new Date(notification.createdAt))}
                                    </span>
                                    {!notification.isRead && (
                                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">جدید</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mb-3 opacity-30" />
                          <p className="text-sm">اعلانی وجود ندارد</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/mobile/settings")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="تنظیمات"
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            
            {/* Status Dropdown on Profile Icon */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => {
                  setStatusMenuOpen(!statusMenuOpen);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="وضعیت"
              >
                <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                {currentStatus && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full border border-white dark:border-gray-800"
                    style={{ backgroundColor: currentStatus.color }}
                  ></span>
                )}
                <ChevronDown size={14} className={`absolute bottom-0 left-0 ${statusMenuOpen ? "rotate-180" : ""} transition-transform`} />
              </button>

              {/* Status Dropdown */}
              {statusMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    انتخاب استتوس
                  </div>

                  {/* بدون استتوس */}
                  <button
                    onClick={() => handleStatusChange(null)}
                    disabled={statusLoading}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                      !currentStatus ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    <span className="text-gray-700 dark:text-gray-300">بدون استتوس</span>
                    {!currentStatus && <span className="mr-auto text-blue-600">✓</span>}
                  </button>

                  {/* لیست استتوس‌ها */}
                  {userStatuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusLoading}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        currentStatus?.id === status.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      ></span>
                      <span className="text-gray-700 dark:text-gray-300">{status.name}</span>
                      {currentStatus?.id === status.id && (
                        <span className="mr-auto text-blue-600">✓</span>
                      )}
                    </button>
                  ))}

                  {/* Separator */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                  {/* ویرایش اطلاعات */}
                  <button
                    onClick={() => {
                      setStatusMenuOpen(false);
                      router.push("/mobile/profile/edit");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش اطلاعات</span>
                  </button>

                  {/* خروج */}
                  <button
                    onClick={() => {
                      setStatusMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                {(session?.user as any)?.avatar ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={(session?.user as any)?.avatar}
                      alt="پروفایل"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.mobile}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  {role === "EMPLOYEE" ? "کارمند" : "مدیر"}
                </span>
                {/* Status Badge */}
                {currentStatus && (
                  <span
                    className="inline-block px-2 py-1 text-white text-xs rounded-full"
                    style={{ backgroundColor: currentStatus.color }}
                  >
                    {currentStatus.name}
                  </span>
                )}
              </div>

              {/* Status Selector in Sidebar */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">استتوس</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleStatusChange(null)}
                    disabled={statusLoading}
                    className={`px-2 py-1 text-xs rounded-full border transition ${
                      !currentStatus
                        ? "bg-gray-200 dark:bg-gray-600 border-gray-400 text-gray-700 dark:text-white"
                        : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    بدون
                  </button>
                  {userStatuses.map((status) => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusLoading}
                      className={`px-2 py-1 text-xs rounded-full transition ${
                        currentStatus?.id === status.id
                          ? "ring-2 ring-offset-1 ring-blue-500"
                          : "opacity-80"
                      }`}
                      style={{
                        backgroundColor: status.color,
                        color: '#fff',
                      }}
                    >
                      {status.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <nav className="p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">خروج</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="px-4 py-4">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="flex items-center justify-around px-2 py-2">
          {[
            navItems[0], // داشبورد
            role === "MANAGER"
              ? navItems.find((item) => item.href === "/mobile/manager/tasks") || {
                  name: "تسک‌ها",
                  href: "/mobile/manager/tasks",
                  icon: CheckSquare,
                }
              : navItems[1], // ثبت فیدبک (برای کارمند)
            navItems[2], // فیدبک‌های من
            role === "MANAGER"
              ? {
                  name: "اعلانات",
                  href: "/mobile/announcements",
                  icon: Bell,
                }
              : {
                  name: "اعلانات",
                  href: "/mobile/announcements",
                  icon: Bell,
                },
          ].map((item) => {
            const Icon = item.icon;
            const isAnnouncements = item.href === "/mobile/announcements";
            const isTasks = item.href === "/mobile/manager/tasks";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isAnnouncements && hasNewAnnouncements && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                  {isTasks && hasAssignedTasks && role === "MANAGER" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                </div>
                <span className="text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

