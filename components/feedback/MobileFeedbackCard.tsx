import Link from "next/link";
import { Star, MoreVertical, User, Calendar, Building2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

interface MobileFeedbackCardProps {
  feedback: any;
  isSelected: boolean;
  onSelect: () => void;
  onOpenActions: () => void;
}

export default function MobileFeedbackCard({
  feedback,
  isSelected,
  onSelect,
  onOpenActions,
}: MobileFeedbackCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 mb-3 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Header with checkbox and actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <Link
            href={`/feedback/${feedback.id}`}
            className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 flex-1"
          >
            {feedback.title}
          </Link>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenActions();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg ml-2"
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <StatusBadge status={feedback.status} size="sm" />
        {feedback.priority && (
          <PriorityBadge priority={feedback.priority} size="sm" />
        )}
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm">
        {/* Department */}
        {feedback.departments && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{feedback.departments.name}</span>
          </div>
        )}

        {/* User */}
        {feedback.users && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{feedback.users.name}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {formatPersianDate(feedback.createdAt)}
            <span className="text-xs mr-1">
              ({getTimeAgo(feedback.createdAt)})
            </span>
          </span>
        </div>

        {/* Rating */}
        {feedback.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {feedback.rating}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
