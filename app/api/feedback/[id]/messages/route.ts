import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1, "متن پیام الزامی است"),
});

// GET - دریافت پیام‌های یک فیدبک
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام‌ها را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      include: {
        forwardedTo: true,
        department: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: فقط برای فیدبک‌های ارجاع شده
    if (!feedback.forwardedToId) {
      return NextResponse.json(
        { error: "این فیدبک ارجاع نشده است" },
        { status: 403 }
      );
    }

    // ADMIN می‌تواند همه فیدبک‌های ارجاع شده را ببیند
    // MANAGER فقط فیدبک‌های ارجاع شده به خودش را می‌بیند
    const hasAccess =
      session.user.role === "ADMIN" ||
      feedback.forwardedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت پیام‌ها
    const messages = await prisma.message.findMany({
      where: { feedbackId: resolvedParams.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // علامت‌گذاری پیام‌های خوانده نشده به عنوان خوانده شده
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.senderId !== session.user.id
    );

    if (unreadMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map((msg) => msg.id) },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // به‌روزرسانی isRead در پاسخ
      messages.forEach((msg) => {
        if (unreadMessages.some((um) => um.id === msg.id)) {
          msg.isRead = true;
          msg.readAt = new Date();
        }
      });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - ارسال پیام جدید
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام ارسال کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const body = await req.json();
    const data = messageSchema.parse(body);

    // بررسی وجود فیدبک و دسترسی
    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      include: {
        forwardedTo: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: فقط برای فیدبک‌های ارجاع شده
    if (!feedback.forwardedToId) {
      return NextResponse.json(
        { error: "این فیدبک ارجاع نشده است" },
        { status: 403 }
      );
    }

    // ADMIN می‌تواند به همه فیدبک‌های ارجاع شده پیام بفرستد
    // MANAGER فقط به فیدبک‌های ارجاع شده به خودش می‌تواند پیام بفرستد
    const hasAccess =
      session.user.role === "ADMIN" ||
      feedback.forwardedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ایجاد پیام
    const message = await prisma.message.create({
      data: {
        feedbackId: resolvedParams.id,
        senderId: session.user.id,
        content: data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating message:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

