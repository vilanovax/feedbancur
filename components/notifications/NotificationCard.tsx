"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  MessageSquare,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

interface NotificationCardProps {
  notification: {
    id: string;
    title: string;
    content?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    isRead: boolean;
    createdAt: string;
    createdBy?: {
      name: string;
    };
    department?: {
      name: string;
    };
    link?: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  showActions = true,
}: NotificationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getNotificationStyle = () => {
    const baseStyles = "relative overflow-hidden transition-all duration-200";

    if (notification.isRead) {
      return `${baseStyles} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`;
    }

    switch (notification.priority) {
      case "HIGH":
        return `${baseStyles} bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-l-4 border-red-500`;
      case "MEDIUM":
        return `${baseStyles} bg-gradient-to-r from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 border-l-4 border-orange-500`;
      case "LOW":
        return `${baseStyles} bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-l-4 border-blue-500`;
      default:
        return `${baseStyles} bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-l-4 border-gray-400`;
    }
  };

  const getIcon = () => {
    const iconClass = "flex-shrink-0";
    const size = 20;

    if (notification.isRead) {
      return <Bell className={`${iconClass} text-gray-400`} size={size} />;
    }

    switch (notification.priority) {
      case "HIGH":
        return <AlertTriangle className={`${iconClass} text-red-500`} size={size} />;
      case "MEDIUM":
        return <AlertCircle className={`${iconClass} text-orange-500`} size={size} />;
      case "LOW":
        return <Info className={`${iconClass} text-blue-500`} size={size} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} size={size} />;
    }
  };

  const getPriorityLabel = () => {
    switch (notification.priority) {
      case "HIGH":
        return "اولویت بالا";
      case "MEDIUM":
        return "اولویت متوسط";
      case "LOW":
        return "اولویت پایین";
      default:
        return null;
    }
  };

  const CardContent = () => (
    <div
      className={`${getNotificationStyle()} rounded-xl shadow-sm hover:shadow-md p-4 sm:p-5 cursor-pointer transform ${
        isHovered && !notification.isRead ? "scale-[1.01]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge جدید */}
      {!notification.isRead && (
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full animate-pulse">
            جدید
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`text-base sm:text-lg font-semibold ${
              notification.isRead
                ? "text-gray-700 dark:text-gray-300"
                : "text-gray-900 dark:text-white"
            } line-clamp-2 flex-1`}>
              {notification.title}
            </h3>
          </div>

          {/* Priority Badge */}
          {getPriorityLabel() && !notification.isRead && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
              notification.priority === "HIGH"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : notification.priority === "MEDIUM"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}>
              {getPriorityLabel()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {notification.content && (
        <p className={`text-sm ${
          notification.isRead
            ? "text-gray-500 dark:text-gray-400"
            : "text-gray-600 dark:text-gray-300"
        } line-clamp-2 mb-3 pr-8`}>
          {notification.content}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pr-8">
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          {notification.createdBy && (
            <span className="flex items-center gap-1">
              <span className="font-medium">{notification.createdBy.name}</span>
            </span>
          )}

          {notification.department && (
            <span className="flex items-center gap-1">
              <span>•</span>
              <span>{notification.department.name}</span>
            </span>
          )}

          <span className="flex items-center gap-1">
            <span>•</span>
            <span>{getTimeAgo(notification.createdAt)}</span>
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                title="علامت به عنوان خوانده شده"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
              title="حذف"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>

            {notification.link && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
