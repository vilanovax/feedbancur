import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const archiveSchema = z.object({
  adminNotes: z.string().optional(),
  userResponse: z.string().optional(),
});

// POST - آرشیو کردن فیدبک
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند فیدبک را آرشیو کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = archiveSchema.parse(body);

    // بررسی وجود فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط می‌تواند فیدبک‌های بخش خودش را آرشیو کند
    if (
      session.user.role === "MANAGER" &&
      feedback.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید فیدبک‌های بخش خود را آرشیو کنید" },
        { status: 403 }
      );
    }

    // آرشیو کردن فیدبک
    const archivedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        adminNotes: data.adminNotes,
        userResponse: data.userResponse,
        completedById: session.user.id,
        completedAt: new Date(),
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
        users_feedbacks_completedByIdTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت آرشیو شد",
      feedback: archivedFeedback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error archiving feedback:", error);
    return NextResponse.json(
      { error: "خطا در آرشیو کردن فیدبک" },
      { status: 500 }
    );
  }
}
