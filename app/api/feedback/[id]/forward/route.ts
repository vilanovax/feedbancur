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
    console.log("Forward request - session:", JSON.stringify(session?.user, null, 2));

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.id) {
      console.error("Session user has no id:", session.user);
      return NextResponse.json({ error: "Invalid session - missing user id" }, { status: 401 });
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
    // اطمینان از اینکه content خالی نباشد
    const feedbackContent = feedback.content || "بدون توضیحات";
    const taskDescription = data.notes
      ? `${feedbackContent}\n\n---\nیادداشت ارجاع‌دهنده: ${data.notes}`
      : feedbackContent;

    // تعیین departmentId - باید حتماً مقدار داشته باشد
    const taskDepartmentId = targetManager.departmentId || feedback.departmentId;
    if (!taskDepartmentId) {
      console.error("No department ID available", {
        targetManagerDepartmentId: targetManager.departmentId,
        feedbackDepartmentId: feedback.departmentId,
      });
      return NextResponse.json(
        { error: "بخش برای ایجاد تسک مشخص نشده است" },
        { status: 400 }
      );
    }

    console.log("Creating task with:", {
      title: `ارجاع: ${feedback.title}`,
      descriptionLength: taskDescription.length,
      status: "PENDING",
      priority: feedback.type === "CRITICAL" ? "HIGH" : "MEDIUM",
      feedbackId: feedback.id,
      departmentId: taskDepartmentId,
      createdById: session.user.id,
    });

    // ایجاد تسک
    let task;
    try {
      task = await prisma.task.create({
        data: {
          title: `ارجاع: ${feedback.title}`,
          description: taskDescription,
          // status از default استفاده می‌کند (PENDING)
          priority: feedback.type === "CRITICAL" ? "HIGH" : "MEDIUM",
          feedbackId: feedback.id,
          departmentId: taskDepartmentId,
          createdById: session.user.id,
        },
        include: {
          department: true,
          feedback: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              mobile: true,
              role: true,
            },
          },
        },
      });
      console.log("Task created successfully:", task.id);
    } catch (taskError: any) {
      console.error("Error creating task:", taskError);
      console.error("Task error message:", taskError.message);
      console.error("Task error code:", taskError.code);
      console.error("Task error meta:", taskError.meta);
      return NextResponse.json(
        { 
          error: "خطا در ایجاد تسک",
          details: process.env.NODE_ENV === 'development' ? taskError.message : undefined
        },
        { status: 500 }
      );
    }

    // تخصیص تسک به مدیر
    try {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: data.managerId,
        },
      });
      console.log("Task assignment created successfully");
    } catch (assignmentError: any) {
      console.error("Error creating task assignment:", assignmentError);
      console.error("Assignment error message:", assignmentError.message);
      console.error("Assignment error code:", assignmentError.code);
      // حذف task در صورت خطا
      try {
        await prisma.task.delete({ where: { id: task.id } });
      } catch (deleteError) {
        console.error("Error deleting task:", deleteError);
      }
      return NextResponse.json(
        { 
          error: "خطا در اختصاص تسک به مدیر",
          details: process.env.NODE_ENV === 'development' ? assignmentError.message : undefined
        },
        { status: 500 }
      );
    }

    // خواندن task با assignedTo
    const taskWithAssignments = await prisma.task.findUnique({
      where: { id: task.id },
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
        createdBy: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
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
      task: taskWithAssignments,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error forwarding feedback:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: "خطا در ارجاع فیدبک",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
