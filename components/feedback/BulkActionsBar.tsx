import { Send, Archive, Trash2, X, CheckCircle, Clock } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onForward: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkComplete: () => void;
  onMarkDeferred: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onForward,
  onArchive,
  onDelete,
  onMarkComplete,
  onMarkDeferred,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-4xl">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 sm:p-4">
        {/* Mobile: Vertical Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Selection Info */}
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 sm:py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedCount} مورد انتخاب شده
            </span>
            <button
              onClick={onClearSelection}
              className="p-1.5 sm:p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-colors touch-manipulation"
              title="لغو انتخاب"
            >
              <X size={16} className="text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* Divider - Hidden on mobile */}
          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

          {/* Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={onForward}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-manipulation"
              title="ارجاع دسته‌جمعی"
            >
              <Send size={16} />
              <span>ارجاع</span>
            </button>

            <button
              onClick={onMarkComplete}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors touch-manipulation"
              title="تکمیل شده"
            >
              <CheckCircle size={16} />
              <span>تکمیل</span>
            </button>

            <button
              onClick={onMarkDeferred}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors touch-manipulation"
              title="موکول"
            >
              <Clock size={16} />
              <span>موکول</span>
            </button>

            <button
              onClick={onArchive}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
              title="آرشیو دسته‌جمعی"
            >
              <Archive size={16} />
              <span className="hidden sm:inline">آرشیو</span>
            </button>

            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
              title="حذف دسته‌جمعی"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">حذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
