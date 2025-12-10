import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateDepartmentSchema = z.object({
  name: z.string().min(1, "نام بخش الزامی است").optional(),
  description: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  allowDirectFeedback: z.boolean().optional(),
  canCreateAnnouncement: z.boolean().optional(),
  allowedAnnouncementDepartments: z.array(z.string()).optional(),
  canCreatePoll: z.boolean().optional(),
  allowedPollDepartments: z.array(z.string()).optional(),
});

// GET - مشاهده جزئیات یک بخش
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            feedbacks: true,
            tasks: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش بخش
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateDepartmentSchema.parse(body);

    // بررسی وجود بخش
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description && data.description.trim() 
        ? data.description.trim() 
        : null;
    }
    
    if (data.keywords !== undefined) {
      // تبدیل string به array (با split کردن بر اساس ویرگول)
      if (data.keywords === null || data.keywords === '' || data.keywords === undefined) {
        updateData.keywords = [];
      } else if (typeof data.keywords === 'string') {
        const trimmed = data.keywords.trim();
        updateData.keywords = trimmed 
          ? trimmed.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
          : [];
      } else if (Array.isArray(data.keywords)) {
        updateData.keywords = (data.keywords as any[])
          .filter((k: any) => k !== null && k !== undefined && String(k).trim().length > 0)
          .map((k: any) => String(k).trim());
      } else {
        updateData.keywords = [];
      }
    }
    
    if (data.allowDirectFeedback !== undefined) {
      updateData.allowDirectFeedback = Boolean(data.allowDirectFeedback);
    }

    if (data.canCreateAnnouncement !== undefined) {
      updateData.canCreateAnnouncement = Boolean(data.canCreateAnnouncement);
    }

    if (data.allowedAnnouncementDepartments !== undefined) {
      updateData.allowedAnnouncementDepartments = Array.isArray(data.allowedAnnouncementDepartments)
        ? data.allowedAnnouncementDepartments
        : [];
    }

    if (data.canCreatePoll !== undefined) {
      updateData.canCreatePoll = Boolean(data.canCreatePoll);
    }

    if (data.allowedPollDepartments !== undefined) {
      updateData.allowedPollDepartments = Array.isArray(data.allowedPollDepartments)
        ? data.allowedPollDepartments
        : [];
    }

    // بررسی اینکه آیا داده‌ای برای به‌روزرسانی وجود دارد
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "هیچ داده‌ای برای به‌روزرسانی ارسال نشده است" },
        { status: 400 }
      );
    }

    // بروزرسانی بخش
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating department:", error);
    return NextResponse.json(
      { 
        error: "خطا در بروزرسانی بخش",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف بخش
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند بخش را حذف کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند بخش‌ها را حذف کند" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // بررسی وجود بخش
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            feedbacks: true,
            tasks: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا بخش دارای کاربر، فیدبک یا تسک است
    if (department._count.users > 0) {
      return NextResponse.json(
        {
          error: `این بخش دارای ${department._count.users} کاربر است. ابتدا کاربران را حذف یا انتقال دهید.`,
        },
        { status: 400 }
      );
    }

    if (department._count.feedbacks > 0 || department._count.tasks > 0) {
      return NextResponse.json(
        {
          error: "این بخش دارای فیدبک یا تسک است. نمی‌توان آن را حذف کرد.",
        },
        { status: 400 }
      );
    }

    // حذف بخش
    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "بخش با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "خطا در حذف بخش" },
      { status: 500 }
    );
  }
}
