import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache برای stats - 30 ثانیه (بر اساس userId)
const statsCache: Map<string, { data: any; timestamp: number }> = new Map();

const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // کلید cache بر اساس userId و departmentId
    const cacheKey = `${session.user.id}-${session.user.departmentId || 'no-dept'}`;

    // بررسی cache
    const now = Date.now();
    const cached = statsCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // تاریخ 24 ساعت قبل برای تشخیص موارد جدید
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // ساخت شرط where برای اعلانات
    let announcementWhere: any;
    let newAnnouncementWhere: any;

    if (session.user.role === "ADMIN") {
      // ادمین همه اعلانات فعال را می‌بیند (بدون فیلتر بخش)
      announcementWhere = {
        isActive: true,
        AND: [
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: new Date() } },
            ],
          },
        ],
      };

      newAnnouncementWhere = {
        createdAt: { gte: oneDayAgo },
        isActive: true,
      };
    } else {
      // مدیر و کارمند فقط اعلانات عمومی و بخش خود را می‌بینند
      const departmentFilter: any[] = [
        { departmentId: null }, // اعلانات عمومی
      ];

      if (session.user.departmentId) {
        departmentFilter.push({ departmentId: session.user.departmentId });
      }

      announcementWhere = {
        isActive: true,
        AND: [
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: new Date() } },
            ],
          },
          {
            OR: departmentFilter,
          },
        ],
      };

      newAnnouncementWhere = {
        createdAt: { gte: oneDayAgo },
        isActive: true,
        AND: [
          {
            OR: departmentFilter,
          },
        ],
      };
    }

    // ساخت شرط where برای نظرسنجی‌ها
    let activePollWhere: any;
    let newPollWhere: any;

    if (session.user.role === "ADMIN") {
      // ادمین همه نظرسنجی‌های فعال را می‌بیند (بدون فیلتر بخش)
      activePollWhere = {
        isActive: true,
        AND: [
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { closedAt: null },
              { closedAt: { gt: new Date() } },
            ],
          },
        ],
      };

      newPollWhere = {
        createdAt: { gte: oneDayAgo },
        isActive: true,
      };
    } else {
      // مدیر و کارمند فقط نظرسنجی‌های عمومی و بخش خود را می‌بینند
      const departmentFilter: any[] = [
        { departmentId: null }, // نظرسنجی‌های عمومی
      ];

      if (session.user.departmentId) {
        departmentFilter.push({ departmentId: session.user.departmentId });
      }

      activePollWhere = {
        isActive: true,
        AND: [
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { closedAt: null },
              { closedAt: { gt: new Date() } },
            ],
          },
          {
            OR: departmentFilter,
          },
        ],
      };

      newPollWhere = {
        createdAt: { gte: oneDayAgo },
        isActive: true,
        AND: [
          {
            OR: departmentFilter,
          },
        ],
      };
    }

    // تاریخ 7 روز قبل برای trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalFeedbacks,
      pendingFeedbacks,
      departments,
      completedFeedbacks,
      deferredFeedbacks,
      archivedFeedbacks,
      // آمار اعلانات
      totalAnnouncements,
      activeAnnouncements,
      newAnnouncements,
      // آمار نظرسنجی‌ها
      totalPolls,
      activePolls,
      newPolls,
      // آمار هفته قبل برای trends
      prevWeekTotal,
      prevWeekPending,
      prevWeekCompleted,
      prevWeekDeferred,
      // داده‌های 7 روز اخیر برای mini charts
      last7DaysFeedbacks,
    ] = await Promise.all([
      prisma.feedbacks.count({ where: { deletedAt: null } }),
      prisma.feedbacks.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.departments.count(),
      prisma.feedbacks.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.feedbacks.count({ where: { status: "DEFERRED", deletedAt: null } }),
      prisma.feedbacks.count({ where: { status: "ARCHIVED", deletedAt: null } }),
      // اعلانات
      prisma.announcements.count(),
      prisma.announcements.count({
        where: announcementWhere,
      }),
      prisma.announcements.count({
        where: newAnnouncementWhere,
      }),
      // نظرسنجی‌ها
      prisma.polls.count(),
      prisma.polls.count({
        where: activePollWhere,
      }),
      prisma.polls.count({
        where: newPollWhere,
      }),
      // آمار هفته قبل (14-7 روز قبل)
      prisma.feedbacks.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.feedbacks.count({
        where: {
          status: "PENDING",
          deletedAt: null,
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.feedbacks.count({
        where: {
          status: "COMPLETED",
          deletedAt: null,
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.feedbacks.count({
        where: {
          status: "DEFERRED",
          deletedAt: null,
          createdAt: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo,
          },
        },
      }),
      // فیدبک‌های 7 روز اخیر به تفکیک روز
      prisma.feedbacks.groupBy({
        by: ["createdAt"],
        where: {
          deletedAt: null,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: true,
      }),
    ]);

    // محاسبه trends
    const thisWeekTotal = await prisma.feedbacks.count({
      where: {
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const thisWeekPending = await prisma.feedbacks.count({
      where: {
        status: "PENDING",
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const thisWeekCompleted = await prisma.feedbacks.count({
      where: {
        status: "COMPLETED",
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    const thisWeekDeferred = await prisma.feedbacks.count({
      where: {
        status: "DEFERRED",
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // محاسبه درصد تغییرات
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return ((current - previous) / previous) * 100;
    };

    const getTrendDirection = (value: number): "up" | "down" | "neutral" => {
      if (value > 0) return "up";
      if (value < 0) return "down";
      return "neutral";
    };

    // آماده کردن داده‌های mini chart (7 روز اخیر)
    const prepareMiniChartData = () => {
      const chartData: number[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - i);
        targetDate.setHours(0, 0, 0, 0);

        const count = last7DaysFeedbacks.filter((f) => {
          const feedbackDate = new Date(f.createdAt);
          feedbackDate.setHours(0, 0, 0, 0);
          return feedbackDate.getTime() === targetDate.getTime();
        }).length;

        chartData.push(count);
      }

      return chartData;
    };

    const miniChartData = prepareMiniChartData();

    const statsData = {
      totalFeedbacks,
      pendingFeedbacks,
      departments,
      completedFeedbacks,
      deferredFeedbacks,
      archivedFeedbacks,
      // اعلانات
      totalAnnouncements,
      activeAnnouncements,
      newAnnouncements,
      // نظرسنجی‌ها
      totalPolls,
      activePolls,
      newPolls,
      // trends برای نمایش تغییرات درصدی
      trends: {
        totalFeedbacks: {
          value: calculateTrend(thisWeekTotal, prevWeekTotal),
          direction: getTrendDirection(calculateTrend(thisWeekTotal, prevWeekTotal)),
        },
        pendingFeedbacks: {
          value: calculateTrend(thisWeekPending, prevWeekPending),
          direction: getTrendDirection(calculateTrend(thisWeekPending, prevWeekPending)),
        },
        completedFeedbacks: {
          value: calculateTrend(thisWeekCompleted, prevWeekCompleted),
          direction: getTrendDirection(calculateTrend(thisWeekCompleted, prevWeekCompleted)),
        },
        deferredFeedbacks: {
          value: calculateTrend(thisWeekDeferred, prevWeekDeferred),
          direction: getTrendDirection(calculateTrend(thisWeekDeferred, prevWeekDeferred)),
        },
      },
      // داده‌های mini chart برای 7 روز اخیر
      miniChartData,
    };

    // ذخیره در cache
    statsCache.set(cacheKey, {
      data: statsData,
      timestamp: Date.now(),
    });

    // پاک کردن cache های قدیمی (بیش از 5 دقیقه)
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    for (const [key, value] of statsCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        statsCache.delete(key);
      }
    }

    return NextResponse.json(statsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    
    // اگر خطای اتصال به دیتابیس باشد، مقادیر پیش‌فرض برگردان
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      console.warn("Database connection failed, returning default values");
      return NextResponse.json({
        totalFeedbacks: 0,
        pendingFeedbacks: 0,
        departments: 0,
        completedFeedbacks: 0,
        deferredFeedbacks: 0,
        archivedFeedbacks: 0,
        totalAnnouncements: 0,
        activeAnnouncements: 0,
        newAnnouncements: 0,
        totalPolls: 0,
        activePolls: 0,
        newPolls: 0,
      });
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

