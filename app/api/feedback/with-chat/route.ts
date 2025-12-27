import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت فیدبک‌هایی که چت دارند
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند فیدبک‌های دارای چت را ببیند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت فیدبک‌هایی که حداقل یک پیام دارند
    const feedbacksWithMessages = await prisma.feedbacks.findMany({
      where: {
        forwardedToId: { not: null },
        messages: {
          some: {},
        },
      },
      include: {
        departments: {
          select: {
            id: true,
            name: true,
            allowDirectFeedback: true,
            managerId: true,
          },
        },
        users_feedbacks_userIdTousers: true,
        users_feedbacks_forwardedToIdTousers: true,
        messages: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1, // فقط آخرین پیام
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // جمع‌آوری managerId های منحصر به فرد
    const managerIds = new Set<string>();
    const feedbackIds: string[] = [];
    feedbacksWithMessages.forEach((feedback: any) => {
      feedbackIds.push(feedback.id);
      if (feedback.departments?.managerId) {
        managerIds.add(feedback.departments.managerId);
      }
    });

    // دریافت اطلاعات مدیران و تعداد پیام‌های خوانده نشده با یک کوئری واحد
    const [managers, unreadCounts] = await Promise.all([
      managerIds.size > 0
        ? prisma.users.findMany({
            where: {
              id: { in: Array.from(managerIds) },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [],
      // کوئری واحد برای تعداد پیام‌های خوانده نشده همه فیدبک‌ها (بجای N+1)
      prisma.messages.groupBy({
        by: ["feedbackId"],
        where: {
          feedbackId: { in: feedbackIds },
          isRead: false,
          senderId: { not: session.user.id },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // ایجاد map برای دسترسی سریع به مدیر و تعداد خوانده نشده
    const managerMap = new Map(managers.map(m => [m.id, m]));
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.feedbackId, item._count.id])
    );

    // تبدیل به فرمت frontend (بدون N+1)
    const feedbacksWithUnreadCount = feedbacksWithMessages.map((feedback: any) => {
      // تبدیل پیام‌ها به فرمت frontend (users → sender)
      const messagesWithSender = feedback.messages.map((msg: any) => ({
        ...msg,
        sender: msg.users,
        users: undefined,
      }));

      const department = feedback.departments ? {
        ...feedback.departments,
        manager: feedback.departments.managerId
          ? managerMap.get(feedback.departments.managerId) || null
          : null,
      } : null;

      return {
        ...feedback,
        user: feedback.users_feedbacks_userIdTousers,
        department: department,
        forwardedTo: feedback.users_feedbacks_forwardedToIdTousers,
        messages: messagesWithSender,
        users_feedbacks_userIdTousers: undefined,
        departments: undefined,
        users_feedbacks_forwardedToIdTousers: undefined,
        unreadCount: unreadCountMap.get(feedback.id) || 0,
      };
    });

    return NextResponse.json(feedbacksWithUnreadCount);
  } catch (error) {
    console.error("Error fetching feedbacks with chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

