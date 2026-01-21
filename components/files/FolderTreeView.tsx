"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, Folder, FolderOpen } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children?: Folder[];
  _count?: {
    files: number;
    children: number;
  };
}

interface FolderTreeViewProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  className?: string;
}

/**
 * نمایش درخت پوشه‌ها با قابلیت باز/بسته شدن
 */
export default function FolderTreeView({
  folders,
  currentFolderId,
  onFolderSelect,
  className = "",
}: FolderTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ساخت درخت از لیست تخت
  const buildTree = (items: Folder[], parentId: string | null = null): Folder[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const tree = buildTree(folders);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderClick = (folderId: string) => {
    onFolderSelect(folderId);
    // خودکار باز کردن پوشه هنگام انتخاب
    setExpandedIds((prev) => new Set(prev).add(folderId));
  };

  return (
    <div className={`${className}`}>
      {/* Root Folder */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          currentFolderId === null
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <Folder size={18} />
        <span>همه فایل‌ها</span>
      </button>

      {/* Folder Tree */}
      <div className="mt-2 space-y-1">
        {tree.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            currentFolderId={currentFolderId}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onFolderClick={handleFolderClick}
            level={0}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          پوشه‌ای وجود ندارد
        </div>
      )}
    </div>
  );
}

/**
 * کامپوننت بازگشتی برای نمایش هر پوشه
 */
function FolderNode({
  folder,
  currentFolderId,
  expandedIds,
  onToggleExpand,
  onFolderClick,
  level,
}: {
  folder: Folder;
  currentFolderId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (folderId: string, e: React.MouseEvent) => void;
  onFolderClick: (folderId: string) => void;
  level: number;
}) {
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = currentFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onFolderClick(folder.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          isSelected
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        style={{ paddingRight: `${(level + 1) * 12 + 12}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={(e) => onToggleExpand(folder.id, e)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen size={18} />
        ) : (
          <Folder size={18} />
        )}

        {/* Folder Name */}
        <span className="flex-1 text-right truncate">{folder.name}</span>

        {/* File Count Badge */}
        {folder._count && folder._count.files > 0 && (
          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {folder._count.files}
          </span>
        )}
      </button>

      {/* Children Folders */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              currentFolderId={currentFolderId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onFolderClick={onFolderClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
