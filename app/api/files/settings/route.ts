import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DEFAULT_FILE_SHARE_SETTINGS } from "@/lib/file-validation";

/**
 * GET /api/files/settings
 * دریافت تنظیمات اشتراک‌گذاری فایل
 * فقط Admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    // دریافت تنظیمات
    const settings = await prisma.settings.findFirst();

    if (!settings || !settings.fileShareSettings) {
      // اگر تنظیمات وجود ندارد، مقادیر پیش‌فرض را برگردان
      return NextResponse.json(DEFAULT_FILE_SHARE_SETTINGS);
    }

    return NextResponse.json(settings.fileShareSettings);
  } catch (error) {
    console.error("Error fetching file share settings:", error);
    return NextResponse.json(
      { error: "خطا در دریافت تنظیمات" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files/settings
 * به‌روزرسانی تنظیمات اشتراک‌گذاری فایل
 * فقط Admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();

    // اعتبارسنجی ورودی
    if (body.maxFileSize) {
      const maxFileSize = Number(body.maxFileSize);
      if (isNaN(maxFileSize) || maxFileSize < 1 || maxFileSize > 100) {
        return NextResponse.json(
          { error: "حداکثر حجم فایل باید بین 1 تا 100 مگابایت باشد" },
          { status: 400 }
        );
      }
    }

    if (body.maxTotalStoragePerUser) {
      const maxStorage = Number(body.maxTotalStoragePerUser);
      if (isNaN(maxStorage) || maxStorage < 0) {
        return NextResponse.json(
          { error: "سهمیه ذخیره‌سازی کاربر نامعتبر است" },
          { status: 400 }
        );
      }
    }

    if (body.maxTotalStoragePerProject) {
      const maxStorage = Number(body.maxTotalStoragePerProject);
      if (isNaN(maxStorage) || maxStorage < 0) {
        return NextResponse.json(
          { error: "سهمیه ذخیره‌سازی پروژه نامعتبر است" },
          { status: 400 }
        );
      }
    }

    if (body.allowedFileTypes && !Array.isArray(body.allowedFileTypes)) {
      return NextResponse.json(
        { error: "فرمت allowedFileTypes نامعتبر است" },
        { status: 400 }
      );
    }

    if (body.allowedExtensions && !Array.isArray(body.allowedExtensions)) {
      return NextResponse.json(
        { error: "فرمت allowedExtensions نامعتبر است" },
        { status: 400 }
      );
    }

    if (body.suggestedTags && !Array.isArray(body.suggestedTags)) {
      return NextResponse.json(
        { error: "فرمت suggestedTags نامعتبر است" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات فعلی
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: "تنظیمات سیستم یافت نشد" },
        { status: 404 }
      );
    }

    // ساخت object تنظیمات جدید
    const currentFileShareSettings =
      (settings.fileShareSettings as any) || DEFAULT_FILE_SHARE_SETTINGS;

    const updatedFileShareSettings = {
      ...currentFileShareSettings,
      ...body,
    };

    // به‌روزرسانی تنظیمات
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        fileShareSettings: updatedFileShareSettings,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      settings: updatedFileShareSettings,
    });
  } catch (error) {
    console.error("Error updating file share settings:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی تنظیمات" },
      { status: 500 }
    );
  }
}
