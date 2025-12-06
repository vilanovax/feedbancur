/**
 * Utility functions for feedback types management
 */

// Default feedback types
export const DEFAULT_FEEDBACK_TYPES: Array<{ key: string; label: string }> = [
  { key: "SUGGESTION", label: "پیشنهادی" },
  { key: "CRITICAL", label: "انتقادی" },
  { key: "SURVEY", label: "نظرسنجی" },
];

/**
 * Get feedback type label from key
 */
export function getFeedbackTypeLabel(
  key: string,
  customTypes?: Array<{ key: string; label: string }>
): string {
  if (customTypes && customTypes.length > 0) {
    const found = customTypes.find((type) => type.key === key);
    if (found) return found.label;
  }
  // Fallback to default
  const defaultType = DEFAULT_FEEDBACK_TYPES.find((type) => type.key === key);
  return defaultType?.label || key;
}

/**
 * Load feedback types from localStorage
 */
export function loadFeedbackTypesFromStorage(): Array<{ key: string; label: string }> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("feedbackTypes");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading feedback types from storage:", e);
  }
  return null;
}

/**
 * Save feedback types to localStorage
 */
export function saveFeedbackTypesToStorage(types: Array<{ key: string; label: string }>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("feedbackTypes", JSON.stringify(types));
    // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
    window.dispatchEvent(new CustomEvent("feedbackTypesUpdated", { 
      detail: JSON.stringify(types) 
    }));
  } catch (e) {
    console.error("Error saving feedback types to storage:", e);
  }
}

/**
 * Clear feedback types from localStorage
 */
export function clearFeedbackTypesFromStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("feedbackTypes");
  } catch (e) {
    console.error("Error clearing feedback types from storage:", e);
  }
}

