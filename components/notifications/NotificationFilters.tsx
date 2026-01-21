"use client";

import { Bell, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export type NotificationFilter = "all" | "unread" | "important" | "read";

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  counts: {
    all: number;
    unread: number;
    important: number;
    read: number;
  };
}

export default function NotificationFilters({
  activeFilter,
  onFilterChange,
  counts,
}: NotificationFiltersProps) {
  const filters: {
    id: NotificationFilter;
    label: string;
    icon: typeof Bell;
    color: string;
  }[] = [
    {
      id: "all",
      label: "همه",
      icon: Bell,
      color: "blue",
    },
    {
      id: "unread",
      label: "خوانده نشده",
      icon: AlertCircle,
      color: "orange",
    },
    {
      id: "important",
      label: "مهم",
      icon: AlertCircle,
      color: "red",
    },
    {
      id: "read",
      label: "خوانده شده",
      icon: CheckCircle2,
      color: "green",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        const count = counts[filter.id];

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200 touch-manipulation
              ${
                isActive
                  ? filter.color === "blue"
                    ? "bg-blue-600 text-white shadow-md"
                    : filter.color === "orange"
                    ? "bg-orange-600 text-white shadow-md"
                    : filter.color === "red"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-green-600 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{filter.label}</span>
            {count > 0 && (
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] text-center
                  ${
                    isActive
                      ? "bg-white/20"
                      : filter.color === "blue"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : filter.color === "orange"
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      : filter.color === "red"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
