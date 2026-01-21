"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, postFetcher } from "./fetcher";

// SWR config defaults
const defaultConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds deduplication
  errorRetryCount: 2,
};

// Stats hook
export function useStats(params?: { dateFrom?: string; dateTo?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params?.dateTo) searchParams.set("dateTo", params.dateTo);

  const url = `/api/stats${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 60000, // Refresh every minute
  });
}

// Feedback hooks
export function useFeedbacks(params?: {
  status?: string;
  page?: number;
  limit?: number;
  forwardedToMe?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.forwardedToMe) searchParams.set("forwardedToMe", "true");

  const url = `/api/feedback${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    keepPreviousData: true,
  });
}

export function useFeedback(id: string | null) {
  return useSWR(id ? `/api/feedback/${id}` : null, fetcher, defaultConfig);
}

// Departments hook
export function useDepartments() {
  return useSWR("/api/departments", fetcher, {
    ...defaultConfig,
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds - departments don't change often
  });
}

// Employees hook
export function useEmployees(departmentId?: string) {
  const url = departmentId
    ? `/api/employees?departmentId=${departmentId}`
    : "/api/employees";

  return useSWR(url, fetcher, {
    ...defaultConfig,
    dedupingInterval: 10000,
  });
}

// Announcements hooks
export function useAnnouncements(params?: { limit?: number; active?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.active !== undefined) searchParams.set("active", params.active.toString());

  const url = `/api/announcements${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 120000, // 2 minutes
  });
}

export function useAnnouncement(id: string | null) {
  return useSWR(id ? `/api/announcements/${id}` : null, fetcher, defaultConfig);
}

// Polls hooks
export function usePolls(params?: { limit?: number; active?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.active !== undefined) searchParams.set("active", params.active.toString());

  const url = `/api/polls${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 120000,
  });
}

export function usePoll(id: string | null) {
  return useSWR(id ? `/api/polls/${id}` : null, fetcher, defaultConfig);
}

// Assessments hooks
export function useAssessments() {
  return useSWR("/api/assessments", fetcher, {
    ...defaultConfig,
    dedupingInterval: 15000,
  });
}

export function useAssessment(id: string | null) {
  return useSWR(id ? `/api/assessments/${id}` : null, fetcher, defaultConfig);
}

export function useAvailableAssessments() {
  return useSWR("/api/assessments/available", fetcher, {
    ...defaultConfig,
    dedupingInterval: 30000,
  });
}

export function useMyAssessmentResults() {
  return useSWR("/api/assessments/my-results", fetcher, {
    ...defaultConfig,
    revalidateOnFocus: true,
  });
}

// Users hook
export function useUsers() {
  return useSWR("/api/users", fetcher, {
    ...defaultConfig,
    dedupingInterval: 15000,
  });
}

// Tasks hook
export function useTasks() {
  return useSWR("/api/tasks", fetcher, {
    ...defaultConfig,
    refreshInterval: 30000, // 30 seconds
  });
}

// Analytics hook
export function useAnalytics() {
  return useSWR("/api/analytics", fetcher, {
    ...defaultConfig,
    dedupingInterval: 60000, // 1 minute
  });
}

// Mutation hooks for POST/PUT/DELETE
export function useCreateFeedback() {
  return useSWRMutation("/api/feedback", postFetcher);
}

export function useUpdateFeedbackStatus(id: string) {
  return useSWRMutation(`/api/feedback/${id}/status`, postFetcher);
}

// Updates (اطلاع‌رسانی) hooks
export function useUpdates(params?: {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
  drafts?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.search) searchParams.set("search", params.search);
  if (params?.drafts) searchParams.set("drafts", "true");

  const url = `/api/updates${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 120000, // 2 minutes
    keepPreviousData: true,
  });
}

export function useLatestUpdates(limit: number = 5) {
  return useSWR(`/api/updates?limit=${limit}`, fetcher, {
    ...defaultConfig,
    refreshInterval: 60000, // 1 minute
  });
}

export function useUpdate(id: string | null) {
  return useSWR(id ? `/api/updates/${id}` : null, fetcher, defaultConfig);
}

// Notifications hooks
export function useNotifications(params?: { unreadOnly?: boolean }) {
  const searchParams = new URLSearchParams();
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");

  const url = `/api/notifications${searchParams.toString() ? `?${searchParams}` : ""}`;

  return useSWR(url, fetcher, {
    ...defaultConfig,
    refreshInterval: 30000, // Refresh every 30 seconds for real-time feel
    revalidateOnFocus: true,
  });
}

export function useNotification(id: string | null) {
  return useSWR(id ? `/api/notifications/${id}` : null, fetcher, defaultConfig);
}
