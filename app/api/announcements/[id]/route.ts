import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").optional(),
  content: z.string().min(1, "محتوا الزامی است").optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
});

// GET - مشاهده جزئیات یک اعلان
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
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

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی
    const canView =
      session.user.role === "ADMIN" ||
      announcement.departmentId === null ||
      announcement.departmentId === session.user.departmentId ||
      announcement.createdById === session.user.id;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش اعلان
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateAnnouncementSchema.parse(body);

    // بررسی وجود اعلان
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی ویرایش
    const canEdit =
      session.user.role === "ADMIN" ||
      existingAnnouncement.createdById === session.user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید اعلانات خودتان را ویرایش کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند اعلان را به بخش دیگری منتقل کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId !== undefined &&
      data.departmentId !== null &&
      data.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما نمی‌توانید اعلان را به بخش دیگری منتقل کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند اعلان عمومی (برای همه) ایجاد کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId === null
    ) {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند اعلان عمومی ایجاد کند" },
        { status: 403 }
      );
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.departmentId !== undefined) {
      updateData.departmentId = data.departmentId;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
      // اگر اعلان فعال شد و قبلاً منتشر نشده، زمان انتشار را ثبت کن
      if (data.isActive && !existingAnnouncement.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    // بروزرسانی اعلان
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
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

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی اعلان" },
      { status: 500 }
    );
  }
}

// DELETE - حذف اعلان
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // بررسی وجود اعلان
    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی حذف
    const canDelete =
      session.user.role === "ADMIN" ||
      announcement.createdById === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید اعلانات خودتان را حذف کنید" },
        { status: 403 }
      );
    }

    // حذف اعلان
    await prisma.announcement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "اعلان با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "خطا در حذف اعلان" },
      { status: 500 }
    );
  }
}
