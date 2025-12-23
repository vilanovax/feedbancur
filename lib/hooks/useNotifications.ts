"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  redirectUrl?: string;
  feedbackId?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  notificationsOpen: boolean;
  notificationsRef: React.RefObject<HTMLDivElement>;
  setNotificationsOpen: (open: boolean) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  handleNotificationClick: (notification: Notification) => void;
  refreshNotifications: () => Promise<void>;
}

interface UseNotificationsOptions {
  /** Polling interval in milliseconds (default: 30000) */
  pollingInterval?: number;
  /** Whether to fetch all notifications when modal opens (default: true) */
  fetchAllOnOpen?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { pollingInterval = 30000, fetchAllOnOpen = true } = options;

  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // دریافت تعداد نوتیفیکیشن‌های خوانده نشده
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  // دریافت همه نوتیفیکیشن‌ها
  const fetchAllNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching all notifications:", error);
    }
  }, []);

  // علامت‌گذاری یک نوتیفیکیشن به عنوان خوانده شده
  const markAsRead = useCallback(async (notificationId: string) => {
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
  }, []);

  // علامت‌گذاری همه نوتیفیکیشن‌ها به عنوان خوانده شده
  const markAllAsRead = useCallback(async () => {
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
  }, []);

  // کلیک روی نوتیفیکیشن
  const handleNotificationClick = useCallback((notification: Notification) => {
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
  }, [markAsRead, router]);

  // Polling برای تعداد خوانده نشده
  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [session, fetchUnreadCount, pollingInterval]);

  // دریافت همه نوتیفیکیشن‌ها وقتی مودال باز می‌شود
  useEffect(() => {
    if (notificationsOpen && session?.user && fetchAllOnOpen) {
      fetchAllNotifications();
    }
  }, [notificationsOpen, session, fetchAllNotifications, fetchAllOnOpen]);

  // بستن مودال با کلیک بیرون
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

  return {
    notifications,
    unreadCount,
    notificationsOpen,
    notificationsRef,
    setNotificationsOpen,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    refreshNotifications: fetchAllNotifications,
  };
}
