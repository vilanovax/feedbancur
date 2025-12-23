import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - لغو ارجاع فیدبک
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند ارجاع را لغو کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // بررسی وجود فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            task_assignments: true,
          },
        },
        users_feedbacks_forwardedToIdTousers: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه فیدبک ارجاع شده باشد
    if (!feedback.forwardedToId) {
      return NextResponse.json(
        { error: "این فیدبک ارجاع نشده است" },
        { status: 400 }
      );
    }

    // MANAGER فقط می‌تواند ارجاعی که خودش انجام داده را لغو کند
    if (session.user.role === "MANAGER") {
      if (feedback.departmentId !== session.user.departmentId) {
        return NextResponse.json(
          { error: "شما فقط می‌توانید ارجاع‌های بخش خود را لغو کنید" },
          { status: 403 }
        );
      }
    }

    // بررسی اینکه تسک مرتبط شروع نشده باشد
    if (feedback.tasks) {
      if (feedback.tasks.status !== "PENDING") {
        return NextResponse.json(
          { error: "امکان لغو ارجاع وجود ندارد. تسک مرتبط در حال انجام است" },
          { status: 400 }
        );
      }

      // حذف تسک
      await prisma.tasks.delete({
        where: { id: feedback.tasks.id },
      });
    }

    // لغو ارجاع و بازگشت وضعیت به PENDING
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        status: "PENDING",
        forwardedToId: null,
        forwardedAt: null,
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

    return NextResponse.json({
      success: true,
      message: "ارجاع فیدبک با موفقیت لغو شد",
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("Error canceling forward:", error);
    return NextResponse.json(
      { error: "خطا در لغو ارجاع" },
      { status: 500 }
    );
  }
}
