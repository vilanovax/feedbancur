import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت تعداد پیام‌های خوانده نشده
// اگر feedbackIds ارسال شود، تعداد برای هر کدام برگردانده می‌شود
// در غیر این صورت، تعداد کل برگردانده می‌شود
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام‌ها را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const feedbackIdsParam = searchParams.get("feedbackIds");

    // اگر feedbackIds ارسال شده، تعداد برای هر کدام را برگردان (bulk mode)
    if (feedbackIdsParam) {
      const feedbackIds = feedbackIdsParam.split(",").filter(Boolean);

      if (feedbackIds.length === 0) {
        return NextResponse.json({ counts: {} });
      }

      // یک query بهینه برای گرفتن تعداد همه فیدبک‌ها
      const counts = await prisma.messages.groupBy({
        by: ["feedbackId"],
        where: {
          feedbackId: { in: feedbackIds },
          isRead: false,
          senderId: { not: session.user.id },
        },
        _count: {
          id: true,
        },
      });

      // تبدیل به object
      const countsMap: Record<string, number> = {};
      for (const item of counts) {
        countsMap[item.feedbackId] = item._count.id;
      }

      return NextResponse.json({ counts: countsMap });
    }

    // حالت قبلی: تعداد کل پیام‌های خوانده نشده
    const unreadCount = await prisma.messages.count({
      where: {
        isRead: false,
        senderId: { not: session.user.id },
        feedbacks: {
          forwardedToId: { not: null },
        },
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0, counts: {} });
  }
}

