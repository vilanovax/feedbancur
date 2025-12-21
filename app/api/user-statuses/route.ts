import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createUserStatusSchema = z.object({
  name: z.string().min(1, "نام استتوس الزامی است"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "رنگ باید به فرمت hex باشد (مثال: #FF5733)"),
  allowedRoles: z.array(z.enum(["ADMIN", "MANAGER", "EMPLOYEE"])).min(1, "حداقل یک نقش باید انتخاب شود"),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

const updateUserStatusSchema = z.object({
  name: z.string().min(1, "نام استتوس الزامی است").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "رنگ باید به فرمت hex باشد").optional(),
  allowedRoles: z.array(z.enum(["ADMIN", "MANAGER", "EMPLOYEE"])).min(1, "حداقل یک نقش باید انتخاب شود").optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET - دریافت لیست استتوس‌ها
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as "ADMIN" | "MANAGER" | "EMPLOYEE" | null;
    const isActive = searchParams.get("isActive");

    const where: any = {};

    // فیلتر بر اساس نقش (اگر کاربر ADMIN نیست، فقط استتوس‌های مربوط به نقش خودش را ببیند)
    if (role && session.user.role !== "ADMIN") {
      where.allowedRoles = { has: role };
    } else if (session.user.role !== "ADMIN") {
      // اگر نقش مشخص نشده و کاربر ADMIN نیست، فقط استتوس‌های مربوط به نقش خودش را ببیند
      where.allowedRoles = { has: session.user.role };
    } else if (role) {
      // اگر ADMIN است و نقش مشخص شده، فیلتر کن
      where.allowedRoles = { has: role };
    }

    // فیلتر بر اساس فعال بودن
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const statuses = await prisma.user_statuses.findMany({
      where,
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error("Error fetching user statuses:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد استتوس جدید
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createUserStatusSchema.parse(body);

    // بررسی اینکه آیا استتوس با همین نام وجود دارد
    const existing = await prisma.user_statuses.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "استتوس با این نام قبلاً ایجاد شده است" },
        { status: 400 }
      );
    }

    // اگر order مشخص نشده، آخرین order را پیدا کن و +1 کن
    if (data.order === 0) {
      const lastStatus = await prisma.user_statuses.findFirst({
        orderBy: { order: "desc" },
      });
      data.order = lastStatus ? lastStatus.order + 1 : 1;
    }

    const status = await prisma.user_statuses.create({
      data: {
        name: data.name,
        color: data.color,
        allowedRoles: data.allowedRoles,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - به‌روزرسانی استتوس
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "شناسه استتوس الزامی است" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = updateUserStatusSchema.parse(body);

    // بررسی وجود استتوس
    const existing = await prisma.user_statuses.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "استتوس یافت نشد" },
        { status: 404 }
      );
    }

    // اگر نام تغییر کرده، بررسی تکراری نبودن
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.user_statuses.findFirst({
        where: { name: data.name },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "استتوس با این نام قبلاً ایجاد شده است" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user_statuses.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف استتوس
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "شناسه استتوس الزامی است" },
        { status: 400 }
      );
    }

    // بررسی اینکه آیا کاربری از این استتوس استفاده می‌کند
    const usersWithStatus = await prisma.users.count({
      where: { statusId: id },
    });

    if (usersWithStatus > 0) {
      return NextResponse.json(
        { error: `این استتوس توسط ${usersWithStatus} کاربر استفاده می‌شود و نمی‌تواند حذف شود` },
        { status: 400 }
      );
    }

    await prisma.user_statuses.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

