import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateUserSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست").optional(),
  name: z.string().min(1, "نام الزامی است").optional(),
  email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  role: z.enum(["MANAGER", "EMPLOYEE"]).optional(),
  departmentId: z.string().min(1, "انتخاب بخش الزامی است").optional(),
  password: z.string().min(6, "رمز عبور حداقل 6 کاراکتر باید باشد").optional(),
  isActive: z.boolean().optional(),
  statusId: z.string().nullable().optional(),
});

// GET - مشاهده جزئیات یک کاربر
export async function GET(
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
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        mobile: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        statusId: true,
        status: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط کاربران بخش خودش را می‌بیند
    if (
      session.user.role === "MANAGER" &&
      user.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش کاربر
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
    const data = updateUserSchema.parse(body);

    // بررسی وجود کاربر
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط کاربران بخش خودش را می‌تواند ویرایش کند
    if (
      session.user.role === "MANAGER" &&
      existingUser.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید کاربران بخش خودتان را ویرایش کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند نقش را تغییر دهد
    if (session.user.role === "MANAGER" && data.role) {
      return NextResponse.json(
        { error: "شما نمی‌توانید نقش کاربران را تغییر دهید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند کاربر را به بخش دیگری منتقل کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId &&
      data.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما نمی‌توانید کاربر را به بخش دیگری منتقل کنید" },
        { status: 403 }
      );
    }

    // بررسی تکراری نبودن شماره موبایل
    if (data.mobile && data.mobile !== existingUser.mobile) {
      const duplicateUser = await prisma.users.findUnique({
        where: { mobile: data.mobile },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: "این شماره موبایل قبلاً ثبت شده است" },
          { status: 400 }
        );
      }
    }

    // بررسی وجود بخش
    if (data.departmentId) {
      const department = await prisma.departments.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "بخش مورد نظر یافت نشد" },
          { status: 404 }
        );
      }
    }

    // بررسی صحت statusId (اگر ارسال شده باشد)
    if (data.statusId !== undefined) {
      if (data.statusId === null) {
        // حذف استتوس کاربر
        // هیچ بررسی لازم نیست
      } else {
        const status = await prisma.userStatus.findUnique({
          where: { id: data.statusId },
        });

        if (!status) {
          return NextResponse.json(
            { error: "استتوس انتخابی یافت نشد" },
            { status: 400 }
          );
        }

        if (!status.isActive) {
          return NextResponse.json(
            { error: "این استتوس غیرفعال است" },
            { status: 400 }
          );
        }

        // بررسی اینکه آیا کاربر می‌تواند از این استتوس استفاده کند
        if (!status.allowedRoles.includes(existingUser.role)) {
          return NextResponse.json(
            { error: "این استتوس برای نقش این کاربر مجاز نیست" },
            { status: 400 }
          );
        }
      }
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {};

    if (data.mobile) updateData.mobile = data.mobile;
    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.role) updateData.role = data.role;
    if (data.departmentId) updateData.departmentId = data.departmentId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.statusId !== undefined) updateData.statusId = data.statusId;

    // اگر رمز عبور جدید ارسال شده، hash کن
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // بروزرسانی کاربر
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        mobile: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        statusId: true,
        status: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // بررسی خطای تکراری بودن شماره موبایل از Prisma
    if (error?.code === "P2002" && error?.meta?.target?.includes("mobile")) {
      return NextResponse.json(
        { error: "این شماره موبایل قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { 
        error: "خطا در بروزرسانی کاربر",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - حذف کاربر
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند کاربر را حذف کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند کاربران را حذف کند" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // بررسی وجود کاربر
    const user = await prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // جلوگیری از حذف خودش
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "شما نمی‌توانید خودتان را حذف کنید" },
        { status: 400 }
      );
    }

    // جلوگیری از حذف ADMIN
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "نمی‌توانید مدیرعامل را حذف کنید" },
        { status: 400 }
      );
    }

    // حذف کاربر
    await prisma.users.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "کاربر با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "خطا در حذف کاربر" },
      { status: 500 }
    );
  }
}
