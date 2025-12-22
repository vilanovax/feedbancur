import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET - دریافت اطلاعات پروفایل کاربر
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        avatar: true,
        statusId: true,
        user_statuses: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // Format response for frontend
    const formattedUser = {
      ...user,
      status: user.user_statuses,
      department: user.departments,
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(1, "نام الزامی است").optional(),
  email: z
    .union([
      z.string().email("ایمیل معتبر نیست"),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === "" || val === undefined ? null : val)),
  avatar: z.string().optional().nullable(),
  statusId: z.string().nullable().optional(),
});

// PATCH - ویرایش پروفایل خود کاربر
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Received body:", { ...body, avatar: body.avatar ? `${body.avatar.substring(0, 50)}...` : null });
    
    const data = updateProfileSchema.parse(body);
    console.log("Parsed data:", { ...data, avatar: data.avatar ? `${data.avatar.substring(0, 50)}...` : null });

    // دریافت اطلاعات فعلی کاربر برای حفظ فیلدهایی که ارسال نشده‌اند
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        avatar: true,
        statusId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // محدود کردن طول avatar (base64 string می‌تواند خیلی بزرگ باشد)
    let avatarValue = data.avatar !== undefined ? (data.avatar || null) : currentUser.avatar;
    if (avatarValue && avatarValue.length > 1000000) {
      // اگر بیشتر از 1MB باشد، null می‌کنیم
      console.warn("Avatar too large, skipping update");
      avatarValue = null;
    }

    // بررسی صحت statusId (اگر ارسال شده باشد)
    let statusIdValue = data.statusId !== undefined ? (data.statusId || null) : currentUser.statusId;
    if (statusIdValue) {
      const status = await prisma.user_statuses.findUnique({
        where: { id: statusIdValue },
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
      if (!status.allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: "شما مجاز به استفاده از این استتوس نیستید" },
          { status: 403 }
        );
      }
    }

    console.log("Updating user:", session.user.id, "with avatar length:", avatarValue?.length || 0);
    console.log("StatusId to update:", statusIdValue);

    // به‌روزرسانی اطلاعات کاربر - فقط فیلدهایی که ارسال شده‌اند
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.avatar !== undefined) updateData.avatar = avatarValue;
    if (data.statusId !== undefined) updateData.statusId = statusIdValue;

    console.log("Update data:", updateData);

    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        avatar: true,
        statusId: true,
        user_statuses: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Format response for frontend
    const formattedUser = {
      ...updatedUser,
      status: updatedUser.user_statuses,
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating profile:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: "خطا در به‌روزرسانی اطلاعات",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

