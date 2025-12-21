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

    // Soft delete
    let deletedFeedback;
    try {
      deletedFeedback = await (prisma.feedbacks.update as any)({
        where: { id },
        data: {
          deletedAt: new Date(),
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
        },
      });
    } catch (dbError: any) {
      console.error("Error updating feedback with deletedAt:", dbError);
      console.error("Error code:", dbError?.code);
      console.error("Error message:", dbError?.message);
      
      // اگر فیلد deletedAt وجود نداشت، از status استفاده کن
      if (
        dbError?.message?.includes("deletedAt") ||
        dbError?.code === "P2009" ||
        dbError?.code === "P2011" ||
        dbError?.message?.includes("Unknown field") ||
        dbError?.message?.includes("Unknown arg") ||
        dbError?.message?.includes("Unknown column")
      ) {
        console.warn("deletedAt field not found, using status instead");
        // استفاده از status برای حذف (آرشیو کردن)
        deletedFeedback = await prisma.feedbacks.update({
          where: { id },
          data: {
            status: "ARCHIVED",
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
          },
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت به سطل آشغال منتقل شد",
      feedback: deletedFeedback,
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

