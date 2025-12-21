import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - حذف کامل فیدبک از سطل آشغال
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند فیدبک را به طور کامل حذف کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // بررسی وجود فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      include: {
        tasks: true,
        messages: true,
        checklist_items: true,
        notifications: true,
      },
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
        { error: "این فیدبک در سطل آشغال نیست" },
        { status: 400 }
      );
    }

    // حذف رکوردهای وابسته به ترتیب
    // 1. حذف نوتیفیکیشن‌ها
    await prisma.notifications.deleteMany({
      where: { feedbackId: id },
    });

    // 2. حذف پیام‌ها
    await prisma.messages.deleteMany({
      where: { feedbackId: id },
    });

    // 3. حذف چک‌لیست آیتم‌ها
    await prisma.checklist_items.deleteMany({
      where: { feedbackId: id },
    });

    // 4. حذف تسک مرتبط اگر وجود داشته باشد
    if (feedback.tasks) {
      // اول حذف task_assignments و task_comments
      await prisma.task_assignments.deleteMany({
        where: { taskId: feedback.tasks.id },
      });
      await prisma.task_comments.deleteMany({
        where: { taskId: feedback.tasks.id },
      });
      await prisma.tasks.delete({
        where: { id: feedback.tasks.id },
      });
    }

    // 5. حذف کامل فیدبک
    await prisma.feedbacks.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error permanently deleting feedback:", error);
    return NextResponse.json(
      { error: "خطا در حذف کامل فیدبک" },
      { status: 500 }
    );
  }
}

