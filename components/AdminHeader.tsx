"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Settings, Trash2, MessageCircle, Bell, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { formatPersianDate } from "@/lib/date-utils";

export default function AppHeader() {
  const { data: session } = useSession();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [hasTrashItems, setHasTrashItems] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

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

          {/* باتن شیت نوتیفیکیشن‌ها */}
          {notificationsOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setNotificationsOpen(false)}
              ></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    اعلانات
                  </h2>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        همه را خوانده شده علامت بزن
                      </button>
                    )}
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <X size={20} />
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
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notification.isRead
                              ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                              : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                {notification.content}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatPersianDate(
                                    new Date(notification.createdAt)
                                  )}
                                </span>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      اعلانی وجود ندارد
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {session?.user?.role === "ADMIN" && (
          <>
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
      </div>
    </header>
  );
}

