"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  MessageSquare,
  CheckCircle,
  Edit,
  Megaphone,
  BarChart,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fa } from "date-fns/locale";
import Link from "next/link";

interface ActivityItem {
  id: string;
  type: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  message: string;
  timestamp: string;
  icon: string;
  link?: string;
}

export default function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // بروزرسانی هر 30 ثانیه
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/dashboard/recent-activity?limit=10");
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "MessageSquare":
        return <MessageSquare size={16} />;
      case "CheckCircle":
        return <CheckCircle size={16} />;
      case "Edit":
        return <Edit size={16} />;
      case "Megaphone":
        return <Megaphone size={16} />;
      case "BarChart":
        return <BarChart size={16} />;
      case "UserPlus":
        return <UserPlus size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "feedback_created":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      case "feedback_completed":
        return "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400";
      case "feedback_updated":
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400";
      case "announcement_published":
        return "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400";
      case "poll_created":
        return "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
      case "user_registered":
        return "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: fa,
      });
    } catch {
      return "نامشخص";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Activity className="text-purple-600 dark:text-purple-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            فعالیت‌های اخیر
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            آخرین رویدادهای سیستم
          </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity size={48} className="mx-auto mb-2 opacity-50" />
            <p>فعالیتی یافت نشد</p>
          </div>
        ) : (
          activities.map((activity) => {
            const content = (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${getIconColor(activity.type)}`}>
                  {getIcon(activity.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {activity.user.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.name || ""}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {activity.user.name?.charAt(0).toUpperCase() || "؟"}
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {activity.message}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Link Arrow (if has link) */}
                {activity.link && (
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );

            // اگر لینک داشت، قابل کلیک کن
            if (activity.link) {
              return (
                <Link key={activity.id} href={activity.link}>
                  {content}
                </Link>
              );
            }

            return <div key={activity.id}>{content}</div>;
          })
        )}
      </div>

      {/* View All Link */}
      {!loading && activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/feedback"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
          >
            مشاهده همه فعالیت‌ها
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
