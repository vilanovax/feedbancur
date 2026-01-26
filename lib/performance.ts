/**
 * Performance Monitoring Utilities
 * ابزارهای مانیتورینگ عملکرد سیستم
 */

// Performance Timer
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(logToConsole = true): number {
    const duration = performance.now() - this.startTime;

    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.log(`⏱️ [Performance] ${this.label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }
}

// API Performance Logger
export function logApiPerformance(
  route: string,
  duration: number,
  method: string = 'GET'
) {
  if (process.env.NODE_ENV === 'development') {
    const emoji = duration < 100 ? '🟢' : duration < 500 ? '🟡' : '🔴';
    console.log(`${emoji} [API] ${method} ${route}: ${duration.toFixed(2)}ms`);
  }
}

// Query Performance Wrapper
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer(`Query: ${queryName}`);

  try {
    const result = await queryFn();
    const duration = timer.end(false);

    if (duration > 1000) {
      console.warn(`⚠️ Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    timer.end(false);
    throw error;
  }
}

// Component Render Counter (for development)
export function useRenderCount(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const renderCount = React.useRef(0);

    React.useEffect(() => {
      renderCount.current += 1;
      console.log(`🔄 [Render] ${componentName}: ${renderCount.current} times`);
    });
  }
}

// Memory Usage Logger
export function logMemoryUsage(label: string) {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const memory = (performance as any).memory;

    if (memory) {
      console.log(`💾 [Memory] ${label}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  }
}

// Cache Hit/Miss Tracker
class CacheTracker {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : '0';

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate}%`,
    };
  }

  log(label: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Cache] ${label}:`, this.getStats());
    }
  }
}

export const cacheTracker = new CacheTracker();

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Import React (needed for useRenderCount)
import React from 'react';
