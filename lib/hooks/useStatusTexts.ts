import { useState, useEffect, useCallback, useRef } from "react";
import { getStatusText, loadStatusTextsFromStorage, saveStatusTextsToStorage, loadStatusTextsOrderFromStorage } from "../status-utils";

/**
 * Hook to get status texts from settings
 * بهینه شده: از localStorage استفاده می‌کند و فقط یک بار از API fetch می‌کند
 * همیشه از localStorage می‌خواند تا تغییرات تنظیمات را منعکس کند
 */
export function useStatusTexts() {
  const [statusTexts, setStatusTexts] = useState<Record<string, string> | null>(null);
  const [statusTextsOrder, setStatusTextsOrder] = useState<Array<{ key: string; label: string }> | null>(null);
  const hasFetchedRef = useRef(false);

  // بارگذاری اولیه از localStorage و سپس از API برای اطمینان از به‌روز بودن
  useEffect(() => {
    // فقط در client-side اجرا شود
    if (typeof window === "undefined") return;
    
    // ابتدا از localStorage بخوان (برای نمایش سریع)
    const texts = loadStatusTextsFromStorage();
    const order = loadStatusTextsOrderFromStorage();
    if (texts) {
      setStatusTexts(texts);
    }
    if (order) {
      setStatusTextsOrder(order);
    }
    
    // همیشه یک بار از API fetch کن تا مطمئن شویم localStorage به‌روز است
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.statusTexts) {
            // تبدیل به object اگر array است
            let newTexts = data.statusTexts;
            let newOrder: Array<{ key: string; label: string }> | null = null;
            
            if (Array.isArray(newTexts)) {
              newOrder = newTexts;
              newTexts = newTexts.reduce((acc, item) => {
                acc[item.key] = item.label;
                return acc;
              }, {} as Record<string, string>);
            }
            
            // مقایسه با localStorage - اگر متفاوت بود، به‌روز کن
            const currentTexts = loadStatusTextsFromStorage();
            
            // اگر متفاوت است یا localStorage خالی است، به‌روز کن
            if (!currentTexts || JSON.stringify(currentTexts) !== JSON.stringify(newTexts)) {
              setStatusTexts(newTexts);
              if (newOrder) {
                setStatusTextsOrder(newOrder);
                // ذخیره به صورت array برای حفظ ترتیب
                if (typeof window !== "undefined") {
                  localStorage.setItem("statusTexts", JSON.stringify(newOrder));
                }
              } else {
                saveStatusTextsToStorage(newTexts);
              }
              // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("statusTextsUpdated", { 
                  detail: JSON.stringify(newOrder || newTexts) 
                }));
              }
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
    // فقط در client-side اجرا شود
    if (typeof window === "undefined") return;
    
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
          const parsed = JSON.parse(newValue);
          // اگر array است، ترتیب را هم به‌روز کن
          if (Array.isArray(parsed)) {
            setStatusTextsOrder(parsed);
            const texts = parsed.reduce((acc, item) => {
              acc[item.key] = item.label;
              return acc;
            }, {} as Record<string, string>);
            setStatusTexts(texts);
          } else {
            setStatusTexts(parsed);
            // اگر object است، ترتیب را از localStorage بخوان
            const order = loadStatusTextsOrderFromStorage();
            if (order) {
              setStatusTextsOrder(order);
            }
          }
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
    // فقط در client-side اجرا شود
    if (typeof window === "undefined") {
      return getStatusText(status, statusTexts || undefined);
    }
    
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
    // فقط در client-side اجرا شود
    if (typeof window === "undefined") return;
    
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.statusTexts) {
          let newTexts = data.statusTexts;
          let newOrder: Array<{ key: string; label: string }> | null = null;
          
          if (Array.isArray(newTexts)) {
            newOrder = newTexts;
            newTexts = newTexts.reduce((acc, item) => {
              acc[item.key] = item.label;
              return acc;
            }, {} as Record<string, string>);
          }
          
          setStatusTexts(newTexts);
          if (newOrder) {
            setStatusTextsOrder(newOrder);
            if (typeof window !== "undefined") {
              localStorage.setItem("statusTexts", JSON.stringify(newOrder));
            }
          } else {
            saveStatusTextsToStorage(newTexts);
          }
          // Dispatch event برای به‌روزرسانی در سایر کامپوننت‌ها
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("statusTextsUpdated", { 
              detail: JSON.stringify(newOrder || newTexts) 
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing status texts:", error);
    }
  }, []);

  // تابع برای دریافت ترتیب statusTexts
  const getStatusTextsOrder = useCallback(() => {
    // فقط در client-side اجرا شود
    if (typeof window === "undefined") {
      // Fallback به ترتیب پیش‌فرض
      return [
        { key: "PENDING", label: "در انتظار" },
        { key: "REVIEWED", label: "بررسی شده" },
        { key: "ARCHIVED", label: "آرشیو شده" },
        { key: "DEFERRED", label: "رسیدگی آینده" },
        { key: "COMPLETED", label: "انجام شد" },
      ];
    }
    
    const order = loadStatusTextsOrderFromStorage();
    if (order) {
      return order;
    }
    // Fallback به ترتیب پیش‌فرض
    const defaultOrder = [
      { key: "PENDING", label: "در انتظار" },
      { key: "REVIEWED", label: "بررسی شده" },
      { key: "ARCHIVED", label: "آرشیو شده" },
      { key: "DEFERRED", label: "رسیدگی آینده" },
      { key: "COMPLETED", label: "انجام شد" },
    ];
    return defaultOrder;
  }, []);

  return { getStatusTextLocal, statusTexts, statusTextsOrder, refreshStatusTexts, getStatusTextsOrder };
}

