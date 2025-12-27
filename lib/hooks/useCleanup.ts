"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Hook for managing cleanup of resources when component unmounts
 * Prevents memory leaks from async operations, timers, and event listeners
 */
export function useCleanup() {
  const isMountedRef = useRef(true);
  const cleanupFunctionsRef = useRef<Set<() => void>>(new Set());
  const abortControllersRef = useRef<Set<AbortController>>(new Set());
  const timeoutIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Check if component is still mounted
  const isMounted = useCallback(() => isMountedRef.current, []);

  // Register a cleanup function
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.add(cleanupFn);
    return () => {
      cleanupFunctionsRef.current.delete(cleanupFn);
    };
  }, []);

  // Create an AbortController that auto-aborts on unmount
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    return controller;
  }, []);

  // Safe setTimeout that auto-clears on unmount
  const safeTimeout = useCallback(
    (callback: () => void, delay: number): NodeJS.Timeout => {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          callback();
        }
        timeoutIdsRef.current.delete(timeoutId);
      }, delay);
      timeoutIdsRef.current.add(timeoutId);
      return timeoutId;
    },
    []
  );

  // Safe setInterval that auto-clears on unmount
  const safeInterval = useCallback(
    (callback: () => void, delay: number): NodeJS.Timeout => {
      const intervalId = setInterval(() => {
        if (isMountedRef.current) {
          callback();
        }
      }, delay);
      intervalIdsRef.current.add(intervalId);
      return intervalId;
    },
    []
  );

  // Clear a specific timeout
  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId);
    timeoutIdsRef.current.delete(timeoutId);
  }, []);

  // Clear a specific interval
  const clearSafeInterval = useCallback((intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId);
    intervalIdsRef.current.delete(intervalId);
  }, []);

  // Safe fetch that aborts on unmount
  const safeFetch = useCallback(
    async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response | null> => {
      const controller = createAbortController();
      try {
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });
        abortControllersRef.current.delete(controller);
        return response;
      } catch (error) {
        abortControllersRef.current.delete(controller);
        if (error instanceof Error && error.name === "AbortError") {
          return null;
        }
        throw error;
      }
    },
    [createAbortController]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Clear all timeouts
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current.clear();

      // Clear all intervals
      intervalIdsRef.current.forEach((id) => clearInterval(id));
      intervalIdsRef.current.clear();

      // Abort all pending requests
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current.clear();

      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach((fn) => fn());
      cleanupFunctionsRef.current.clear();
    };
  }, []);

  return {
    isMounted,
    registerCleanup,
    createAbortController,
    safeTimeout,
    safeInterval,
    clearSafeTimeout,
    clearSafeInterval,
    safeFetch,
  };
}

/**
 * Hook for safe async state updates
 * Prevents "Can't perform a React state update on an unmounted component" warning
 */
export function useSafeState<T>(
  initialState: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}

// Need to import useState
import { useState } from "react";

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = typeof window !== "undefined"
    ? window
    : null,
  options?: AddEventListenerOptions
) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventHandler = (event: Event) => {
      handlerRef.current(event as WindowEventMap[K]);
    };

    element.addEventListener(eventType, eventHandler, options);

    return () => {
      element.removeEventListener(eventType, eventHandler, options);
    };
  }, [eventType, element, options]);
}

/**
 * Hook for polling data with automatic cleanup
 */
export function usePolling(
  callback: () => Promise<void> | void,
  interval: number,
  enabled: boolean = true
) {
  const { safeInterval, clearSafeInterval, isMounted } = useCleanup();
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalIdRef.current) {
        clearSafeInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    // Initial call
    const runCallback = async () => {
      if (isMounted()) {
        await callback();
      }
    };
    runCallback();

    // Set up polling
    intervalIdRef.current = safeInterval(runCallback, interval);

    return () => {
      if (intervalIdRef.current) {
        clearSafeInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [callback, interval, enabled, safeInterval, clearSafeInterval, isMounted]);
}
