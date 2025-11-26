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
    const feedbacksWithMessages = await prisma.feedback.findMany({
      where: {
        forwardedToId: { not: null },
        messages: {
          some: {},
        },
      },
      include: {
        department: true,
        user: true,
        forwardedTo: true,
        messages: {
          include: {
            sender: {
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

    // محاسبه تعداد پیام‌های خوانده نشده برای هر فیدبک
    const feedbacksWithUnreadCount = await Promise.all(
      feedbacksWithMessages.map(async (feedback) => {
        const unreadCount = await prisma.message.count({
          where: {
            feedbackId: feedback.id,
            isRead: false,
            senderId: { not: session.user.id },
          },
        });

        return {
          ...feedback,
          unreadCount,
        };
      })
    );

    return NextResponse.json(feedbacksWithUnreadCount);
  } catch (error) {
    console.error("Error fetching feedbacks with chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

