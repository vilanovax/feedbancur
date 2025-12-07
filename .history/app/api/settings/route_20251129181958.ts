import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Default status texts
const DEFAULT_STATUS_TEXTS = {
  PENDING: "در انتظار",
  REVIEWED: "بررسی شده",
  ARCHIVED: "آرشیو شده",
  DEFERRED: "رسیدگی آینده",
  COMPLETED: "انجام شد",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند تنظیمات را ببینند
    // MANAGER فقط می‌تواند statusTexts را ببیند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت تنظیمات از دیتابیس
    const dbSettings = await prisma.settings.findFirst();
    
    // تنظیمات پیش‌فرض
    const settings = {
      logoUrl: dbSettings?.logoUrl || "/logo.png",
      siteName: dbSettings?.siteName || "سیستم فیدبک کارمندان",
      statusTexts: dbSettings?.statusTexts 
        ? (typeof dbSettings.statusTexts === 'object' 
            ? dbSettings.statusTexts 
            : typeof dbSettings.statusTexts === 'string'
            ? JSON.parse(dbSettings.statusTexts)
            : DEFAULT_STATUS_TEXTS)
        : DEFAULT_STATUS_TEXTS,
    };

    // اگر ADMIN است، همه تنظیمات را برگردان
    // اگر MANAGER است، فقط statusTexts را برگردان
    if (session.user.role === "ADMIN") {
      return NextResponse.json(settings);
    } else {
      // MANAGER: فقط statusTexts را برگردان
      return NextResponse.json({
        statusTexts: settings.statusTexts,
      });
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    // در صورت خطا، فقط statusTexts پیش‌فرض را برگردان
    return NextResponse.json({
      statusTexts: DEFAULT_STATUS_TEXTS,
    }, { status: 200 });
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

    // دریافت تنظیمات موجود یا ایجاد جدید
    const existingSettings = await prisma.settings.findFirst();
    
    // آماده‌سازی داده‌ها برای ذخیره
    const updateData: any = {};

    // ذخیره لوگو
    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl;
    }

    // ذخیره siteName
    if (body.siteName !== undefined) {
      updateData.siteName = body.siteName;
    }

    // ذخیره statusTexts
    if (body.statusTexts) {
      // Validate status texts
      const validStatuses: Array<keyof typeof DEFAULT_STATUS_TEXTS> = ["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"];
      const statusTexts: Record<string, string> = {};
      
      for (const status of validStatuses) {
        if (body.statusTexts[status] && typeof body.statusTexts[status] === "string") {
          statusTexts[status] = body.statusTexts[status].trim();
        } else {
          statusTexts[status] = DEFAULT_STATUS_TEXTS[status];
        }
      }

      // ذخیره به صورت Json (Prisma به صورت خودکار تبدیل می‌کند)
      updateData.statusTexts = statusTexts;
    }

    // ذخیره سایر فیلدها
    if (body.siteDescription !== undefined) updateData.siteDescription = body.siteDescription;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.emailNotifications !== undefined) updateData.emailNotifications = body.emailNotifications;
    if (body.smsNotifications !== undefined) updateData.smsNotifications = body.smsNotifications;
    if (body.pushNotifications !== undefined) updateData.pushNotifications = body.pushNotifications;
    if (body.requirePasswordChange !== undefined) updateData.requirePasswordChange = body.requirePasswordChange;
    if (body.sessionTimeout !== undefined) updateData.sessionTimeout = body.sessionTimeout;
    if (body.twoFactorAuth !== undefined) updateData.twoFactorAuth = body.twoFactorAuth;
    if (body.allowAnonymous !== undefined) updateData.allowAnonymous = body.allowAnonymous;
    if (body.autoArchiveDays !== undefined) updateData.autoArchiveDays = body.autoArchiveDays;
    if (body.maxFeedbackLength !== undefined) updateData.maxFeedbackLength = body.maxFeedbackLength;
    if (body.itemsPerPage !== undefined) updateData.itemsPerPage = body.itemsPerPage;
    if (body.theme !== undefined) updateData.theme = body.theme;

    // ذخیره یا به‌روزرسانی در دیتابیس
    if (existingSettings) {
      await prisma.settings.update({
        where: { id: existingSettings.id },
        data: updateData,
      });
    } else {
      await prisma.settings.create({
        data: {
          siteName: updateData.siteName || "سیستم فیدبک کارمندان",
          siteDescription: updateData.siteDescription || null,
          logoUrl: updateData.logoUrl || null,
          statusTexts: updateData.statusTexts || DEFAULT_STATUS_TEXTS,
          ...updateData,
        },
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

