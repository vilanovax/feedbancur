"use client";

import { useState, useRef } from "react";
import { X, Upload, FileIcon as FileIconLucide, AlertCircle } from "lucide-react";
import TagInput from "./TagInput";
import FileIcon from "./FileIcon";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | null;
  folderId?: string | null;
  suggestedTags?: string[];
  onUploadComplete?: (files: any[]) => void;
}

interface SelectedFile {
  file: File;
  preview?: string;
  error?: string;
}

/**
 * مودال آپلود فایل با drag-drop و تگ‌گذاری
 */
export default function UploadModal({
  isOpen,
  onClose,
  projectId,
  folderId,
  suggestedTags = [],
  onUploadComplete,
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: SelectedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // پیش‌نمایش برای تصاویر
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      newFiles.push({ file, preview });
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      // آزادسازی URL برای تصاویر
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("لطفاً حداقل یک فایل انتخاب کنید");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();

      // اضافه کردن فایل‌ها
      selectedFiles.forEach(({ file }) => {
        formData.append("files", file);
      });

      // اضافه کردن تگ‌ها
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags));
      }

      // اضافه کردن folderId
      if (folderId) {
        formData.append("folderId", folderId);
      }

      // اضافه کردن projectId
      if (projectId) {
        formData.append("projectId", projectId);
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطا در آپلود فایل‌ها");
      }

      // موفقیت
      if (onUploadComplete) {
        onUploadComplete(data.files);
      }

      // بستن مودال و پاکسازی
      handleClose();
    } catch (err: any) {
      setError(err.message || "خطا در آپلود فایل‌ها");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // پاکسازی
    selectedFiles.forEach(({ preview }) => {
      if (preview) URL.revokeObjectURL(preview);
    });
    setSelectedFiles([]);
    setTags([]);
    setError(null);
    setUploadProgress({});
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            آپلود فایل
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag-drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
          >
            <Upload
              size={48}
              className="mx-auto mb-4 text-gray-400"
            />
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              فایل‌ها را اینجا رها کنید یا کلیک کنید
            </p>
            <p className="text-sm text-gray-500">
              حداکثر حجم: 50 مگابایت
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* لیست فایل‌های انتخاب شده */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                فایل‌های انتخاب شده ({selectedFiles.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                        <FileIcon mimeType={item.file.type} size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* تگ‌گذاری */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تگ‌ها (اختیاری)
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={suggestedTags}
              placeholder="افزودن تگ..."
            />
          </div>

          {/* خطا */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال آپلود...</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>آپلود {selectedFiles.length > 0 && `(${selectedFiles.length})`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
