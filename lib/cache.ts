import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Cache Tags for revalidation
export const CACHE_TAGS = {
  DEPARTMENTS: "departments",
  USER_STATUSES: "user-statuses",
  SETTINGS: "settings",
  ANALYTICS_KEYWORDS: "analytics-keywords",
} as const;

// Cache TTL in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
} as const;

/**
 * Get all departments with user count (cached)
 */
export const getCachedDepartments = unstable_cache(
  async () => {
    const departments = await prisma.departments.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return departments.map((dept) => ({
      ...dept,
      _count: {
        users: dept._count.users,
      },
    }));
  },
  ["departments-list"],
  {
    revalidate: CACHE_TTL.MEDIUM,
    tags: [CACHE_TAGS.DEPARTMENTS],
  }
);

/**
 * Get user statuses (cached)
 */
export const getCachedUserStatuses = unstable_cache(
  async (isActive?: boolean) => {
    const where: { isActive?: boolean } = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.user_statuses.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });
  },
  ["user-statuses-list"],
  {
    revalidate: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.USER_STATUSES],
  }
);

/**
 * Get settings (cached, role-based)
 */
export const getCachedSettings = unstable_cache(
  async () => {
    const settings = await prisma.settings.findFirst();
    return settings;
  },
  ["settings"],
  {
    revalidate: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.SETTINGS],
  }
);

/**
 * Get analytics keywords (cached)
 */
export const getCachedAnalyticsKeywords = unstable_cache(
  async (filters?: {
    departmentId?: string;
    type?: string;
    isActive?: boolean;
  }) => {
    const where: {
      departmentId?: string;
      type?: string;
      isActive?: boolean;
    } = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.type) {
      where.type = filters.type as any;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.analytics_keywords.findMany({
      where,
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  ["analytics-keywords-list"],
  {
    revalidate: CACHE_TTL.MEDIUM,
    tags: [CACHE_TAGS.ANALYTICS_KEYWORDS],
  }
);

/**
 * Revalidate specific cache tag
 * Use this after mutations (create, update, delete)
 */
export async function revalidateCacheTag(
  tag: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
) {
  const { revalidateTag } = await import("next/cache");
  revalidateTag(tag);
}
