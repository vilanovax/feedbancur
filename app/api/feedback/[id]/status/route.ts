import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"]),
  userResponse: z.string().optional(), // برای وضعیت COMPLETED
});

// PATCH - تغییر وضعیت فیدبک
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند وضعیت را تغییر دهند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = statusUpdateSchema.parse(body);

    // بررسی وجود فیدبک
    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        user: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط می‌تواند فیدبک‌های بخش خودش را تغییر دهد
    if (
      session.user.role === "MANAGER" &&
      feedback.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید وضعیت فیدبک‌های بخش خود را تغییر دهید" },
        { status: 403 }
      );
    }

    // داده‌های بروزرسانی
    const updateData: any = {
      status: data.status,
    };

    // برای وضعیت COMPLETED
    if (data.status === "COMPLETED") {
      updateData.completedById = session.user.id;
      updateData.completedAt = new Date();
      if (data.userResponse) {
        updateData.userResponse = data.userResponse;
      }
    }

    // بروزرسانی فیدبک
    const updatedFeedback = await prisma.feedback.update({
      where: { id: params.id },
      data: updateData,
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
        completedBy: {
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "وضعیت فیدبک با موفقیت تغییر کرد",
      feedback: updatedFeedback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating feedback status:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت فیدبک" },
      { status: 500 }
    );
  }
}
