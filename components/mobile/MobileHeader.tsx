"use client";

import { useRouter } from "next/navigation";
import { RefObject } from "react";
import { ArrowRight, Menu, X, Bell, Settings } from "lucide-react";
import { UserStatus } from "@/lib/hooks/useStatusChange";
import { Notification } from "@/lib/hooks/useNotifications";
import MobileStatusDropdown from "./MobileStatusDropdown";
import MobileNotificationSheet from "./MobileNotificationSheet";

interface MobileHeaderProps {
  title: string;
  role: "EMPLOYEE" | "MANAGER";
  shouldShowBack: boolean;
  homePath: string;
  backHref?: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsOpen: boolean;
  notificationsRef: RefObject<HTMLDivElement | null>;
  onNotificationsToggle: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  // Status
  currentStatus: UserStatus | null;
  userStatuses: UserStatus[];
  statusMenuOpen: boolean;
  statusLoading: boolean;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  onStatusMenuToggle: () => void;
  onStatusChange: (status: UserStatus | null) => void;
}

export default function MobileHeader({
  title,
  role,
  shouldShowBack,
  homePath,
  backHref,
  isMenuOpen,
  onMenuToggle,
  notifications,
  unreadCount,
  notificationsOpen,
  notificationsRef,
  onNotificationsToggle,
  onMarkAllAsRead,
  onNotificationClick,
  currentStatus,
  userStatuses,
  statusMenuOpen,
  statusLoading,
  statusMenuRef,
  onStatusMenuToggle,
  onStatusChange,
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.push(homePath);
    }
  };

  return (
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
            onClick={onMenuToggle}
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
          {/* Notification Icon */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={onNotificationsToggle}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="اعلانات"
            >
              <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notification Sheet */}
            {notificationsOpen && (
              <MobileNotificationSheet
                notifications={notifications}
                unreadCount={unreadCount}
                onClose={onNotificationsToggle}
                onMarkAllAsRead={onMarkAllAsRead}
                onNotificationClick={onNotificationClick}
              />
            )}
          </div>

          <button
            onClick={() => router.push("/mobile/settings")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="تنظیمات"
          >
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Status Dropdown */}
          <MobileStatusDropdown
            currentStatus={currentStatus}
            userStatuses={userStatuses}
            statusMenuOpen={statusMenuOpen}
            statusLoading={statusLoading}
            statusMenuRef={statusMenuRef}
            onStatusMenuToggle={onStatusMenuToggle}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>
    </header>
  );
}
