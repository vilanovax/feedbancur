import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST - ریست اجباری رمز عبور برای کاربر/بخش/همه
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین می‌تواند این عملیات را انجام دهد
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { scope, userId, departmentId, newPassword } = body;

    // اعتبارسنجی scope
    if (!scope || !["user", "department", "all"].includes(scope)) {
      return NextResponse.json(
        { error: "محدوده نامعتبر است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی رمز عبور جدید
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "رمز عبور جدید باید حداقل 6 کاراکتر باشد" },
        { status: 400 }
      );
    }

    // هش کردن رمز عبور جدید
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let updateResult;
    let affectedCount = 0;

    switch (scope) {
      case "user":
        // ریست برای یک کاربر خاص
        if (!userId) {
          return NextResponse.json(
            { error: "شناسه کاربر الزامی است" },
            { status: 400 }
          );
        }

        // بررسی وجود کاربر و جلوگیری از ریست رمز ادمین دیگر
        const targetUser = await prisma.users.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          return NextResponse.json(
            { error: "کاربر یافت نشد" },
            { status: 404 }
          );
        }

        if (targetUser.role === "ADMIN" && targetUser.id !== session.user.id) {
          return NextResponse.json(
            { error: "امکان ریست رمز عبور ادمین دیگر وجود ندارد" },
            { status: 403 }
          );
        }

        updateResult = await prisma.users.update({
          where: { id: userId },
          data: {
            password: hashedPassword,
            mustChangePassword: true,
          },
        });
        affectedCount = 1;
        break;

      case "department":
        // ریست برای تمام کاربران یک بخش
        if (!departmentId) {
          return NextResponse.json(
            { error: "شناسه بخش الزامی است" },
            { status: 400 }
          );
        }

        // بررسی وجود بخش
        const department = await prisma.departments.findUnique({
          where: { id: departmentId },
        });

        if (!department) {
          return NextResponse.json(
            { error: "بخش یافت نشد" },
            { status: 404 }
          );
        }

        updateResult = await prisma.users.updateMany({
          where: {
            departmentId: departmentId,
            role: { not: "ADMIN" }, // ادمین‌ها ریست نمی‌شوند
          },
          data: {
            password: hashedPassword,
            mustChangePassword: true,
          },
        });
        affectedCount = updateResult.count;
        break;

      case "all":
        // ریست برای تمام کاربران (غیر از ادمین‌ها)
        updateResult = await prisma.users.updateMany({
          where: {
            role: { not: "ADMIN" }, // ادمین‌ها ریست نمی‌شوند
          },
          data: {
            password: hashedPassword,
            mustChangePassword: true,
          },
        });
        affectedCount = updateResult.count;
        break;
    }

    return NextResponse.json({
      success: true,
      message: `رمز عبور ${affectedCount} کاربر با موفقیت ریست شد`,
      affectedCount,
    });
  } catch (error) {
    console.error("Error resetting passwords:", error);
    return NextResponse.json(
      { error: "خطا در ریست رمز عبور" },
      { status: 500 }
    );
  }
}
