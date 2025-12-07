import { useState, useEffect, useCallback, useRef } from "react";
import { getStatusText, loadStatusTextsFromStorage, saveStatusTextsToStorage } from "../status-utils";

/**
 * Hook to get status texts from settings
 * بهینه شده: از localStorage استفاده می‌کند و فقط یک بار از API fetch می‌کند
 * همیشه از localStorage می‌خواند تا تغییرات تنظیمات را منعکس کند
 */
export function useStatusTexts() {
  const [statusTexts, setStatusTexts] = useState<Record<string, string> | null>(null);
  const hasFetchedRef = useRef(false);

  // بارگذاری اولیه از localStorage و سپس از API برای اطمینان از به‌روز بودن
  useEffect(() => {
    // ابتدا از localStorage بخوان (برای نمایش سریع)
    const texts = loadStatusTextsFromStorage();
    if (texts) {
      setStatusTexts(texts);
    }
    
    // همیشه یک بار از API fetch کن تا مطمئن شویم localStorage به‌روز است
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.statusTexts) {
            // مقایسه با localStorage - اگر متفاوت بود، به‌روز کن
            const currentTexts = loadStatusTextsFromStorage();
            const newTexts = data.statusTexts;
            
            // اگر متفاوت است یا localStorage خالی است، به‌روز کن
            if (!currentTexts || JSON.stringify(currentTexts) !== JSON.stringify(newTexts)) {
              setStatusTexts(newTexts);
              saveStatusTextsToStorage(newTexts);
              // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
              window.dispatchEvent(new CustomEvent("statusTextsUpdated", { 
                detail: JSON.stringify(newTexts) 
              }));
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching status texts:", error);
        });
    }
  }, []);

  // گوش دادن به تغییرات localStorage (برای تب‌های دیگر و همان تب)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      let newValue: string | null = null;
      
      if (e instanceof StorageEvent) {
        // برای تب‌های دیگر
        if (e.key === "statusTexts") {
          newValue = e.newValue;
        }
      } else if (e instanceof CustomEvent) {
        // برای همان تب (custom event)
        newValue = e.detail;
      }
      
      if (newValue) {
        try {
          const texts = JSON.parse(newValue);
          setStatusTexts(texts);
        } catch (error) {
          console.error("Error parsing status texts from storage event:", error);
        }
      }
    };

    // گوش دادن به storage event (برای تب‌های دیگر)
    window.addEventListener("storage", handleStorageChange as EventListener);
    // گوش دادن به custom event (برای همان تب)
    window.addEventListener("statusTextsUpdated", handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange as EventListener);
      window.removeEventListener("statusTextsUpdated", handleStorageChange as EventListener);
    };
  }, []);

  // همیشه از localStorage بخوان تا تغییرات تنظیمات را منعکس کند
  // این باعث می‌شود که حتی اگر state به‌روز نشده باشد، از آخرین مقادیر استفاده شود
  const getStatusTextLocal = useCallback((status: string) => {
    // ابتدا از localStorage بخوان (برای اطمینان از آخرین مقادیر)
    const texts = loadStatusTextsFromStorage();
    if (texts) {
      // اگر state به‌روز نشده، آن را به‌روز کن (بدون re-render)
      if (JSON.stringify(texts) !== JSON.stringify(statusTexts)) {
        setStatusTexts(texts);
      }
      return getStatusText(status, texts);
    }
    // اگر localStorage خالی بود، از state استفاده کن
    return getStatusText(status, statusTexts || undefined);
  }, [statusTexts]);

  // تابع برای به‌روزرسانی دستی از API
  const refreshStatusTexts = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.statusTexts) {
          setStatusTexts(data.statusTexts);
          saveStatusTextsToStorage(data.statusTexts);
          // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
          window.dispatchEvent(new CustomEvent("statusTextsUpdated", { 
            detail: JSON.stringify(data.statusTexts) 
          }));
        }
      }
    } catch (error) {
      console.error("Error refreshing status texts:", error);
    }
  }, []);

  return { getStatusTextLocal, statusTexts, refreshStatusTexts };
}

