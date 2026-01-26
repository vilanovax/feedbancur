import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const tasks: any[] = [];

    // 1. فیدبک‌های DEFERRED با تاریخ سررسید نزدیک
    const deferredFeedbacks = await prisma.feedbacks.findMany({
      where: {
        status: "DEFERRED",
        deletedAt: null,
        // می‌توانید یک فیلد dueDate به مدل Feedback اضافه کنید
        // اما فعلاً از createdAt استفاده می‌کنیم
      },
      take: 5,
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    deferredFeedbacks.forEach((feedback) => {
      // فرض کنیم DEFERRED ها باید ظرف 7 روز پیگیری شوند
      const dueDate = new Date(feedback.createdAt);
      dueDate.setDate(dueDate.getDate() + 7);

      if (dueDate <= in7Days) {
        tasks.push({
          id: `feedback-${feedback.id}`,
          title: feedback.title,
          type: "feedback",
          dueDate,
          url: `/feedback`,
        });
      }
    });

    // 2. نظرسنجی‌هایی که به زودی بسته می‌شوند
    const closingPolls = await prisma.polls.findMany({
      where: {
        isActive: true,
        closedAt: {
          gte: now,
          lte: in7Days,
        },
      },
      take: 5,
      orderBy: {
        closedAt: "asc",
      },
      select: {
        id: true,
        title: true,
        closedAt: true,
      },
    });

    closingPolls.forEach((poll) => {
      if (poll.closedAt) {
        tasks.push({
          id: `poll-${poll.id}`,
          title: poll.title,
          type: "poll",
          dueDate: poll.closedAt,
          url: `/polls`,
        });
      }
    });

    // 3. اعلان‌هایی که باید منتشر شوند (scheduledAt در آینده نزدیک)
    const scheduledAnnouncements = await prisma.announcements.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: in7Days,
        },
      },
      take: 5,
      orderBy: {
        scheduledAt: "asc",
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
      },
    });

    scheduledAnnouncements.forEach((announcement) => {
      if (announcement.scheduledAt) {
        tasks.push({
          id: `announcement-${announcement.id}`,
          title: announcement.title,
          type: "announcement",
          dueDate: announcement.scheduledAt,
          url: `/announcements`,
        });
      }
    });

    // مرتب‌سازی بر اساس نزدیک‌ترین تاریخ
    tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // محدود کردن به 10 تسک
    const limitedTasks = tasks.slice(0, 10);

    return NextResponse.json(limitedTasks, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("Error fetching upcoming tasks:", error);

    // در صورت خطا، آرایه خالی برگردان
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}
