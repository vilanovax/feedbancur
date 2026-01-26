import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت فیدبک‌های تکمیل شده (فقط ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین می‌تواند این لیست را ببیند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const skip = (page - 1) * limit;

    // شرط‌های فیلتر
    const where: any = {
      status: "COMPLETED",
    };

    // جستجو در عنوان
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // دریافت تعداد کل و لیست فیدبک‌ها
    const [total, feedbacks] = await Promise.all([
      prisma.feedbacks.count({ where }),
      prisma.feedbacks.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          userResponse: true,
          completedAt: true,
          createdAt: true,
          users_feedbacks_userIdTousers: {
            select: {
              id: true,
              name: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        skip,
        take: limit,
      }),
    ]);

    // فرمت‌دهی داده‌ها
    const formattedFeedbacks = feedbacks.map((fb) => ({
      id: fb.id,
      title: fb.title,
      type: fb.type,
      userResponse: fb.userResponse,
      completedAt: fb.completedAt,
      createdAt: fb.createdAt,
      createdBy: fb.users_feedbacks_userIdTousers,
      department: fb.departments,
    }));

    return NextResponse.json({
      data: formattedFeedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching completed feedbacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
