import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache برای recent activity - 30 ثانیه
const activityCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

interface Activity {
  id: string;
  type: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  message: string;
  timestamp: Date;
  icon: string;
  link?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // بررسی cache
    const cacheKey = `recent-activity-${limit}`;
    const now = Date.now();
    const cached = activityCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    const activities: Activity[] = [];

    // دریافت آخرین فیدبک‌های ثبت شده
    const recentFeedbacks = await prisma.feedbacks.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        users_feedbacks_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        users_feedbacks_assignedToTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
    });

    recentFeedbacks.forEach((feedback) => {
      // فیدبک جدید ثبت شد
      if (
        feedback.createdAt.getTime() === feedback.updatedAt.getTime() ||
        Math.abs(
          feedback.updatedAt.getTime() - feedback.createdAt.getTime()
        ) < 1000
      ) {
        activities.push({
          id: `feedback-created-${feedback.id}`,
          type: "feedback_created",
          user: {
            id: feedback.users_feedbacks_userIdTousers.id,
            name: feedback.users_feedbacks_userIdTousers.name || feedback.users_feedbacks_userIdTousers.email,
            avatar: feedback.users_feedbacks_userIdTousers.avatar,
          },
          message: `فیدبک جدید "${feedback.title}" ثبت کرد`,
          timestamp: feedback.createdAt,
          icon: "MessageSquare",
          link: `/feedback/${feedback.id}`,
        });
      }
      // فیدبک تکمیل شد
      else if (feedback.status === "COMPLETED" && feedback.users_feedbacks_assignedToTousers) {
        activities.push({
          id: `feedback-completed-${feedback.id}`,
          type: "feedback_completed",
          user: {
            id: feedback.users_feedbacks_assignedToTousers.id,
            name:
              feedback.users_feedbacks_assignedToTousers.name || feedback.users_feedbacks_assignedToTousers.email,
            avatar: feedback.users_feedbacks_assignedToTousers.avatar,
          },
          message: `فیدبک "${feedback.title}" را تکمیل کرد`,
          timestamp: feedback.updatedAt,
          icon: "CheckCircle",
          link: `/feedback/${feedback.id}`,
        });
      }
      // فیدبک به‌روزرسانی شد
      else if (feedback.updatedAt > feedback.createdAt) {
        const user = feedback.users_feedbacks_assignedToTousers || feedback.users_feedbacks_userIdTousers;
        activities.push({
          id: `feedback-updated-${feedback.id}`,
          type: "feedback_updated",
          user: {
            id: user.id,
            name: user.name || user.email,
            avatar: user.avatar,
          },
          message: `فیدبک "${feedback.title}" را به‌روزرسانی کرد`,
          timestamp: feedback.updatedAt,
          icon: "Edit",
          link: `/feedback/${feedback.id}`,
        });
      }
    });

    // دریافت آخرین اعلانات منتشر شده
    const recentAnnouncements = await prisma.announcements.findMany({
      where: {
        isActive: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    recentAnnouncements.forEach((announcement) => {
      activities.push({
        id: `announcement-${announcement.id}`,
        type: "announcement_published",
        user: {
          id: announcement.users.id,
          name: announcement.users.name || announcement.users.email,
          avatar: announcement.users.avatar,
        },
        message: `اعلان "${announcement.title}" منتشر کرد`,
        timestamp: announcement.createdAt,
        icon: "Megaphone",
        link: `/announcements`,
      });
    });

    // دریافت آخرین نظرسنجی‌های ایجاد شده
    const recentPolls = await prisma.polls.findMany({
      where: {
        isActive: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    recentPolls.forEach((poll) => {
      activities.push({
        id: `poll-${poll.id}`,
        type: "poll_created",
        user: {
          id: poll.users.id,
          name: poll.users.name || poll.users.email,
          avatar: poll.users.avatar,
        },
        message: `نظرسنجی "${poll.title}" ایجاد کرد`,
        timestamp: poll.createdAt,
        icon: "BarChart",
        link: `/polls`,
      });
    });

    // مرتب‌سازی بر اساس تاریخ و محدود کردن به limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    // ذخیره در cache
    activityCache.set(cacheKey, {
      data: sortedActivities,
      timestamp: now,
    });

    // پاک کردن cache های قدیمی
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    for (const [key, value] of activityCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        activityCache.delete(key);
      }
    }

    return NextResponse.json(sortedActivities, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);

    // اگر خطای اتصال به دیتابیس باشد
    if (
      error?.code === "P1001" ||
      error?.message?.includes("Can't reach database")
    ) {
      console.warn("Database connection failed, returning empty array");
      return NextResponse.json([]);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
