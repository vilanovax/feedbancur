import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - بازگرداندن فیدبک از سطل آشغال
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند فیدبک را بازگرداند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // بررسی وجود فیدبک
    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه حذف شده باشد
    if (!feedback.deletedAt) {
      return NextResponse.json(
        { error: "این فیدبک حذف نشده است" },
        { status: 400 }
      );
    }

    // بازگرداندن فیدبک
    const restoredFeedback = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        forwardedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت بازگردانده شد",
      feedback: restoredFeedback,
    });
  } catch (error) {
    console.error("Error restoring feedback:", error);
    return NextResponse.json(
      { error: "خطا در بازگرداندن فیدبک" },
      { status: 500 }
    );
  }
}

