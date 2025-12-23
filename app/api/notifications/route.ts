import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET - دریافت نوتیفیکیشن‌های کاربر
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    let notifications: any[] = [];
    let unreadCount = 0;

    try {
      // ابتدا بررسی کن که آیا جدول وجود دارد یا نه
      try {
        notifications = await prisma.notifications.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
          include: {
            feedbacks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        });

        // تعداد نوتیفیکیشن‌های خوانده نشده
        unreadCount = await prisma.notifications.count({
          where: {
            userId: session.user.id,
            isRead: false,
          },
        });
      } catch (dbError: any) {
        // اگر جدول notifications وجود ندارد، آرایه خالی برگردان
        const errorMessage = dbError?.message || "";
        const errorCode = dbError?.code || "";
        
        if (
          errorCode === "P2021" ||
          errorCode === "P2001" ||
          errorCode === "P2010" ||
          errorMessage.includes("does not exist") ||
          errorMessage.includes("Unknown table") ||
          errorMessage.includes("relation") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("Table") ||
          errorMessage.includes("table")
        ) {
          console.warn("Notifications table does not exist yet, returning empty array");
          return NextResponse.json({
            notifications: [],
            unreadCount: 0,
          });
        }
        throw dbError;
      }
    } catch (innerError: any) {
      // اگر خطای دیگری رخ داد، آن را throw کن تا در catch بیرونی مدیریت شود
      throw innerError;
    }

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    
    // اگر جدول notifications وجود ندارد، آرایه خالی برگردان
    if (
      error?.code === "P2021" ||
      error?.code === "P2001" ||
      error?.message?.includes("does not exist") ||
      error?.message?.includes("Unknown table") ||
      error?.message?.includes("relation") ||
      error?.message?.includes("not found")
    ) {
      console.warn("Notifications table does not exist yet, returning empty array");
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
      });
    }
    
    return NextResponse.json(
      { error: "خطا در دریافت نوتیفیکیشن‌ها", details: error?.message },
      { status: 500 }
    );
  }
}

// POST - ایجاد نوتیفیکیشن جدید
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند نوتیفیکیشن ایجاد کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const notificationSchema = z.object({
      userId: z.string(),
      feedbackId: z.string().optional(),
      title: z.string().min(1),
      content: z.string().min(1),
      type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).optional().default("INFO"),
      redirectUrl: z.string().optional(),
    });

    const data = notificationSchema.parse(body);

    const notification = await prisma.notifications.create({
      data: {
        userId: data.userId,
        feedbackId: data.feedbackId,
        title: data.title,
        content: data.content,
        type: data.type,
        redirectUrl: data.redirectUrl,
      },
      include: {
        feedbacks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد نوتیفیکیشن" },
      { status: 500 }
    );
  }
}

