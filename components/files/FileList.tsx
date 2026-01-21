"use client";

import { useState } from "react";
import { Download, MoreVertical, Trash2, Edit2, FolderInput, RefreshCw, Tag as TagIcon } from "lucide-react";
import FileIcon from "./FileIcon";

interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  tags: string[];
  users: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  folders: {
    id: string;
    name: string;
  } | null;
}

interface FileListProps {
  files: File[];
  loading?: boolean;
  onDownload?: (file: File) => void;
  onRename?: (file: File) => void;
  onMove?: (file: File) => void;
  onDelete?: (file: File) => void;
  onReplace?: (file: File) => void;
  onEditTags?: (file: File) => void;
  onPreview?: (file: File) => void;
  viewMode?: "list" | "grid";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
  readOnly?: boolean;
}

/**
 * کامپوننت لیست فایل‌ها با نمای جدول و کارت
 */
export default function FileList({
  files,
  loading = false,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onReplace,
  onEditTags,
  onPreview,
  viewMode = "list",
  sortBy,
  sortOrder = "asc",
  onSort,
  readOnly = false,
}: FileListProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const handleDropdownToggle = (fileId: string) => {
    setOpenDropdownId(openDropdownId === fileId ? null : fileId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenDropdownId(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
          ></div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FileIcon mimeType="" size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">فایلی وجود ندارد</p>
      </div>
    );
  }

  // Grid View
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPreview?.(file)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                <FileIcon mimeType={file.mimeType} size={24} />
              </div>
              {!readOnly && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownToggle(file.id);
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openDropdownId === file.id && (
                    <ActionDropdown
                      file={file}
                      onDownload={() => handleAction(() => onDownload?.(file))}
                      onRename={() => handleAction(() => onRename?.(file))}
                      onMove={() => handleAction(() => onMove?.(file))}
                      onDelete={() => handleAction(() => onDelete?.(file))}
                      onReplace={() => handleAction(() => onReplace?.(file))}
                      onEditTags={() => handleAction(() => onEditTags?.(file))}
                      onClose={() => setOpenDropdownId(null)}
                    />
                  )}
                </div>
              )}
            </div>

            <h3 className="text-sm font-medium text-gray-800 dark:text-white truncate mb-2">
              {file.name}
            </h3>

            <div className="text-xs text-gray-500 space-y-1">
              <div>{formatFileSize(file.size)}</div>
              <div>{file.users.name || "ناشناس"}</div>
              <div>{formatDate(file.createdAt)}</div>
            </div>

            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {file.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {file.tags.length > 2 && (
                  <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    +{file.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // List View (Table)
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <button
                onClick={() => handleSort("name")}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
              >
                نام فایل {getSortIcon("name")}
              </button>
            </th>
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <button
                onClick={() => handleSort("size")}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
              >
                حجم {getSortIcon("size")}
              </button>
            </th>
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              آپلودکننده
            </th>
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <button
                onClick={() => handleSort("createdAt")}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
              >
                تاریخ {getSortIcon("createdAt")}
              </button>
            </th>
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <button
                onClick={() => handleSort("downloadCount")}
                className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
              >
                دانلودها {getSortIcon("downloadCount")}
              </button>
            </th>
            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              تگ‌ها
            </th>
            {!readOnly && (
              <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                عملیات
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <FileIcon mimeType={file.mimeType} size={20} />
                  <button
                    onClick={() => onPreview?.(file)}
                    className="text-sm text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs"
                    title={file.name}
                  >
                    {file.name}
                  </button>
                </div>
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(file.size)}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {file.users.avatar ? (
                    <img
                      src={file.users.avatar}
                      alt={file.users.name || ""}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                      {file.users.name?.charAt(0) || "؟"}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {file.users.name || "ناشناس"}
                  </span>
                </div>
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(file.createdAt)}
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                {file.downloadCount}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {file.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {file.tags.length > 3 && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      +{file.tags.length - 3}
                    </span>
                  )}
                </div>
              </td>
              {!readOnly && (
                <td className="p-3">
                  <div className="relative">
                    <button
                      onClick={() => handleDropdownToggle(file.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openDropdownId === file.id && (
                      <ActionDropdown
                        file={file}
                        onDownload={() => handleAction(() => onDownload?.(file))}
                        onRename={() => handleAction(() => onRename?.(file))}
                        onMove={() => handleAction(() => onMove?.(file))}
                        onDelete={() => handleAction(() => onDelete?.(file))}
                        onReplace={() => handleAction(() => onReplace?.(file))}
                        onEditTags={() => handleAction(() => onEditTags?.(file))}
                        onClose={() => setOpenDropdownId(null)}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * کامپوننت منوی کشویی عملیات فایل
 */
function ActionDropdown({
  file,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onReplace,
  onEditTags,
  onClose,
}: {
  file: File;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onReplace: () => void;
  onEditTags: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      ></div>

      {/* Dropdown Menu */}
      <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
        <button
          onClick={onDownload}
          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Download size={16} />
          دانلود
        </button>
        <button
          onClick={onRename}
          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <Edit2 size={16} />
          تغییر نام
        </button>
        <button
          onClick={onMove}
          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <FolderInput size={16} />
          انتقال
        </button>
        <button
          onClick={onEditTags}
          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <TagIcon size={16} />
          ویرایش تگ‌ها
        </button>
        <button
          onClick={onReplace}
          className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          جایگزینی فایل
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700"></div>
        <button
          onClick={onDelete}
          className="w-full text-right px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
        >
          <Trash2 size={16} />
          حذف
        </button>
      </div>
    </>
  );
}
