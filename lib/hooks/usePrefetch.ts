"use client";

import { useCallback, useRef } from "react";

// Simple in-memory cache for prefetched data
const prefetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache TTL
const pendingRequests = new Map<string, Promise<any>>();

// List of endpoints to prefetch for each page
const pagePrefetchMap: Record<string, string[]> = {
  "/feedback": ["/api/feedback?limit=20", "/api/departments"],
  "/announcements": ["/api/announcements?limit=10"],
  "/polls": ["/api/polls?limit=10"],
  "/users": ["/api/employees", "/api/departments"],
  "/departments": ["/api/departments"],
  "/analytics": ["/api/analytics"],
  "/assessments": ["/api/assessments"],
  "/team-status": ["/api/employees"],
};

export function usePrefetch() {
  const prefetchedPages = useRef<Set<string>>(new Set());

  const prefetchData = useCallback(async (url: string): Promise<any> => {
    // Check cache first
    const cached = prefetchCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Check if request is already pending
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }

    // Make the request
    const request = fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[Prefetch] ${res.status} ${res.statusText} for ${url}`,
              text.slice(0, 200)
            );
          }
          pendingRequests.delete(url);
          return null;
        }
        const data = await res.json();
        prefetchCache.set(url, { data, timestamp: Date.now() });
        pendingRequests.delete(url);
        return data;
      })
      .catch((error) => {
        pendingRequests.delete(url);
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Prefetch] request failed for ${url}:`, error?.message ?? error);
        }
        return null;
      });

    pendingRequests.set(url, request);
    return request;
  }, []);

  const prefetchPage = useCallback(
    async (pagePath: string) => {
      // Normalize the path
      const normalizedPath = pagePath.split("?")[0];

      // Don't prefetch the same page twice
      if (prefetchedPages.current.has(normalizedPath)) {
        return;
      }

      prefetchedPages.current.add(normalizedPath);

      // Get endpoints to prefetch for this page
      const endpoints = pagePrefetchMap[normalizedPath];
      if (!endpoints) return;

      // Prefetch all endpoints in parallel
      await Promise.allSettled(endpoints.map((url) => prefetchData(url)));
    },
    [prefetchData]
  );

  const getCachedData = useCallback((url: string): any | null => {
    const cached = prefetchCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }, []);

  const invalidateCache = useCallback((url?: string) => {
    if (url) {
      prefetchCache.delete(url);
    } else {
      prefetchCache.clear();
    }
  }, []);

  return {
    prefetchPage,
    prefetchData,
    getCachedData,
    invalidateCache,
  };
}

// Export cache utilities for use outside of hooks
export const prefetchUtils = {
  getCachedData: (url: string): any | null => {
    const cached = prefetchCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  },
  invalidateCache: (url?: string) => {
    if (url) {
      prefetchCache.delete(url);
    } else {
      prefetchCache.clear();
    }
  },
  setCacheData: (url: string, data: any) => {
    prefetchCache.set(url, { data, timestamp: Date.now() });
  },
};
