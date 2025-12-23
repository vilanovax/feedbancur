"use client";

import { Bell, X } from "lucide-react";
import { formatPersianDate } from "@/lib/date-utils";
import { Notification } from "@/lib/hooks/useNotifications";

interface MobileNotificationSheetProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export default function MobileNotificationSheet({
  notifications,
  unreadCount,
  onClose,
  onMarkAllAsRead,
  onNotificationClick,
}: MobileNotificationSheetProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
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
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium"
              >
                خواندن همه
              </button>
            )}
            <button
              onClick={onClose}
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
                  onClick={() => onNotificationClick(notification)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    notification.isRead
                      ? "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.isRead
                          ? "bg-gray-200 dark:bg-gray-600"
                          : "bg-blue-500"
                      }`}
                    >
                      <Bell
                        className={`w-5 h-5 ${
                          notification.isRead
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-white"
                        }`}
                      />
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
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            جدید
                          </span>
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
  );
}
