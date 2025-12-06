import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFeedbackTypeLabel,
  loadFeedbackTypesFromStorage,
  saveFeedbackTypesToStorage,
  DEFAULT_FEEDBACK_TYPES,
} from "../feedback-types-utils";

/**
 * Hook to get feedback types from settings
 * بهینه شده: از localStorage استفاده می‌کند و فقط یک بار از API fetch می‌کند
 */
export function useFeedbackTypes() {
  const [feedbackTypes, setFeedbackTypes] = useState<Array<{ key: string; label: string }> | null>(null);
  const hasFetchedRef = useRef(false);

  // بارگذاری اولیه از localStorage و سپس از API برای اطمینان از به‌روز بودن
  useEffect(() => {
    // ابتدا از localStorage بخوان (برای نمایش سریع)
    const types = loadFeedbackTypesFromStorage();
    if (types) {
      setFeedbackTypes(types);
    }
    
    // همیشه یک بار از API fetch کن تا مطمئن شویم localStorage به‌روز است
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.feedbackTypes && Array.isArray(data.feedbackTypes)) {
            // مقایسه با localStorage - اگر متفاوت بود، به‌روز کن
            const currentTypes = loadFeedbackTypesFromStorage();
            const newTypes = data.feedbackTypes;
            
            // اگر متفاوت است یا localStorage خالی است، به‌روز کن
            if (!currentTypes || JSON.stringify(currentTypes) !== JSON.stringify(newTypes)) {
              setFeedbackTypes(newTypes);
              saveFeedbackTypesToStorage(newTypes);
              // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
              window.dispatchEvent(new CustomEvent("feedbackTypesUpdated", { 
                detail: JSON.stringify(newTypes) 
              }));
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching feedback types:", error);
        });
    }
  }, []);

  // گوش دادن به تغییرات localStorage (برای تب‌های دیگر و همان تب)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      let newValue: string | null = null;
      
      if (e instanceof StorageEvent) {
        // برای تب‌های دیگر
        if (e.key === "feedbackTypes") {
          newValue = e.newValue;
        }
      } else if (e instanceof CustomEvent) {
        // برای همان تب (custom event)
        newValue = e.detail;
      }
      
      if (newValue) {
        try {
          const types = JSON.parse(newValue);
          setFeedbackTypes(types);
        } catch (error) {
          console.error("Error parsing feedback types from storage event:", error);
        }
      }
    };

    // گوش دادن به storage event (برای تب‌های دیگر)
    window.addEventListener("storage", handleStorageChange as EventListener);
    // گوش دادن به custom event (برای همان تب)
    window.addEventListener("feedbackTypesUpdated", handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange as EventListener);
      window.removeEventListener("feedbackTypesUpdated", handleStorageChange as EventListener);
    };
  }, []);

  // همیشه از localStorage بخوان تا تغییرات تنظیمات را منعکس کند
  const getFeedbackTypeLabelLocal = useCallback((key: string) => {
    // ابتدا از localStorage بخوان (برای اطمینان از آخرین مقادیر)
    const types = loadFeedbackTypesFromStorage();
    if (types) {
      // اگر state به‌روز نشده، آن را به‌روز کن
      if (JSON.stringify(types) !== JSON.stringify(feedbackTypes)) {
        setFeedbackTypes(types);
      }
      return getFeedbackTypeLabel(key, types);
    }
    // اگر localStorage خالی بود، از state استفاده کن
    return getFeedbackTypeLabel(key, feedbackTypes || undefined);
  }, [feedbackTypes]);

  // تابع برای به‌روزرسانی دستی از API
  const refreshFeedbackTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.feedbackTypes && Array.isArray(data.feedbackTypes)) {
          setFeedbackTypes(data.feedbackTypes);
          saveFeedbackTypesToStorage(data.feedbackTypes);
          // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
          window.dispatchEvent(new CustomEvent("feedbackTypesUpdated", { 
            detail: JSON.stringify(data.feedbackTypes) 
          }));
        }
      }
    } catch (error) {
      console.error("Error refreshing feedback types:", error);
    }
  }, []);

  return {
    feedbackTypes: feedbackTypes || DEFAULT_FEEDBACK_TYPES,
    getFeedbackTypeLabel: getFeedbackTypeLabelLocal,
    refreshFeedbackTypes,
  };
}

