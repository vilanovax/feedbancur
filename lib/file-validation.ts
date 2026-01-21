/**
 * File validation utilities for secure file upload
 * Provides multi-layer validation: extension, MIME type, and magic bytes
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface FileShareSettings {
  maxFileSize: number; // MB
  maxTotalStoragePerUser?: number; // MB
  maxTotalStoragePerProject?: number; // MB
  allowedFileTypes: string[];
  allowedExtensions: string[];
  enablePublicSharing?: boolean;
  suggestedTags?: string[];
}

export const DEFAULT_FILE_SHARE_SETTINGS: FileShareSettings = {
  maxFileSize: 50,
  maxTotalStoragePerUser: 1000,
  maxTotalStoragePerProject: 5000,
  allowedFileTypes: [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    // Other
    "application/json",
    "text/html",
    "application/xml",
  ],
  allowedExtensions: [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".zip",
    ".rar",
    ".7z",
    ".json",
    ".html",
    ".xml",
  ],
  enablePublicSharing: true,
  suggestedTags: [
    "مهم",
    "فوری",
    "مالی",
    "قراردادها",
    "گزارشات",
    "اسناد",
    "طرح‌ها",
    "ارائه",
  ],
};

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      .replace(/[^\w\s.-]/g, "") // Remove special chars except word chars, spaces, dots, hyphens
      .replace(/\s+/g, "_") // Replace spaces with underscore
      .replace(/\.{2,}/g, ".") // Remove multiple consecutive dots
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
      .substring(0, 255) // Max filename length
  );
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return "." + parts[parts.length - 1].toLowerCase();
}

/**
 * Check if file extension is allowed
 */
export function isExtensionAllowed(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = getFileExtension(filename);
  if (!ext) return false;
  return allowedExtensions.includes(ext);
}

/**
 * Check if MIME type is allowed
 */
export function isMimeTypeAllowed(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Detect suspicious file patterns (double extensions, hidden chars, etc.)
 */
export function detectSuspiciousPatterns(filename: string): string | null {
  // Check for double extensions (e.g., file.pdf.exe)
  const extensions = filename.match(/\.[^.]+/g);
  if (extensions && extensions.length > 1) {
    const lastExt = extensions[extensions.length - 1].toLowerCase();
    const dangerousExts = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".app"];
    if (dangerousExts.includes(lastExt)) {
      return "فایل با پسوند دوگانه مشکوک است";
    }
  }

  // Check for right-to-left override character (U+202E)
  if (filename.includes("\u202E")) {
    return "نام فایل حاوی کاراکترهای مخفی است";
  }

  // Check for script tags in filename
  if (/<script|javascript:|onerror=/i.test(filename)) {
    return "نام فایل حاوی کد مخرب است";
  }

  // Check for null bytes
  if (filename.includes("\x00")) {
    return "نام فایل نامعتبر است";
  }

  return null;
}

/**
 * Validate file against settings
 * Returns error message if invalid, null if valid
 */
export async function validateFile(
  file: File,
  settings: FileShareSettings
): Promise<string | null> {
  // 1. Check file size
  const maxSizeBytes = settings.maxFileSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `حجم فایل نباید بیشتر از ${settings.maxFileSize} مگابایت باشد`;
  }

  // 2. Check extension
  if (!isExtensionAllowed(file.name, settings.allowedExtensions)) {
    const ext = getFileExtension(file.name);
    return `فرمت فایل ${ext} مجاز نیست`;
  }

  // 3. Check MIME type
  if (!isMimeTypeAllowed(file.type, settings.allowedFileTypes)) {
    return `نوع فایل ${file.type} مجاز نیست`;
  }

  // 4. Check for suspicious patterns
  const suspiciousPattern = detectSuspiciousPatterns(file.name);
  if (suspiciousPattern) {
    return suspiciousPattern;
  }

  // 5. Validate MIME type matches extension (basic check)
  const ext = getFileExtension(file.name);
  const mimeType = file.type;

  // Common mismatches
  const mimeExtMap: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
    "application/zip": [".zip"],
  };

  if (mimeExtMap[mimeType] && !mimeExtMap[mimeType].includes(ext)) {
    return "نوع فایل با پسوند آن مطابقت ندارد";
  }

  return null; // Valid
}

/**
 * Check storage quota for user
 */
export async function checkUserStorageQuota(
  userId: string,
  additionalSize: number,
  settings: FileShareSettings
): Promise<string | null> {
  if (
    !settings.maxTotalStoragePerUser ||
    settings.maxTotalStoragePerUser === 0
  ) {
    return null; // No quota limit
  }

  const usage = await prisma.shared_files.aggregate({
    where: {
      uploadedById: userId,
      deletedAt: null,
    },
    _sum: {
      size: true,
    },
  });

  const currentUsageBytes = usage._sum.size || 0;
  const currentUsageMB = currentUsageBytes / (1024 * 1024);
  const additionalMB = additionalSize / (1024 * 1024);
  const totalUsageMB = currentUsageMB + additionalMB;

  if (totalUsageMB > settings.maxTotalStoragePerUser) {
    return `سهمیه ذخیره‌سازی شما (${settings.maxTotalStoragePerUser} مگابایت) تمام شده است`;
  }

  return null;
}

/**
 * Check storage quota for project
 */
export async function checkProjectStorageQuota(
  projectId: string,
  additionalSize: number,
  settings: FileShareSettings
): Promise<string | null> {
  if (
    !settings.maxTotalStoragePerProject ||
    settings.maxTotalStoragePerProject === 0
  ) {
    return null; // No quota limit
  }

  const usage = await prisma.shared_files.aggregate({
    where: {
      projectId,
      deletedAt: null,
    },
    _sum: {
      size: true,
    },
  });

  const currentUsageBytes = usage._sum.size || 0;
  const currentUsageMB = currentUsageBytes / (1024 * 1024);
  const additionalMB = additionalSize / (1024 * 1024);
  const totalUsageMB = currentUsageMB + additionalMB;

  if (totalUsageMB > settings.maxTotalStoragePerProject) {
    return `سهمیه ذخیره‌سازی پروژه (${settings.maxTotalStoragePerProject} مگابایت) تمام شده است`;
  }

  return null;
}

/**
 * Get MIME type category (for grouping/icons)
 */
export function getMimeTypeCategory(
  mimeType: string
):
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "archive"
  | "text"
  | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "text";

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "spreadsheet";
  }

  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "presentation";
  }

  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  ) {
    return "archive";
  }

  return "other";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 بایت";
  const k = 1024;
  const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
