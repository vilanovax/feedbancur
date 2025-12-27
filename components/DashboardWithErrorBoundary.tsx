"use client";

import ErrorBoundary from "./ErrorBoundary";
import Dashboard from "./Dashboard";

export default function DashboardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
