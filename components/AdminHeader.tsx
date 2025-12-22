"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Settings, Trash2, MessageCircle, Bell, X, Plus, User, ChevronDown, Edit, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { formatPersianDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface UserStatus {
  id: string;
  name: string;
  color: string;
}

export default function AppHeader() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [hasTrashItems, setHasTrashItems] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState<UserStatus | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // بارگذاری لوگو از localStorage یا API
    const savedLogo = localStorage.getItem("appLogo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    } else {
      // بارگذاری از API فقط برای ADMIN
      if (session?.user?.role === "ADMIN") {
        fetch("/api/settings")
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            return null;
          })
          .then((data) => {
            if (data?.logoUrl) {
              setLogoUrl(data.logoUrl);
              localStorage.setItem("appLogo", data.logoUrl);
            }
          })
          .catch(() => {
            // استفاده از لوگوی پیش‌فرض
          });
      }
    }
  }, [session]);

  // بررسی وجود آیتم در سطل آشغال
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      const checkTrash = async () => {
        try {
          const res = await fetch("/api/feedback/trash/count");
          if (res.ok) {
            const data = await res.json();
            setHasTrashItems(data.count > 0);
          }
        } catch (error) {
          console.error("Error checking trash count:", error);
          setHasTrashItems(false);
        }
      };

      checkTrash();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(checkTrash, 30000);
      return () => clearInterval(interval);
    } else {
      setHasTrashItems(false);
    }
  }, [session]);

  // بررسی وجود پیام‌های خوانده نشده
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      const checkUnreadMessages = async () => {
        try {
          const res = await fetch("/api/feedback/messages/unread-count");
          if (res.ok) {
            const data = await res.json();
            setHasUnreadMessages(data.count > 0);
          }
        } catch (error) {
          console.error("Error checking unread messages:", error);
          setHasUnreadMessages(false);
        }
      };

      checkUnreadMessages();
      // بررسی هر 30 ثانیه یکبار
      const interval = setInterval(checkUnreadMessages, 30000);
      return () => clearInterval(interval);
    } else {
      setHasUnreadMessages(false);
    }
  }, [session]);

  // دریافت تعداد نوتیفیکیشن‌های خوانده نشده
  useEffect(() => {
    if (session?.user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/notifications?unreadOnly=true");
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount || 0);
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
          }
        } catch (error) {
          console.error("Error fetching all notifications:", error);
        }
      };

      fetchAllNotifications();
    }
  }, [notificationsOpen, session]);

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

  // دریافت استتوس‌های موجود و استتوس فعلی کاربر
  useEffect(() => {
    if (session?.user) {
      fetchUserStatuses();
      fetchCurrentStatus();
    }
  }, [session]);

  // بستن منوی استتوس با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };

    if (statusMenuOpen) {
      // استفاده از setTimeout برای جلوگیری از بسته شدن فوری
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [statusMenuOpen]);

  const fetchUserStatuses = async () => {
    try {
      const role = session?.user?.role || "EMPLOYEE";
      const res = await fetch(`/api/user-statuses?role=${role}&isActive=true`);
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
        } else if (data.status) {
          setCurrentStatus(data.status);
        }
      }
    } catch (err) {
      console.error("Error fetching current status:", err);
    }
  };

  const handleStatusChange = async (status: UserStatus | null) => {
    console.log("AdminHeader: handleStatusChange called with:", status);
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

      const responseData = await res.json();
      console.log("AdminHeader: Update response:", res.status, responseData);

      if (res.ok) {
        setCurrentStatus(status);
        setStatusMenuOpen(false);
        await update();
        toast.success(status ? `استتوس به "${status.name}" تغییر کرد` : "استتوس حذف شد");
      } else {
        toast.error(responseData.error || "خطا در تغییر استتوس");
      }
    } catch (err) {
      console.error("AdminHeader: Error in handleStatusChange:", err);
      toast.error("خطا در تغییر استتوس");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 lg:right-64 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* لوگو */}
        <Link href="/" className="flex items-center space-x-2 space-x-reverse">
          <div className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-lg">
            {logoUrl && logoUrl !== "/logo.png" && logoUrl.startsWith("/") ? (
              <Image
                src={logoUrl}
                alt="لوگو"
                fill
                sizes="40px"
                className="object-contain p-1"
                onError={() => {
                  setLogoUrl("");
                }}
              />
            ) : (
              <span className="text-white font-bold text-lg">ف</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
            سیستم فیدبک
          </h1>
        </Link>
      </div>

      <div className="flex items-center space-x-1 space-x-reverse">
        {/* آیکون نوتیفیکیشن */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="اعلانات"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* Dropdown نوتیفیکیشن‌ها */}
          {notificationsOpen && (
            <>
              {/* Backdrop برای بستن با کلیک بیرون */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              ></div>

              {/* Dropdown */}
              <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                    اعلانات
                  </h2>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        همه خوانده شد
                      </button>
                    )}
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2">
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${
                            notification.isRead
                              ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-0.5 truncate">
                                {notification.title}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">
                                {notification.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatPersianDate(
                                    new Date(notification.createdAt)
                                  )}
                                </span>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                      اعلانی وجود ندارد
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {session?.user?.role === "ADMIN" && (
          <>
            <Link
              href="/feedback/new"
              className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="ثبت فیدبک جدید"
            >
              <Plus size={20} />
            </Link>
            <Link
              href="/feedback/with-chat"
              className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="فیدبک‌های دارای چت"
            >
              <MessageCircle size={20} />
              {hasUnreadMessages && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/trash"
              className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="سطل آشغال"
            >
              <Trash2 size={20} />
              {hasTrashItems && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="تنظیمات"
            >
              <Settings size={20} />
            </Link>
          </>
        )}

        {/* آیکون پروفایل با Dropdown وضعیت */}
        {session?.user && (
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              disabled={statusLoading}
              className="flex items-center gap-2 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="پروفایل و وضعیت"
            >
              <User size={20} />
              {currentStatus && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                ></span>
              )}
              <ChevronDown size={16} className={statusMenuOpen ? "rotate-180" : ""} />
            </button>

            {/* Status Dropdown */}
            {statusMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session.user.role === "ADMIN"
                          ? "مدیرعامل"
                          : session.user.role === "MANAGER"
                          ? "مدیر"
                          : "کارمند"}
                      </p>
                    </div>
                  </div>
                </div>

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
                    router.push("/users");
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
        )}
      </div>
    </header>
  );
}

