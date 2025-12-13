import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache برای stats - 30 ثانیه
let statsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // بررسی cache
    const now = Date.now();
    if (statsCache && (now - statsCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json(statsCache.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    // تاریخ 24 ساعت قبل برای تشخیص موارد جدید
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

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
    ] = await Promise.all([
      prisma.feedback.count({ where: { deletedAt: null } }),
      prisma.feedback.count({ where: { status: "PENDING", deletedAt: null } }),
      prisma.department.count(),
      prisma.feedback.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.feedback.count({ where: { status: "DEFERRED", deletedAt: null } }),
      prisma.feedback.count({ where: { status: "ARCHIVED", deletedAt: null } }),
      // اعلانات
      prisma.announcement.count(),
      prisma.announcement.count({
        where: {
          isActive: true,
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: new Date() } },
          ],
        }
      }),
      prisma.announcement.count({
        where: {
          createdAt: { gte: oneDayAgo },
          isActive: true,
        }
      }),
      // نظرسنجی‌ها
      prisma.poll.count(),
      prisma.poll.count({
        where: {
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
        }
      }),
      prisma.poll.count({
        where: {
          createdAt: { gte: oneDayAgo },
          isActive: true,
        }
      }),
    ]);

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
    };

    // ذخیره در cache
    statsCache = {
      data: statsData,
      timestamp: Date.now(),
    };

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

