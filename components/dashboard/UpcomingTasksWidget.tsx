"use client";

import { Clock, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

interface UpcomingTask {
  id: string;
  title: string;
  type: "feedback" | "poll" | "announcement";
  dueDate: Date;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  url: string;
}

interface UpcomingTasksWidgetProps {
  tasks: UpcomingTask[];
  loading?: boolean;
}

const typeLabels = {
  feedback: "فیدبک",
  poll: "نظرسنجی",
  announcement: "اعلان",
};

const typeColors = {
  feedback: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  poll: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  announcement: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
};

const priorityColors = {
  LOW: "text-gray-600 dark:text-gray-400",
  MEDIUM: "text-blue-600 dark:text-blue-400",
  HIGH: "text-orange-600 dark:text-orange-400",
  URGENT: "text-red-600 dark:text-red-400",
};

export default function UpcomingTasksWidget({ tasks, loading = false }: UpcomingTasksWidgetProps) {
  // Calculate days remaining
  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const diff = new Date(dueDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { text: "منقضی شده", color: "text-red-600 dark:text-red-400", urgent: true };
    if (days === 0) return { text: "امروز", color: "text-red-600 dark:text-red-400", urgent: true };
    if (days === 1) return { text: "فردا", color: "text-orange-600 dark:text-orange-400", urgent: true };
    if (days <= 3) return { text: `${days} روز`, color: "text-orange-600 dark:text-orange-400", urgent: true };
    if (days <= 7) return { text: `${days} روز`, color: "text-yellow-600 dark:text-yellow-400", urgent: false };
    return { text: `${days} روز`, color: "text-gray-600 dark:text-gray-400", urgent: false };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-orange-600 dark:text-orange-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            تسک‌های پیش رو
          </h2>
        </div>
        {tasks.length > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {tasks.length} مورد
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Calendar size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            تسک فوری وجود ندارد
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tasks.map((task) => {
            const remaining = getDaysRemaining(task.dueDate);

            return (
              <Link
                key={task.id}
                href={task.url}
                className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[task.type]}`}>
                        {typeLabels[task.type]}
                      </span>
                      {task.priority && (
                        <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {task.title}
                    </h3>
                  </div>
                  {remaining.urgent && (
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mr-2" />
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatPersianDate(task.dueDate)}</span>
                  </div>
                  <div className={`flex items-center gap-1 font-medium ${remaining.color}`}>
                    <Clock size={12} />
                    <span>{remaining.text}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
