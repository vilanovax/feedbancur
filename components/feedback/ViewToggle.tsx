import { LayoutGrid, List, Table } from "lucide-react";

interface ViewToggleProps {
  viewMode: "grid" | "list" | "table";
  onViewModeChange: (mode: "grid" | "list" | "table") => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange("grid")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "grid"
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        title="نمای کارتی"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        onClick={() => onViewModeChange("list")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "list"
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        title="نمای لیستی"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => onViewModeChange("table")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "table"
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        title="نمای جدولی"
      >
        <Table size={18} />
      </button>
    </div>
  );
}
