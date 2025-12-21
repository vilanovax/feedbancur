import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت تعداد کل پیام‌های خوانده نشده برای ادمین
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند تعداد کل پیام‌های خوانده نشده را ببیند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // شمارش پیام‌های خوانده نشده (پیام‌هایی که توسط ادمین ارسال نشده‌اند)
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
    return NextResponse.json({ count: 0 });
  }
}

