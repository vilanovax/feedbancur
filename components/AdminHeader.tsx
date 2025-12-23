"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useStatusChange } from "@/lib/hooks/useStatusChange";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
  HeaderLogo,
  HeaderNotificationDropdown,
  HeaderAdminActions,
  HeaderStatusDropdown,
} from "./admin";

export default function AppHeader() {
  const { data: session } = useSession();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [hasTrashItems, setHasTrashItems] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // استفاده از hooks مشترک
  const {
    userStatuses,
    currentStatus,
    statusMenuOpen,
    statusLoading,
    statusMenuRef,
    setStatusMenuOpen,
    handleStatusChange,
  } = useStatusChange();

  const {
    notifications,
    unreadCount,
    notificationsOpen,
    notificationsRef,
    setNotificationsOpen,
    markAllAsRead,
    handleNotificationClick,
  } = useNotifications();

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
        <HeaderLogo
          logoUrl={logoUrl}
          onLogoError={() => setLogoUrl("")}
        />
      </div>

      <div className="flex items-center space-x-1 space-x-reverse">
        {/* آیکون نوتیفیکیشن */}
        <HeaderNotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          notificationsOpen={notificationsOpen}
          notificationsRef={notificationsRef}
          onToggle={() => setNotificationsOpen(!notificationsOpen)}
          onClose={() => setNotificationsOpen(false)}
          onMarkAllAsRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
        />

        {session?.user?.role === "ADMIN" && (
          <HeaderAdminActions
            hasTrashItems={hasTrashItems}
            hasUnreadMessages={hasUnreadMessages}
          />
        )}

        {/* آیکون پروفایل با Dropdown وضعیت */}
        {session?.user && (
          <HeaderStatusDropdown
            session={session}
            currentStatus={currentStatus}
            userStatuses={userStatuses}
            statusMenuOpen={statusMenuOpen}
            statusLoading={statusLoading}
            statusMenuRef={statusMenuRef}
            onToggle={() => setStatusMenuOpen(!statusMenuOpen)}
            onStatusChange={handleStatusChange}
            onClose={() => setStatusMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}
