import { CheckCircle, Clock, Archive, Send, Layers, AlertCircle } from "lucide-react";

interface QuickFilterChipsProps {
  activeFilter: "all" | "active" | "forwarded" | "archived" | "deferred" | "completed";
  onFilterChange: (filter: "all" | "active" | "forwarded" | "archived" | "deferred" | "completed") => void;
  counts?: {
    all: number;
    pending: number;
    completed: number;
    deferred: number;
    archived: number;
  };
}

export default function QuickFilterChips({
  activeFilter,
  onFilterChange,
  counts,
}: QuickFilterChipsProps) {
  const filters = [
    {
      id: "all" as const,
      label: "همه",
      icon: Layers,
      count: counts?.all,
      className: "text-gray-700 dark:text-gray-300",
      activeClassName: "bg-blue-600 text-white border-blue-600",
    },
    {
      id: "active" as const,
      label: "در انتظار",
      icon: Clock,
      count: counts?.pending,
      className: "text-yellow-700 dark:text-yellow-300",
      activeClassName: "bg-yellow-500 text-white border-yellow-500",
    },
    {
      id: "completed" as const,
      label: "تکمیل شده",
      icon: CheckCircle,
      count: counts?.completed,
      className: "text-green-700 dark:text-green-300",
      activeClassName: "bg-green-500 text-white border-green-500",
    },
    {
      id: "deferred" as const,
      label: "موکول شده",
      icon: AlertCircle,
      count: counts?.deferred,
      className: "text-orange-700 dark:text-orange-300",
      activeClassName: "bg-orange-500 text-white border-orange-500",
    },
    {
      id: "archived" as const,
      label: "بایگانی",
      icon: Archive,
      count: counts?.archived,
      className: "text-gray-600 dark:text-gray-400",
      activeClassName: "bg-gray-500 text-white border-gray-500",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
              isActive
                ? filter.activeClassName
                : `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${filter.className} hover:border-gray-300 dark:hover:border-gray-600`
            }`}
          >
            <Icon size={16} />
            <span className="font-medium">{filter.label}</span>
            {filter.count !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive
                    ? "bg-white/30"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
