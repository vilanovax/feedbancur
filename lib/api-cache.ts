/**
 * Server-side API Response Caching
 * Simple in-memory cache for API responses with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a cached value with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds (default: 60 seconds)
   */
  set<T>(key: string, data: T, ttlMs: number = 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy the cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Cache TTL presets in milliseconds
 */
export const CacheTTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 2 * 60 * 1000, // 2 minutes
  LONG: 5 * 60 * 1000, // 5 minutes
  EXTENDED: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Helper to create cache key from request
 */
export function createCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params) return endpoint;

  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
}

/**
 * Wrapper for cached API handler
 * Use this to wrap your API route handlers
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  apiCache.set(key, data, ttlMs);

  return data;
}

/**
 * Decorator for caching API responses
 * Usage: Cache departments list
 */
export function cacheResponse(ttlMs: number = CacheTTL.MEDIUM) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    _target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: unknown[]) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;

      const cached = apiCache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      apiCache.set(key, result, ttlMs);

      return result;
    } as T;

    return descriptor;
  };
}

// Common cache keys
export const CacheKeys = {
  DEPARTMENTS: "departments",
  SETTINGS: "settings",
  ANALYTICS: "analytics",
  USERS: "users",
  STATUS_TEXTS: "status_texts",
} as const;
