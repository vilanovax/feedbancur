import { useState, useEffect, useCallback, useRef } from "react";
import { getStatusText, loadStatusTextsFromStorage, saveStatusTextsToStorage } from "../status-utils";

/**
 * Hook to get status texts from settings
 * بهینه شده: از localStorage استفاده می‌کند و فقط یک بار از API fetch می‌کند
 */
export function useStatusTexts() {
  const [statusTexts, setStatusTexts] = useState<Record<string, string> | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // ابتدا از localStorage بخوان
    const texts = loadStatusTextsFromStorage();
    if (texts) {
      setStatusTexts(texts);
    } else if (!hasFetchedRef.current) {
      // اگر در localStorage وجود نداشت و قبلاً fetch نکرده‌ایم، یک بار از API بگیر
      hasFetchedRef.current = true;
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.statusTexts) {
            setStatusTexts(data.statusTexts);
            saveStatusTextsToStorage(data.statusTexts);
          }
        })
        .catch((error) => {
          console.error("Error fetching status texts:", error);
        });
    }
  }, []);

  const getStatusTextLocal = useCallback((status: string) => {
    return getStatusText(status, statusTexts || undefined);
  }, [statusTexts]);

  return { getStatusTextLocal, statusTexts };
}

