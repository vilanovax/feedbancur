"use client";

import { X, Paperclip, Download, FileText, Image as ImageIcon, Building2, User, Calendar } from "lucide-react";

interface AnnouncementModalProps {
  announcement: any;
  onClose: () => void;
}

export default function AnnouncementModal({ announcement, onClose }: AnnouncementModalProps) {
  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image/');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon size={20} className="text-blue-600 dark:text-blue-400" />;
    }
    return <FileText size={20} className="text-gray-600 dark:text-gray-400" />;
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            اولویت بالا
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            اولویت متوسط
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            اولویت کم
          </span>
        );
      default:
        return null;
    }
  };

  const formatPersianDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasAttachments = announcement.attachments && Array.isArray(announcement.attachments) && announcement.attachments.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header با gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-white">
                  {announcement.title}
                </h2>
                {hasAttachments && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                    <Paperclip size={16} />
                    <span>{announcement.attachments.length}</span>
                  </div>
                )}
              </div>
              {getPriorityBadge(announcement.priority)}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              aria-label="بستن"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content با scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* اطلاعات ارسال‌کننده و دریافت‌کننده */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {/* ارسال‌کننده */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ارسال‌کننده</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {announcement.createdBy?.name || "نامشخص"}
                </p>
                {announcement.createdBy?.departmentId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {announcement.createdBy?.department?.name || ""}
                  </p>
                )}
              </div>
            </div>

            {/* دریافت‌کننده */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Building2 size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">دریافت‌کننده</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {announcement.department
                    ? announcement.department.name
                    : "همه واحدها (اعلان عمومی)"
                  }
                </p>
              </div>
            </div>

            {/* تاریخ */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاریخ انتشار</p>
                <p className="font-medium text-gray-800 dark:text-white text-sm">
                  {formatPersianDate(announcement.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* متن اعلان */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">متن اعلان:</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {announcement.content}
              </p>
            </div>
          </div>

          {/* ضمیمه‌ها */}
          {hasAttachments && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <Paperclip size={18} />
                ضمیمه‌ها ({announcement.attachments.length} فایل)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcement.attachments.map((attachment: any, index: number) => (
                  <div
                    key={index}
                    className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {getFileIcon(attachment.name || attachment.url)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 dark:text-white truncate text-sm">
                          {attachment.name || `فایل ${index + 1}`}
                        </p>
                      </div>
                    </div>

                    {isImageFile(attachment.url) ? (
                      <div className="mt-3">
                        <img
                          src={
                            attachment.url.includes("liara.space")
                              ? `/api/image-proxy?url=${encodeURIComponent(attachment.url)}`
                              : attachment.url
                          }
                          alt={attachment.name || "ضمیمه"}
                          className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                          loading="lazy"
                        />
                        <a
                          href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                          download={attachment.name}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
                        >
                          <Download size={16} />
                          <span>دانلود تصویر</span>
                        </a>
                      </div>
                    ) : (
                      <a
                        href={`/api/download?url=${encodeURIComponent(attachment.url)}`}
                        download={attachment.name}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full justify-center"
                      >
                        <Download size={16} />
                        <span>دانلود فایل</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
