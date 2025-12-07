import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEmployeeSchema = z.object({
  name: z.string().min(1, "نام الزامی است").optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
});

// GET - مشاهده جزئیات یک کارمند
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
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        taskAssignments: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "کارمند یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط کارمندان بخش خودش را می‌بیند
    if (
      session.user.role === "MANAGER" &&
      employee.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش کارمند
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = updateEmployeeSchema.parse(body);

    // بررسی وجود کارمند
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: "کارمند یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط کارمندان بخش خودش را می‌تواند ویرایش کند
    if (
      session.user.role === "MANAGER" &&
      existingEmployee.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید کارمندان بخش خودتان را ویرایش کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند کارمند را به بخش دیگری منتقل کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId &&
      data.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما نمی‌توانید کارمند را به بخش دیگری منتقل کنید" },
        { status: 403 }
      );
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.position !== undefined) updateData.position = data.position || null;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;

    // بروزرسانی کارمند
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی کارمند" },
      { status: 500 }
    );
  }
}

// DELETE - حذف کارمند
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند کارمند را حذف کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند کارمندان را حذف کند" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // بررسی وجود کارمند
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            taskAssignments: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "کارمند یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی اینکه آیا کارمند تسک دارد
    if (employee._count.taskAssignments > 0) {
      return NextResponse.json(
        {
          error: `این کارمند دارای ${employee._count.taskAssignments} تسک است. ابتدا تسک‌ها را حذف یا به کارمند دیگری انتقال دهید.`,
        },
        { status: 400 }
      );
    }

    // حذف کارمند
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "کارمند با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "خطا در حذف کارمند" },
      { status: 500 }
    );
  }
}
