import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - لیست بازدیدکنندگان یک اعلان با pagination
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند لیست بازدیدکنندگان را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pagination parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const filter = searchParams.get("filter") || "all"; // all, viewed, not_viewed
    const skip = (page - 1) * limit;

    const { id } = await params;

    // بررسی وجود اعلان
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        departments: true,
        users: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // لیست کاربران هدف (کسانی که باید اعلان را ببینند)
    let targetUsersQuery: any = {
      role: { not: "ADMIN" }, // ادمین‌ها جزء target نیستند
    };

    if (announcement.departmentId) {
      // اعلان بخش خاص
      targetUsersQuery.departmentId = announcement.departmentId;
    }

    // ابتدا آمار کلی را محاسبه می‌کنیم (بدون pagination)
    const [totalTarget, totalViewed, viewedUserIds] = await Promise.all([
      prisma.users.count({ where: targetUsersQuery }),
      prisma.announcement_views.count({ where: { announcementId: id } }),
      prisma.announcement_views.findMany({
        where: { announcementId: id },
        select: { userId: true, viewedAt: true },
      }),
    ]);

    const viewersMap = new Map(viewedUserIds.map((v) => [v.userId, v.viewedAt]));

    // اعمال فیلتر بر اساس پارامتر filter
    let filteredQuery = { ...targetUsersQuery };
    if (filter === "viewed") {
      filteredQuery.id = { in: Array.from(viewersMap.keys()) };
    } else if (filter === "not_viewed") {
      filteredQuery.id = { notIn: Array.from(viewersMap.keys()) };
    }

    // دریافت کاربران با pagination
    const [filteredTotal, targetUsers] = await Promise.all([
      prisma.users.count({ where: filteredQuery }),
      prisma.users.findMany({
        where: filteredQuery,
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
          departments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        skip,
        take: limit,
      }),
    ]);

    // ایجاد لیست با status دیده شده/ندیده شده
    const usersWithStatus = targetUsers.map(user => ({
      ...user,
      viewed: viewersMap.has(user.id),
      viewedAt: viewersMap.get(user.id) || null,
    }));

    const stats = {
      totalTarget,
      totalViewed,
      totalNotViewed: totalTarget - totalViewed,
      viewPercentage: totalTarget > 0
        ? Math.round((totalViewed / totalTarget) * 100)
        : 0,
    };

    return NextResponse.json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        priority: announcement.priority,
        createdAt: announcement.createdAt,
        departmentId: announcement.departmentId,
        department: announcement.departments,
        createdBy: announcement.users,
      },
      stats,
      users: usersWithStatus,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
        filter,
      },
    });
  } catch (error) {
    console.error("Error fetching announcement viewers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
