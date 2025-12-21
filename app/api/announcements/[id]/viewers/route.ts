import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - لیست بازدیدکنندگان یک اعلان
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

    const { id } = await params;

    // بررسی وجود اعلان
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        department: true,
        createdBy: {
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

    const targetUsers = await prisma.users.findMany({
      where: targetUsersQuery,
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // لیست بازدیدکنندگان
    const views = await prisma.announcementView.findMany({
      where: {
        announcementId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
    });

    // ایجاد لیست کامل با status دیده شده/ندیده شده
    const viewersMap = new Map(views.map(v => [v.userId, v]));

    const usersWithStatus = targetUsers.map(user => ({
      ...user,
      viewed: viewersMap.has(user.id),
      viewedAt: viewersMap.get(user.id)?.viewedAt || null,
    }));

    const stats = {
      totalTarget: targetUsers.length,
      totalViewed: views.length,
      totalNotViewed: targetUsers.length - views.length,
      viewPercentage: targetUsers.length > 0
        ? Math.round((views.length / targetUsers.length) * 100)
        : 0,
    };

    return NextResponse.json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        priority: announcement.priority,
        createdAt: announcement.createdAt,
        departmentId: announcement.departmentId,
        department: announcement.department,
        createdBy: announcement.createdBy,
      },
      stats,
      users: usersWithStatus,
    });
  } catch (error) {
    console.error("Error fetching announcement viewers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
