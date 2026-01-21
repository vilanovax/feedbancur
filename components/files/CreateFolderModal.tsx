"use client";

import { useState } from "react";
import { X, Folder, AlertCircle } from "lucide-react";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolderId?: string | null;
  projectId?: string | null;
  onFolderCreated?: (folder: any) => void;
}

/**
 * مودال ایجاد پوشه جدید
 */
export default function CreateFolderModal({
  isOpen,
  onClose,
  parentFolderId,
  projectId,
  onFolderCreated,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = folderName.trim();
    if (!trimmedName) {
      setError("نام پوشه نمی‌تواند خالی باشد");
      return;
    }

    if (trimmedName.length > 100) {
      setError("نام پوشه نباید بیشتر از 100 کاراکتر باشد");
      return;
    }

    // بررسی کاراکترهای غیرمجاز
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError("نام پوشه نمی‌تواند شامل کاراکترهای < > : \" / \\ | ? * باشد");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const body: any = { name: trimmedName };
      if (parentFolderId) body.parentId = parentFolderId;
      if (projectId) body.projectId = projectId;

      const res = await fetch("/api/files/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد پوشه");
      }

      // موفقیت
      if (onFolderCreated) {
        onFolderCreated(data.folder);
      }

      // بستن مودال و پاکسازی
      handleClose();
    } catch (err: any) {
      setError(err.message || "خطا در ایجاد پوشه");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Folder size={24} />
            ایجاد پوشه جدید
          </h2>
          <button
            onClick={handleClose}
            disabled={creating}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="folderName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              نام پوشه
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="مثلاً: اسناد مالی"
              autoFocus
              disabled={creating}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              حداکثر 100 کاراکتر
            </p>
          </div>

          {/* خطا */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={creating || !folderName.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ایجاد...</span>
                </>
              ) : (
                <>
                  <Folder size={18} />
                  <span>ایجاد پوشه</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
