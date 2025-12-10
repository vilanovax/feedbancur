import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToLiara } from "@/lib/liara-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "فایل ارسال نشده است" },
        { status: 400 }
      );
    }

    // بررسی نوع فایل
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "فقط فایل‌های تصویری مجاز هستند" },
        { status: 400 }
      );
    }

    // بررسی اندازه فایل (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از 5 مگابایت باشد" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات Object Storage
    const settings = await prisma.settings.findFirst();
    const objectStorageSettings = settings?.objectStorageSettings
      ? (typeof settings.objectStorageSettings === 'string'
          ? JSON.parse(settings.objectStorageSettings)
          : settings.objectStorageSettings)
      : { enabled: false };

    // بررسی فعال بودن Object Storage
    if (!objectStorageSettings.enabled) {
      return NextResponse.json(
        { error: "Object Storage غیرفعال است. لطفاً در تنظیمات فعال کنید." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // نام فایل
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `logo-${timestamp}.${extension}`;

    try {
      // آپلود به لیارا
      const fileUrl = await uploadToLiara(
        buffer,
        filename,
        file.type,
        objectStorageSettings,
        "logo"
      );
      console.log("Logo uploaded to Liara:", fileUrl);

      return NextResponse.json({
        success: true,
        url: fileUrl,
        message: "لوگو با موفقیت آپلود شد",
      });
    } catch (uploadError: any) {
      console.error("Error uploading logo to Liara:", uploadError);
      return NextResponse.json(
        { error: `خطا در آپلود لوگو: ${uploadError.message || "خطای نامشخص"}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "خطا در آپلود فایل" },
      { status: 500 }
    );
  }
}

