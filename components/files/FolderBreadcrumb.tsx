import { ChevronLeft, Home } from "lucide-react";

interface Folder {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  folders: Folder[];
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

/**
 * نمایش مسیر پوشه‌ها (Breadcrumb)
 */
export default function FolderBreadcrumb({
  folders,
  onNavigate,
  className = "",
}: FolderBreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
      {/* خانه / Root */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        title="بازگشت به ریشه"
      >
        <Home size={16} />
        <span>خانه</span>
      </button>

      {/* پوشه‌ها */}
      {folders.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronLeft
            size={16}
            className="text-gray-400 dark:text-gray-500"
          />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              index === folders.length - 1
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
