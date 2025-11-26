import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت تعداد پیام‌های خوانده نشده برای یک فیدبک
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند تعداد پیام‌های خوانده نشده را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    if (!feedback.forwardedToId) {
      return NextResponse.json({ count: 0 });
    }

    const hasAccess =
      session.user.role === "ADMIN" ||
      feedback.forwardedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ count: 0 });
    }

    // شمارش پیام‌های خوانده نشده (پیام‌هایی که توسط کاربر فعلی ارسال نشده‌اند)
    const unreadCount = await prisma.message.count({
      where: {
        feedbackId: resolvedParams.id,
        isRead: false,
        senderId: { not: session.user.id },
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ count: 0 });
  }
}

