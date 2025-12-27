"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that throttles a value
 * @param value - The value to throttle
 * @param limit - Minimum time between updates in milliseconds (default: 300ms)
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook that returns a throttled callback function
 * @param callback - The function to throttle
 * @param limit - Minimum time between calls in milliseconds (default: 300ms)
 * @returns A throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  const lastRan = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update the callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= limit) {
        callbackRef.current(...args);
        lastRan.current = now;
      } else {
        // Schedule for later if not yet time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRan.current = Date.now();
        }, limit - (now - lastRan.current));
      }
    },
    [limit]
  );
}

/**
 * Hook for throttled scroll handler
 * Useful for infinite scroll or scroll-based animations
 * @param callback - Function to call on scroll
 * @param limit - Minimum time between calls (default: 100ms)
 */
export function useThrottledScroll(
  callback: (scrollY: number, scrollX: number) => void,
  limit: number = 100
) {
  const throttledCallback = useThrottledCallback(callback, limit);

  useEffect(() => {
    const handleScroll = () => {
      throttledCallback(window.scrollY, window.scrollX);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [throttledCallback]);
}

/**
 * Hook for throttled resize handler
 * @param callback - Function to call on resize
 * @param limit - Minimum time between calls (default: 200ms)
 */
export function useThrottledResize(
  callback: (width: number, height: number) => void,
  limit: number = 200
) {
  const throttledCallback = useThrottledCallback(callback, limit);

  useEffect(() => {
    const handleResize = () => {
      throttledCallback(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Call once initially
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [throttledCallback]);
}
