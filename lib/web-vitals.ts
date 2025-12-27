import type { Metric } from "web-vitals";

// Thresholds for Web Vitals (based on Google's recommendations)
const thresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

type MetricName = keyof typeof thresholds;

function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = thresholds[name];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

function formatValue(name: string, value: number): string {
  switch (name) {
    case "CLS":
      return value.toFixed(3);
    case "FCP":
    case "LCP":
    case "FID":
    case "INP":
    case "TTFB":
      return `${Math.round(value)}ms`;
    default:
      return value.toString();
  }
}

// Console logging for development
function logToConsole(metric: Metric) {
  const rating = getRating(metric.name as MetricName, metric.value);
  const formattedValue = formatValue(metric.name, metric.value);

  const colors = {
    good: "color: #0cce6b",
    "needs-improvement": "color: #ffa400",
    poor: "color: #ff4e42",
  };

  console.log(
    `%c[Web Vitals] ${metric.name}: ${formattedValue} (${rating})`,
    colors[rating]
  );
}

// Send to analytics endpoint (optional)
async function sendToAnalytics(metric: Metric) {
  // Only send in production
  if (process.env.NODE_ENV !== "production") return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name as MetricName, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now(),
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/web-vitals", body);
  } else {
    fetch("/api/analytics/web-vitals", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
}

// Store metrics for dashboard display
const metricsStore: Record<string, Metric> = {};

export function getStoredMetrics() {
  return { ...metricsStore };
}

// Main reporter function
export function reportWebVitals(metric: Metric) {
  // Store the metric
  metricsStore[metric.name] = metric;

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    logToConsole(metric);
  }

  // Send to analytics
  sendToAnalytics(metric);
}

// Export for use in app
export { thresholds, getRating, formatValue };
