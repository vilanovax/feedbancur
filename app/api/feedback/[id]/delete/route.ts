import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - حذف فیدبک (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند فیدبک را حذف کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // بررسی وجود فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه قبلاً حذف نشده باشد (اگر فیلد deletedAt وجود داشته باشد)
    const feedbackAny = feedback as any;
    if (feedbackAny.deletedAt) {
      return NextResponse.json(
        { error: "این فیدبک قبلاً حذف شده است" },
        { status: 400 }
      );
    }

    // Soft delete - استفاده از نام‌های صحیح relation در schema
    const deletedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
      include: {
        users_feedbacks_userIdTousers: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform to frontend format
    const responseFeedback = {
      ...deletedFeedback,
      user: deletedFeedback.users_feedbacks_userIdTousers,
      department: deletedFeedback.departments,
      users_feedbacks_userIdTousers: undefined,
      departments: undefined,
    };

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت به سطل آشغال منتقل شد",
      feedback: responseFeedback,
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { 
        error: "خطا در حذف فیدبک",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

