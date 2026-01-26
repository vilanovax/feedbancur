import { memo } from "react";
import { AlertTriangle, Circle } from "lucide-react";

interface PriorityBadgeProps {
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null;
  size?: "sm" | "md";
}

const priorityConfig = {
  LOW: {
    label: "کم",
    className: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  },
  MEDIUM: {
    label: "متوسط",
    className: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  },
  HIGH: {
    label: "بالا",
    className: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700",
  },
  URGENT: {
    label: "فوری",
    className: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
  },
};

const PriorityBadge = memo(function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  if (!priority) return null;

  const config = priorityConfig[priority];
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1 ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      } rounded-full border font-medium ${config.className}`}
    >
      {priority === "URGENT" || priority === "HIGH" ? (
        <AlertTriangle size={iconSize} />
      ) : (
        <Circle size={iconSize} fill="currentColor" />
      )}
      {config.label}
    </span>
  );
});

export default PriorityBadge;
