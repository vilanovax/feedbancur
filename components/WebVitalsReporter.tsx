"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { reportWebVitals } from "@/lib/web-vitals";

export function WebVitalsReporter() {
  useEffect(() => {
    // Core Web Vitals (FID replaced by INP in web-vitals v4+)
    onCLS(reportWebVitals);
    onINP(reportWebVitals);
    onLCP(reportWebVitals);

    // Other Web Vitals
    onFCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null;
}

export default WebVitalsReporter;
