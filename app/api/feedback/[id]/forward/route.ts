import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const forwardSchema = z.object({
  managerId: z.string().min(1, "مدیر مقصد الزامی است"),
  notes: z.string().optional(),
});

// POST - ارجاع فیدبک به مدیر
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند فیدبک ارجاع دهند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = forwardSchema.parse(body);

    // بررسی وجود فیدبک
    const feedback = await prisma.feedback.findUnique({
      where: { id },
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

    // بررسی وجود مدیر مقصد
    const targetManager = await prisma.user.findUnique({
      where: { id: data.managerId },
      include: {
        department: true,
      },
    });

    if (!targetManager) {
      return NextResponse.json(
        { error: "مدیر مقصد یافت نشد" },
        { status: 404 }
      );
    }

    if (targetManager.role !== "MANAGER" && targetManager.role !== "ADMIN") {
      return NextResponse.json(
        { error: "کاربر انتخاب شده مدیر نیست" },
        { status: 400 }
      );
    }

    // MANAGER فقط می‌تواند به مدیران بخش خودش ارجاع دهد
    if (
      session.user.role === "MANAGER" &&
      targetManager.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید به مدیران بخش خود ارجاع دهید" },
        { status: 403 }
      );
    }

    // بررسی اینکه آیا قبلا برای این فیدبک تسک ایجاد شده است
    const existingTask = await prisma.task.findUnique({
      where: { feedbackId: id },
    });

    if (existingTask) {
      return NextResponse.json(
        { error: "برای این فیدبک قبلا تسک ایجاد شده است" },
        { status: 400 }
      );
    }

    // ایجاد تسک از روی فیدبک و ارجاع به مدیر
    const taskDescription = data.notes
      ? `${feedback.content}\n\n---\nیادداشت ارجاع‌دهنده: ${data.notes}`
      : feedback.content;

    const task = await prisma.task.create({
      data: {
        title: `ارجاع: ${feedback.title}`,
        description: taskDescription,
        status: "PENDING",
        priority: feedback.type === "CRITICAL" ? "HIGH" : "MEDIUM",
        feedbackId: feedback.id,
        departmentId: targetManager.departmentId || feedback.departmentId,
        createdById: session.user.id,
        assignedTo: {
          create: {
            userId: data.managerId,
          },
        },
      },
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                role: true,
              },
            },
          },
        },
        department: true,
        feedback: true,
      },
    });

    // بروزرسانی وضعیت فیدبک به REVIEWED و ذخیره اطلاعات ارجاع
    await prisma.feedback.update({
      where: { id },
      data: {
        status: "REVIEWED",
        forwardedToId: data.managerId,
        forwardedAt: new Date(),
      },
    });

    // اگر توضیحات ارجاع وجود داشت، آن را به عنوان پیام چت ذخیره کن
    if (data.notes && data.notes.trim()) {
      await prisma.message.create({
        data: {
          feedbackId: id,
          senderId: session.user.id,
          content: data.notes.trim(),
          isRead: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "فیدبک با موفقیت ارجاع داده شد",
      task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error forwarding feedback:", error);
    return NextResponse.json(
      { error: "خطا در ارجاع فیدبک" },
      { status: 500 }
    );
  }
}
