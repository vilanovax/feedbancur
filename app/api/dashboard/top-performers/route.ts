import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Cache برای top performers - 5 دقیقه
const performersCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // بررسی cache
    const cacheKey = "top-performers";
    const now = Date.now();
    const cached = performersCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // دریافت کاربران با بیشترین فیدبک تکمیل شده
    const usersWithCompletedFeedbacks = await prisma.feedbacks.groupBy({
      by: ["assignedTo"],
      where: {
        status: "COMPLETED",
        deletedAt: null,
        assignedTo: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // دریافت اطلاعات کامل کاربران و محاسبه متریک‌ها
    const topPerformers = await Promise.all(
      usersWithCompletedFeedbacks.map(async (item) => {
        if (!item.assignedTo) return null;

        // دریافت اطلاعات کاربر
        const user = await prisma.users.findUnique({
          where: { id: item.assignedTo },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        });

        if (!user) return null;

        // محاسبه میانگین امتیاز
        const feedbacksWithRating = await prisma.feedbacks.findMany({
          where: {
            assignedTo: item.assignedTo,
            status: "COMPLETED",
            deletedAt: null,
            rating: {
              not: null,
            },
          },
          select: {
            rating: true,
          },
        });

        const avgRating =
          feedbacksWithRating.length > 0
            ? feedbacksWithRating.reduce((sum, f) => sum + (f.rating || 0), 0) /
              feedbacksWithRating.length
            : 0;

        // محاسبه میانگین زمان پاسخ (ساعت)
        const feedbacksWithResponseTime = await prisma.feedbacks.findMany({
          where: {
            assignedTo: item.assignedTo,
            status: "COMPLETED",
            deletedAt: null,
            assignedAt: {
              not: null,
            },
            updatedAt: {
              not: null,
            },
          },
          select: {
            assignedAt: true,
            updatedAt: true,
          },
        });

        let avgResponseHours = 0;
        if (feedbacksWithResponseTime.length > 0) {
          const totalHours = feedbacksWithResponseTime.reduce((sum, f) => {
            if (f.assignedAt && f.updatedAt) {
              const hours =
                (new Date(f.updatedAt).getTime() -
                  new Date(f.assignedAt).getTime()) /
                (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0);
          avgResponseHours = totalHours / feedbacksWithResponseTime.length;
        }

        return {
          id: user.id,
          name: user.name || user.email,
          avatar: user.avatar,
          completedCount: item._count.id,
          avgRating: parseFloat(avgRating.toFixed(1)),
          avgResponseHours: parseFloat(avgResponseHours.toFixed(1)),
        };
      })
    );

    // حذف null ها و محدود کردن به 5 نفر
    const filteredPerformers = topPerformers
      .filter((p) => p !== null)
      .slice(0, 5);

    // ذخیره در cache
    performersCache.set(cacheKey, {
      data: filteredPerformers,
      timestamp: now,
    });

    // پاک کردن cache های قدیمی
    const tenMinutesAgo = now - 10 * 60 * 1000;
    for (const [key, value] of performersCache.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        performersCache.delete(key);
      }
    }

    return NextResponse.json(filteredPerformers, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Error fetching top performers:", error);

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
