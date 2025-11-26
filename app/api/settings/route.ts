import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // در اینجا می‌توانید تنظیمات را از دیتابیس بخوانید
    // برای حالا یک نمونه ساده برمی‌گردانیم
    // تنظیمات پیش‌فرض برمی‌گردانیم
    return NextResponse.json({
      logoUrl: "/logo.png",
      siteName: "سیستم فیدبک کارمندان",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({}, { status: 200 }); // اگر جدول وجود نداشت، خالی برمی‌گردانیم
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // ذخیره تنظیمات در localStorage (برای حالا)
    // در آینده می‌توانید از دیتابیس استفاده کنید
    
    // برای لوگو، URL را برمی‌گردانیم
    if (body.logoUrl) {
      // می‌توانید در دیتابیس ذخیره کنید
      return NextResponse.json({ 
        success: true,
        logoUrl: body.logoUrl 
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

