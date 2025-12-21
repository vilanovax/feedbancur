import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - آرشیو گروهی فیدبک‌ها
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند آرشیو گروهی انجام دهد
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "لیست فیدبک‌ها معتبر نیست" },
        { status: 400 }
      );
    }

    // آرشیو کردن - تغییر status به ARCHIVED
    const result = await prisma.feedbacks.updateMany({
      where: {
        id: { in: ids },
        status: { not: "ARCHIVED" }, // فقط فیدبک‌های آرشیو نشده
        deletedAt: null, // فیدبک‌های حذف نشده
      },
      data: {
        status: "ARCHIVED",
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} فیدبک با موفقیت آرشیو شد`,
    });
  } catch (error) {
    console.error("Error bulk archiving feedbacks:", error);
    return NextResponse.json(
      {
        error: "خطا در آرشیو گروهی فیدبک‌ها",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
