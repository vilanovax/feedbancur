import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// Cache Tags for revalidation
export const CACHE_TAGS = {
  DEPARTMENTS: "departments",
  USER_STATUSES: "user-statuses",
  SETTINGS: "settings",
  ANALYTICS_KEYWORDS: "analytics-keywords",
  ANALYTICS: "analytics",
  FEEDBACKS: "feedbacks",
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
 * Get analytics data (cached)
 */
export const getCachedAnalytics = unstable_cache(
  async (workingHoursSettings: {
    enabled: boolean;
    startHour: number;
    endHour: number;
    workingDays: number[];
    holidays: string[];
  }) => {
    const { calculateWorkingHours } = await import("@/lib/working-hours-utils");

    const [
      totalFeedbacks,
      allFeedbacks,
      departments,
      feedbacksByDepartment,
      completedFeedbacks,
    ] = await Promise.all([
      prisma.feedbacks.count(),
      prisma.feedbacks.findMany({
        select: { rating: true, departmentId: true },
      }),
      prisma.departments.findMany({
        include: {
          _count: {
            select: { feedbacks: true },
          },
        },
      }),
      prisma.departments.findMany({
        include: {
          _count: {
            select: { feedbacks: true },
          },
        },
      }),
      prisma.feedbacks.findMany({
        where: {
          status: "COMPLETED",
          completedAt: { not: null },
          forwardedAt: { not: null },
        },
        select: {
          id: true,
          departmentId: true,
          forwardedAt: true,
          completedAt: true,
        },
      }),
    ]);

    const averageRating =
      allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
          allFeedbacks.length
        : 0;

    const activeDepartments = departments.filter(
      (d) => d._count.feedbacks > 0
    ).length;

    const ratingCounts: { [key: number]: number } = {};
    allFeedbacks.forEach((f) => {
      if (f.rating !== null) {
        ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
      }
    });

    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      name: `${rating} ستاره`,
      value: ratingCounts[rating] || 0,
    }));

    const departmentStats = feedbacksByDepartment.map((dept) => ({
      name: dept.name,
      count: dept._count.feedbacks,
    }));

    // محاسبه سرعت انجام فیدبک‌ها بر اساس بخش
    const departmentCompletionStats: Record<
      string,
      { total: number; totalHours: number; averageHours: number }
    > = {};

    completedFeedbacks.forEach((feedback) => {
      if (!feedback.forwardedAt || !feedback.completedAt) return;

      const startDate = new Date(feedback.forwardedAt);
      const endDate = new Date(feedback.completedAt);
      const hours = calculateWorkingHours(startDate, endDate, workingHoursSettings);

      if (!departmentCompletionStats[feedback.departmentId]) {
        departmentCompletionStats[feedback.departmentId] = {
          total: 0,
          totalHours: 0,
          averageHours: 0,
        };
      }

      departmentCompletionStats[feedback.departmentId].total += 1;
      departmentCompletionStats[feedback.departmentId].totalHours += hours;
    });

    // محاسبه میانگین برای هر بخش
    const departmentCompletionData = departments
      .map((dept) => {
        const stats = departmentCompletionStats[dept.id];
        if (!stats || stats.total === 0) {
          return {
            name: dept.name,
            count: 0,
            averageHours: 0,
            totalCompleted: 0,
          };
        }

        return {
          name: dept.name,
          count: stats.total,
          averageHours: Math.round((stats.totalHours / stats.total) * 10) / 10,
          totalCompleted: stats.total,
        };
      })
      .filter((d) => d.totalCompleted > 0)
      .sort((a, b) => a.averageHours - b.averageHours);

    return {
      totalFeedbacks,
      averageRating,
      activeDepartments,
      ratingDistribution,
      feedbacksByDepartment: departmentStats,
      departmentCompletionSpeed: departmentCompletionData,
    };
  },
  ["analytics-data"],
  {
    revalidate: CACHE_TTL.MEDIUM,
    tags: [CACHE_TAGS.ANALYTICS],
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
