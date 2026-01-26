import Link from "next/link";
import { format } from "date-fns";
import { MoreVertical, Star, Clock, User, Building2, Calendar } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import MobileFeedbackCard from "./MobileFeedbackCard";
import { formatPersianDate, getTimeAgo } from "@/lib/date-utils";

interface FeedbackTableViewProps {
  feedbacks: any[];
  selectedFeedbacks: string[];
  onSelectFeedback: (id: string) => void;
  onSelectAll: () => void;
  onOpenActions: (feedback: any) => void;
}

export default function FeedbackTableView({
  feedbacks,
  selectedFeedbacks,
  onSelectFeedback,
  onSelectAll,
  onOpenActions,
}: FeedbackTableViewProps) {
  const allSelected = feedbacks.length > 0 && selectedFeedbacks.length === feedbacks.length;
  const someSelected = selectedFeedbacks.length > 0 && !allSelected;

  return (
    <>
      {/* Mobile View - Card List */}
      <div className="block md:hidden">
        {feedbacks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              هیچ فیدبکی یافت نشد
            </p>
          </div>
        ) : (
          <>
            {/* Select All for Mobile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onSelectAll}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {allSelected ? "لغو انتخاب همه" : "انتخاب همه"}
                {selectedFeedbacks.length > 0 && ` (${selectedFeedbacks.length})`}
              </span>
            </div>
            {feedbacks.map((feedback) => (
              <MobileFeedbackCard
                key={feedback.id}
                feedback={feedback}
                isSelected={selectedFeedbacks.includes(feedback.id)}
                onSelect={() => onSelectFeedback(feedback.id)}
                onOpenActions={() => onOpenActions(feedback)}
              />
            ))}
          </>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="w-12 px-4 py-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                عنوان
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                بخش
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                وضعیت
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                اولویت
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                ارسال‌کننده
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                تاریخ
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                امتیاز
              </th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    هیچ فیدبکی یافت نشد
                  </p>
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr
                  key={feedback.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedFeedbacks.includes(feedback.id)
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedFeedbacks.includes(feedback.id)}
                        onChange={() => onSelectFeedback(feedback.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/feedback/${feedback.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {feedback.title}
                    </Link>
                    {feedback.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {feedback.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 size={14} />
                      <span>
                        {feedback.departments?.name || "نامشخص"}
                        {feedback.departments?.manager && ` (${feedback.departments.manager.name})`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={feedback.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={feedback.priority} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {feedback.users?.avatar ? (
                        <img
                          src={feedback.users.avatar}
                          alt={feedback.users.name || ""}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <User size={14} className="text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feedback.users?.name || "ناشناس"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={12} />
                      <span>{formatPersianDate(feedback.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <Clock size={12} />
                      <span>{getTimeAgo(feedback.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {feedback.rating ? (
                      <div className="flex items-center gap-1">
                        <Star
                          size={14}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {feedback.rating}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        بدون امتیاز
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onOpenActions(feedback)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
