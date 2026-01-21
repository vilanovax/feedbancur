"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Trash2,
  Search,
  AlertCircle,
} from "lucide-react";
import FileIcon from "@/components/files/FileIcon";
import FilePreviewModal from "@/components/files/FilePreviewModal";

/**
 * صفحه سطل زباله - فایل‌های حذف شده (فقط ادمین)
 */
export default function TrashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch deleted files
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchDeletedFiles();
    }
  }, [status, session]);

  const fetchDeletedFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files/trash");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching deleted files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileId: string, fileName: string) => {
    if (!confirm(`آیا از بازیابی "${fileName}" اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/files/trash/${fileId}/restore`, {
        method: "POST",
      });

      if (res.ok) {
        alert("فایل با موفقیت بازیابی شد");
        fetchDeletedFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در بازیابی فایل");
      }
    } catch (error) {
      console.error("Error restoring file:", error);
      alert("خطا در بازیابی فایل");
    }
  };

  const handlePermanentDelete = async (fileId: string, fileName: string) => {
    if (
      !confirm(
        `آیا از حذف دائمی "${fileName}" اطمینان دارید؟\n\nاین عملیات قابل بازگشت نیست!`
      )
    )
      return;

    try {
      const res = await fetch(`/api/files/trash/${fileId}/permanent`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("فایل به صورت دائمی حذف شد");
        fetchDeletedFiles();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف دائمی فایل");
      }
    } catch (error) {
      console.error("Error permanently deleting file:", error);
      alert("خطا در حذف دائمی فایل");
    }
  };

  const handleDownload = async (file: any) => {
    window.open(file.url, "_blank");
  };

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

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => router.push("/files")}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                <ArrowRight size={18} />
                بازگشت به فایل‌ها
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                سطل زباله
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                فایل‌های حذف شده
              </p>
            </div>
            <button
              onClick={fetchDeletedFiles}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={18} />
              <span>بروزرسانی</span>
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle
              size={20}
              className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
            />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                توجه
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                فایل‌های موجود در سطل زباله را می‌توانید بازیابی کنید یا به
                صورت دائمی حذف نمایید. حذف دائمی قابل بازگشت نیست.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در فایل‌های حذف شده..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* File List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? "فایل حذف شده‌ای یافت نشد"
                    : "سطل زباله خالی است"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        نام فایل
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        حجم
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        آپلودکننده
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        تاریخ حذف
                      </th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <FileIcon mimeType={file.mimeType} size={20} />
                            <button
                              onClick={() => setPreviewFile(file)}
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
                          {formatDate(file.deletedAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(file.id, file.name)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="بازیابی"
                            >
                              <RotateCcw size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handlePermanentDelete(file.id, file.name)
                              }
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف دائمی"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onDownload={handleDownload}
      />
    </div>
  );
}
