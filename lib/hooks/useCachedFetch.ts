"use client";

import { useState, useEffect, useCallback } from "react";
import { prefetchUtils } from "./usePrefetch";

interface UseCachedFetchOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCachedFetch<T>(
  url: string,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const { enabled = true, refetchOnMount = true } = options;

  const [data, setData] = useState<T | null>(() => {
    // Initialize with cached data if available
    return prefetchUtils.getCachedData(url) || null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = prefetchUtils.getCachedData(url);
    if (cached && !refetchOnMount) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      prefetchUtils.setCacheData(url, result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [url, enabled, refetchOnMount]);

  const refetch = useCallback(async () => {
    prefetchUtils.invalidateCache(url);
    await fetchData();
  }, [url, fetchData]);

  useEffect(() => {
    // If we have cached data, use it immediately
    const cached = prefetchUtils.getCachedData(url);
    if (cached) {
      setData(cached);
      setLoading(false);

      // Optionally refetch in background to ensure freshness
      if (refetchOnMount) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [url, fetchData, refetchOnMount]);

  return { data, loading, error, refetch };
}
