"use client";

import { ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Bell,
  Trophy,
  Users,
  ClipboardList,
  Newspaper,
} from "lucide-react";
import { useStatusChange } from "@/lib/hooks/useStatusChange";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
  MobileHeader,
  MobileSideMenu,
  MobileBottomNav,
} from "./mobile";

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
  backHref,
}: MobileLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);
  const [hasAssignedTasks, setHasAssignedTasks] = useState(false);

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

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  // تشخیص صفحه اصلی
  const homePath = useMemo(
    () => (role === "EMPLOYEE" ? "/mobile/employee" : "/mobile/manager"),
    [role]
  );
  const isHomePage = pathname === homePath;

  // نمایش دکمه بازگشت اگر در صفحه اصلی نیستیم یا به صورت صریح درخواست شده باشد
  const shouldShowBack =
    showBackButton !== undefined ? showBackButton : !isHomePage;

  // بررسی اعلان‌های جدید
  useEffect(() => {
    const checkNewAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const announcements = await res.json();
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);

          const newAnnouncements = announcements.filter(
            (announcement: { createdAt: string; isActive: boolean }) => {
              const announcementDate = new Date(announcement.createdAt);
              return announcementDate > oneDayAgo && announcement.isActive;
            }
          );

          setHasNewAnnouncements(newAnnouncements.length > 0);
        }
      } catch (error) {
        console.error("Error checking new announcements:", error);
      }
    };

    if (session) {
      checkNewAnnouncements();
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
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 30000);
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
          const activeTasks = tasks.filter(
            (task: { status: string }) =>
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
      const interval = setInterval(checkAssignedTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [session, role]);

  const navItems = useMemo(
    () => [
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
        href:
          role === "MANAGER"
            ? "/mobile/manager/assessments"
            : "/mobile/employee/assessments",
        icon: ClipboardList,
      },
      {
        name: "اعلانات",
        href: "/mobile/announcements",
        icon: Bell,
      },
      {
        name: "اطلاع‌رسانی‌ها",
        href: "/mobile/updates",
        icon: Newspaper,
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
        href:
          role === "MANAGER"
            ? "/mobile/manager/team-status"
            : "/mobile/employee/team-status",
        icon: Users,
      },
    ],
    [role]
  );

  // آیتم‌های منوی پایین
  const bottomNavItems = useMemo(
    () => [
      navItems[0], // داشبورد
      role === "MANAGER"
        ? navItems.find((item) => item.href === "/mobile/manager/tasks") || {
            name: "تسک‌ها",
            href: "/mobile/manager/tasks",
            icon: CheckSquare,
          }
        : navItems[1], // ثبت فیدبک (برای کارمند)
      navItems[2], // فیدبک‌های من
      {
        name: "اعلانات",
        href: "/mobile/announcements",
        icon: Bell,
      },
    ],
    [navItems, role]
  );

  const handleStatusMenuToggle = useCallback(() => {
    setStatusMenuOpen(!statusMenuOpen);
  }, [statusMenuOpen, setStatusMenuOpen]);

  const handleNotificationsToggle = useCallback(() => {
    setNotificationsOpen(!notificationsOpen);
  }, [notificationsOpen, setNotificationsOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <MobileHeader
        title={title || (role === "EMPLOYEE" ? "پنل کارمند" : "پنل مدیر")}
        role={role}
        shouldShowBack={shouldShowBack}
        homePath={homePath}
        backHref={backHref}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        notifications={notifications}
        unreadCount={unreadCount}
        notificationsOpen={notificationsOpen}
        notificationsRef={notificationsRef}
        onNotificationsToggle={handleNotificationsToggle}
        onMarkAllAsRead={markAllAsRead}
        onNotificationClick={handleNotificationClick}
        currentStatus={currentStatus}
        userStatuses={userStatuses}
        statusMenuOpen={statusMenuOpen}
        statusLoading={statusLoading}
        statusMenuRef={statusMenuRef}
        onStatusMenuToggle={handleStatusMenuToggle}
        onStatusChange={handleStatusChange}
      />

      {/* Mobile Side Menu */}
      <MobileSideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        session={session}
        role={role}
        navItems={navItems}
        currentStatus={currentStatus}
        userStatuses={userStatuses}
        statusLoading={statusLoading}
        onStatusChange={handleStatusChange}
        isActive={isActive}
      />

      {/* Main Content */}
      <main className="px-4 py-4">{children}</main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        items={bottomNavItems}
        isActive={isActive}
        hasNewAnnouncements={hasNewAnnouncements}
        hasAssignedTasks={hasAssignedTasks}
        role={role}
      />
    </div>
  );
}
