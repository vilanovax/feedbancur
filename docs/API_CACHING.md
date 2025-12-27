# API Response Caching

## Overview

This project uses Next.js `unstable_cache` for server-side response caching.

## Cached Endpoints

| Endpoint | Cache Key | TTL | Tags |
|----------|-----------|-----|------|
| `/api/departments` | `departments-list` | 5 min | `departments` |
| `/api/analytics` | `analytics-data` | 5 min | `analytics` |
| `/api/settings` | `settings` | 15 min | `settings` |
| `/api/user-statuses` | `user-statuses-list` | 15 min | `user-statuses` |
| `/api/analytics-keywords` | `analytics-keywords-list` | 5 min | `analytics-keywords` |

## Cache Functions

Located in `lib/cache.ts`:

```typescript
import { getCachedDepartments, getCachedSettings, getCachedAnalytics } from "@/lib/cache";

// Get cached departments
const departments = await getCachedDepartments();

// Get cached settings
const settings = await getCachedSettings();

// Get cached analytics
const analytics = await getCachedAnalytics(workingHoursSettings);
```

## Cache Invalidation

After mutations (create, update, delete), invalidate the cache:

```typescript
import { revalidateCacheTag, CACHE_TAGS } from "@/lib/cache";

// After updating departments
await revalidateCacheTag(CACHE_TAGS.DEPARTMENTS);

// After updating settings
await revalidateCacheTag(CACHE_TAGS.SETTINGS);
```

## Cache Tags

```typescript
export const CACHE_TAGS = {
  DEPARTMENTS: "departments",
  USER_STATUSES: "user-statuses",
  SETTINGS: "settings",
  ANALYTICS_KEYWORDS: "analytics-keywords",
  ANALYTICS: "analytics",
  FEEDBACKS: "feedbacks",
};
```

## TTL Presets

```typescript
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 900,      // 15 minutes
  VERY_LONG: 3600, // 1 hour
};
```

## When NOT to Cache

- User-specific data (feedbacks list for specific user)
- Real-time data (chat messages, notifications)
- Frequently changing data (user status updates)
- Authentication-dependent responses

## Client-Side Caching

For client-side caching, use the `useCachedFetch` hook or SWR:

```typescript
import { useCachedFetch } from "@/lib/hooks";

// With custom cache key
const { data, loading, error } = useCachedFetch("/api/departments", {
  cacheKey: "departments",
  ttl: 5 * 60 * 1000, // 5 minutes
});
```
