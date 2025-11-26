import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
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

    // محدود کردن طول avatar (base64 string می‌تواند خیلی بزرگ باشد)
    let avatarValue = data.avatar || null;
    if (avatarValue && avatarValue.length > 1000000) {
      // اگر بیشتر از 1MB باشد، null می‌کنیم
      console.warn("Avatar too large, skipping update");
      avatarValue = null;
    }

    console.log("Updating user:", session.user.id, "with avatar length:", avatarValue?.length || 0);

    // به‌روزرسانی اطلاعات کاربر
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        email: data.email || null,
        avatar: avatarValue,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
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

