"use client";

import { useState, useEffect, useCallback } from "react";
import type { Metric } from "web-vitals";
import { getStoredMetrics, getRating, formatValue } from "@/lib/web-vitals";

interface WebVitalsData {
  name: string;
  value: number;
  formattedValue: string;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Hook to access current Web Vitals metrics
 * Updates when new metrics are collected
 */
export function useWebVitals() {
  const [metrics, setMetrics] = useState<Record<string, WebVitalsData>>({});

  const updateMetrics = useCallback(() => {
    const stored = getStoredMetrics();
    const formatted: Record<string, WebVitalsData> = {};

    Object.entries(stored).forEach(([name, metric]) => {
      formatted[name] = {
        name: metric.name,
        value: metric.value,
        formattedValue: formatValue(metric.name, metric.value),
        rating: getRating(
          metric.name as "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB",
          metric.value
        ),
      };
    });

    setMetrics(formatted);
  }, []);

  useEffect(() => {
    // Initial update
    updateMetrics();

    // Update periodically
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [updateMetrics]);

  return metrics;
}

/**
 * Get performance score based on Core Web Vitals
 * Returns a score from 0-100
 */
export function usePerformanceScore() {
  const metrics = useWebVitals();

  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const coreVitals = ["LCP", "FID", "CLS"];
    const scores: number[] = [];

    coreVitals.forEach((name) => {
      const metric = metrics[name];
      if (metric) {
        switch (metric.rating) {
          case "good":
            scores.push(100);
            break;
          case "needs-improvement":
            scores.push(50);
            break;
          case "poor":
            scores.push(0);
            break;
        }
      }
    });

    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      setScore(Math.round(avgScore));
    }
  }, [metrics]);

  return score;
}
