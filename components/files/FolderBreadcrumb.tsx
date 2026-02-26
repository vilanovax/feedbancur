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
    <nav className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors"
        title="بازگشت به ریشه"
      >
        <Home size={16} />
        <span>خانه</span>
      </button>
      {folders.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronLeft size={16} className="text-gray-600 shrink-0" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              index === folders.length - 1
                ? "text-blue-400 font-medium bg-blue-500/10"
                : "text-gray-400 hover:text-white hover:bg-gray-700/80"
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
