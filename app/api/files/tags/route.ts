import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/files/tags
 * لیست تمام تگ‌های استفاده شده با تعداد استفاده
 * Query params: projectId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // بررسی دسترسی
    if (!projectId) {
      // تگ‌های سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    } else {
      // تگ‌های پروژه - بررسی عضویت
      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "شما به این پروژه دسترسی ندارید" },
            { status: 403 }
          );
        }
      }
    }

    // دریافت فایل‌های دارای تگ
    const files = await prisma.shared_files.findMany({
      where: {
        projectId: projectId || null,
        deletedAt: null,
        tags: {
          not: null,
        },
      },
      select: {
        tags: true,
      },
    });

    // استخراج و شمارش تگ‌ها
    const tagCountMap: Record<string, number> = {};

    for (const file of files) {
      if (file.tags) {
        try {
          const tags = JSON.parse(file.tags) as string[];
          for (const tag of tags) {
            if (tag && tag.trim()) {
              const trimmedTag = tag.trim();
              tagCountMap[trimmedTag] = (tagCountMap[trimmedTag] || 0) + 1;
            }
          }
        } catch {
          // اگر parse نشد، رد کن
        }
      }
    }

    // تبدیل به آرایه و مرتب‌سازی بر اساس تعداد استفاده
    const tagList = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ tags: tagList });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تگ‌ها" },
      { status: 500 }
    );
  }
}
