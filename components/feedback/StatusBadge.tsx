import { memo } from "react";
import { CheckCircle, Clock, Archive, XCircle, Eye } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  PENDING: {
    label: "در انتظار",
    icon: Clock,
    className: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
  },
  REVIEWED: {
    label: "بررسی شده",
    icon: Eye,
    className: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  },
  COMPLETED: {
    label: "تکمیل شده",
    icon: CheckCircle,
    className: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700",
  },
  DEFERRED: {
    label: "موکول شده",
    icon: Clock,
    className: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700",
  },
  ARCHIVED: {
    label: "بایگانی",
    icon: Archive,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-3 py-1 text-sm gap-1.5",
  lg: "px-4 py-1.5 text-base gap-2",
};

const StatusBadge = memo(function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    icon: XCircle,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600",
  };

  const Icon = config.icon;
  const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;

  return (
    <span
      className={`inline-flex items-center ${sizeClasses[size]} rounded-full border font-medium ${config.className}`}
    >
      <Icon size={iconSize} />
      {config.label}
    </span>
  );
});

export default StatusBadge;
