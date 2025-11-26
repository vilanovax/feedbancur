import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - حذف کامل فیدبک از سطل آشغال
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // بررسی وجود فیدبک
    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: {
        task: true,
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

    // حذف تسک مرتبط اگر وجود داشته باشد
    if (feedback.task) {
      await prisma.task.delete({
        where: { id: feedback.task.id },
      });
    }

    // حذف کامل فیدبک
    await prisma.feedback.delete({
      where: { id: params.id },
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

