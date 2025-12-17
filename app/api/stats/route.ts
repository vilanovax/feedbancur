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

    // ساخت شرط where برای اعلانات بر اساس بخش کاربر
    const announcementWhere: any = {
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
            { departmentId: null }, // اعلانات عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، اعلانات آن بخش را هم اضافه کن
    if (session.user.departmentId) {
      announcementWhere.AND[1].OR.push({ departmentId: session.user.departmentId });
    }

    // ساخت شرط where برای اعلانات جدید
    const newAnnouncementWhere: any = {
      createdAt: { gte: oneDayAgo },
      isActive: true,
      AND: [
        {
          OR: [
            { departmentId: null }, // اعلانات عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، اعلانات جدید آن بخش را هم اضافه کن
    if (session.user.departmentId) {
      newAnnouncementWhere.AND[0].OR.push({ departmentId: session.user.departmentId });
    }

    // ساخت شرط where برای نظرسنجی‌های فعال بر اساس بخش کاربر
    const activePollWhere: any = {
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
          OR: [
            { departmentId: null }, // نظرسنجی‌های عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، نظرسنجی‌های آن بخش را هم اضافه کن
    if (session.user.departmentId) {
      activePollWhere.AND[2].OR.push({ departmentId: session.user.departmentId });
    }

    // ساخت شرط where برای نظرسنجی‌های جدید
    const newPollWhere: any = {
      createdAt: { gte: oneDayAgo },
      isActive: true,
      AND: [
        {
          OR: [
            { departmentId: null }, // نظرسنجی‌های عمومی
          ],
        },
      ],
    };

    // اگر کاربر در بخشی است، نظرسنجی‌های جدید آن بخش را هم اضافه کن
    if (session.user.departmentId) {
      newPollWhere.AND[0].OR.push({ departmentId: session.user.departmentId });
    }

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
        where: announcementWhere,
      }),
      prisma.announcement.count({
        where: newAnnouncementWhere,
      }),
      // نظرسنجی‌ها
      prisma.poll.count(),
      prisma.poll.count({
        where: activePollWhere,
      }),
      prisma.poll.count({
        where: newPollWhere,
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

