"use client";

import { memo, RefObject } from "react";
import { Bell, X } from "lucide-react";
import { formatPersianDate } from "@/lib/date-utils";
import { Notification } from "@/lib/hooks/useNotifications";

interface HeaderNotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  notificationsOpen: boolean;
  notificationsRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

function HeaderNotificationDropdown({
  notifications,
  unreadCount,
  notificationsOpen,
  notificationsRef,
  onToggle,
  onClose,
  onMarkAllAsRead,
  onNotificationClick,
}: HeaderNotificationDropdownProps) {
  return (
    <div className="relative" ref={notificationsRef}>
      <button
        onClick={onToggle}
        className="relative flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="اعلانات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {notificationsOpen && (
        <>
          {/* Backdrop برای بستن با کلیک بیرون */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
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
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    همه خوانده شد
                  </button>
                )}
                <button
                  onClick={onClose}
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
                      onClick={() => onNotificationClick(notification)}
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
  );
}

export default memo(HeaderNotificationDropdown);
