/**
 * Utility functions for feedback status tags
 */

// Default status texts
const DEFAULT_STATUS_TEXTS: Record<string, string> = {
  PENDING: "در انتظار",
  REVIEWED: "بررسی شده",
  ARCHIVED: "آرشیو شده",
  DEFERRED: "رسیدگی آینده",
  COMPLETED: "انجام شد",
};

/**
 * Get status text from settings or return default
 */
export function getStatusText(status: string, customTexts?: Record<string, string>): string {
  if (customTexts && customTexts[status]) {
    return customTexts[status];
  }
  return DEFAULT_STATUS_TEXTS[status] || status;
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "REVIEWED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    case "DEFERRED":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Load status texts from localStorage
 * پشتیبانی از هر دو فرمت: array و object
 */
export function loadStatusTextsFromStorage(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("statusTexts");
    if (stored) {
      const parsed = JSON.parse(stored);
      // اگر array است، به object تبدیل کن
      if (Array.isArray(parsed)) {
        return parsed.reduce((acc, item) => {
          acc[item.key] = item.label;
          return acc;
        }, {} as Record<string, string>);
      }
      // اگر object است، همان را برگردان
      return parsed;
    }
  } catch (e) {
    console.error("Error loading status texts from storage:", e);
  }
  return null;
}

/**
 * Save status texts to localStorage
 */
export function saveStatusTextsToStorage(texts: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("statusTexts", JSON.stringify(texts));
    // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
    window.dispatchEvent(new CustomEvent("statusTextsUpdated", { 
      detail: JSON.stringify(texts) 
    }));
  } catch (e) {
    console.error("Error saving status texts to storage:", e);
  }
}

/**
 * Load status texts order from localStorage
 * ترتیب statusTexts را از localStorage برمی‌گرداند
 */
export function loadStatusTextsOrderFromStorage(): Array<{ key: string; label: string }> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("statusTexts");
    if (stored) {
      const parsed = JSON.parse(stored);
      // اگر array است، همان را برگردان (ترتیب حفظ شده)
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // اگر object است، به array تبدیل کن با ترتیب پیش‌فرض
      const order = ["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"];
      return order.map((key) => ({
        key,
        label: parsed[key] || DEFAULT_STATUS_TEXTS[key] || key,
      }));
    }
  } catch (e) {
    console.error("Error loading status texts order from storage:", e);
  }
  return null;
}

/**
 * Clear status texts from localStorage
 */
export function clearStatusTextsFromStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("statusTexts");
  } catch (e) {
    console.error("Error clearing status texts from storage:", e);
  }
}

