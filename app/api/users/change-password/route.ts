import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل 6 کاراکتر باشد"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = changePasswordSchema.parse(body);

    // دریافت کاربر از دیتابیس
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // بررسی رمز عبور فعلی
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "رمز عبور فعلی اشتباه است" },
        { status: 400 }
      );
    }

    // بررسی اینکه رمز جدید با رمز فعلی متفاوت باشد
    const isSamePassword = await bcrypt.compare(data.newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد" },
        { status: 400 }
      );
    }

    // Hash کردن رمز عبور جدید
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);

    // به‌روزرسانی رمز عبور و حذف فلگ mustChangePassword
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({
      message: "رمز عبور با موفقیت تغییر یافت",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

