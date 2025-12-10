/**
 * Utility functions for handling image URLs
 */

/**
 * تبدیل URL تصویر لیارا به proxy URL
 * این function مشکل CORS را حل می‌کند
 */
export function getImageProxyUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "";
  }

  // اگر URL از لیارا است، از proxy استفاده کن
  if (imageUrl.includes("liara.space")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  // در غیر این صورت، URL اصلی را برگردان
  return imageUrl;
}

/**
 * بررسی اینکه آیا URL تصویر از لیارا است یا نه
 */
export function isLiaraImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return url.includes("liara.space");
}

