import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, userResponse } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "آرایه IDs الزامی است" },
        { status: 400 }
      );
    }

    // بررسی دسترسی: ادمین می‌تواند همه را تکمیل کند، مدیر فقط بخش خودش
    let whereCondition: any = {
      id: { in: ids },
      deletedAt: null,
    };

    if (session.user.role === "MANAGER" && session.user.departmentId) {
      whereCondition.departmentId = session.user.departmentId;
    } else if (session.user.role === "EMPLOYEE") {
      // کارمند نمی‌تواند bulk complete کند
      return NextResponse.json(
        { error: "شما مجاز به این عملیات نیستید" },
        { status: 403 }
      );
    }

    // به‌روزرسانی دسته‌جمعی
    const updateData: any = {
      status: "COMPLETED",
      updatedAt: new Date(),
    };

    // اگر userResponse ارسال شده، آن را نیز ذخیره کنیم
    if (userResponse && userResponse.trim()) {
      updateData.userResponse = userResponse;
      updateData.responseAt = new Date();
      updateData.respondedBy = session.user.id;
    }

    const result = await prisma.feedbacks.updateMany({
      where: whereCondition,
      data: updateData,
    });

    // پاک کردن cache
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("feedbacks_cache");
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} فیدبک با موفقیت تکمیل شد`,
    });
  } catch (error: any) {
    console.error("Error in bulk complete:", error);
    return NextResponse.json(
      { error: "خطا در تکمیل دسته‌جمعی فیدبک‌ها" },
      { status: 500 }
    );
  }
}
