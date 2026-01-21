"use client";

import { X, Download, ExternalLink } from "lucide-react";
import FileIcon from "./FileIcon";

interface File {
  id: string;
  name: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedById: string;
  createdAt: string;
  downloadCount: number;
  tags: string[];
  users: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onDownload?: (file: File) => void;
}

/**
 * مودال پیش‌نمایش فایل
 */
export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
}: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(file);
    } else {
      // دانلود مستقیم
      window.open(file.url, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileIcon mimeType={file.mimeType} size={24} />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                {file.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)} • {formatDate(file.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadClick}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="دانلود"
            >
              <Download size={20} />
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="باز کردن در تب جدید"
            >
              <ExternalLink size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Preview */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          {/* تصاویر */}
          {isImage && (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}

          {/* PDF */}
          {isPdf && (
            <iframe
              src={file.url}
              className="w-full h-full min-h-[600px] rounded-lg"
              title={file.name}
            />
          )}

          {/* ویدیو */}
          {isVideo && (
            <div className="flex items-center justify-center min-h-full">
              <video
                controls
                className="max-w-full max-h-full rounded-lg"
                src={file.url}
              >
                مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
              </video>
            </div>
          )}

          {/* صوت */}
          {isAudio && (
            <div className="flex items-center justify-center min-h-full">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <div className="w-64 h-64 mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <FileIcon mimeType={file.mimeType} size={80} />
                </div>
                <audio controls className="w-full" src={file.url}>
                  مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                </audio>
              </div>
            </div>
          )}

          {/* سایر فایل‌ها */}
          {!isImage && !isPdf && !isVideo && !isAudio && (
            <div className="flex flex-col items-center justify-center min-h-full">
              <div className="w-32 h-32 mb-4 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <FileIcon mimeType={file.mimeType} size={64} />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                پیش‌نمایش برای این نوع فایل در دسترس نیست
              </p>
              <button
                onClick={handleDownloadClick}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Download size={18} />
                دانلود فایل
              </button>
            </div>
          )}
        </div>

        {/* Footer - File Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* آپلودکننده */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                آپلود شده توسط
              </p>
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
            </div>

            {/* تعداد دانلود */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                تعداد دانلود
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {file.downloadCount} بار
              </p>
            </div>

            {/* نوع فایل */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                نوع فایل
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {file.mimeType}
              </p>
            </div>
          </div>

          {/* تگ‌ها */}
          {file.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                تگ‌ها
              </p>
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
