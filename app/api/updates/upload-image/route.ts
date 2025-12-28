import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToLiara } from "@/lib/liara-storage";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین می‌تواند تصویر آپلود کند
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

    // بررسی اندازه فایل (حداکثر 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از 10 مگابایت باشد" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات Object Storage
    const settings = await prisma.settings.findFirst();
    const objectStorageSettings = settings?.objectStorageSettings
      ? (typeof settings.objectStorageSettings === "string"
          ? JSON.parse(settings.objectStorageSettings)
          : settings.objectStorageSettings)
      : { enabled: false };

    // بررسی کامل بودن تنظیمات Object Storage
    const hasValidObjectStorage =
      objectStorageSettings.enabled &&
      objectStorageSettings.accessKeyId &&
      objectStorageSettings.secretAccessKey &&
      objectStorageSettings.endpoint &&
      objectStorageSettings.bucket;

    if (!hasValidObjectStorage) {
      return NextResponse.json(
        { error: "تنظیمات Object Storage انجام نشده است. لطفاً ابتدا Object Storage را در تنظیمات فعال کنید." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // بهینه‌سازی تصویر
    let optimizedBuffer: Buffer;
    let optimizedMimeType: string = "image/webp";

    try {
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();

      // حداکثر ابعاد: 1200x1200 پیکسل
      const maxWidth = 1200;
      const maxHeight = 1200;

      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      let sharpInstance = image.resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      });

      let quality = 85;

      try {
        optimizedBuffer = await sharpInstance
          .webp({
            quality: quality,
            effort: 6,
          })
          .toBuffer();
        optimizedMimeType = "image/webp";
      } catch {
        // اگر WebP پشتیبانی نشد، از JPEG استفاده می‌کنیم
        optimizedBuffer = await sharpInstance
          .jpeg({
            quality: 85,
          })
          .toBuffer();
        optimizedMimeType = "image/jpeg";
      }

      // اگر حجم بیشتر از 500KB است، کیفیت را کاهش می‌دهیم
      while (optimizedBuffer.length > 500 * 1024 && quality > 40) {
        quality -= 10;
        if (optimizedMimeType === "image/webp") {
          optimizedBuffer = await sharpInstance
            .webp({ quality: quality, effort: 6 })
            .toBuffer();
        } else {
          optimizedBuffer = await sharpInstance
            .jpeg({ quality: quality })
            .toBuffer();
        }
      }
    } catch (optimizeError: any) {
      console.error("Error optimizing image:", optimizeError);
      return NextResponse.json(
        { error: `خطا در بهینه‌سازی تصویر: ${optimizeError.message || "خطای نامشخص"}` },
        { status: 500 }
      );
    }

    // نام فایل
    const timestamp = Date.now();
    const extension = optimizedMimeType === "image/webp" ? "webp" : "jpg";
    const filename = `update-${timestamp}.${extension}`;

    // آپلود به Object Storage
    try {
      const fileUrl = await uploadToLiara(
        optimizedBuffer,
        filename,
        optimizedMimeType,
        objectStorageSettings,
        "updates" // پوشه مخصوص اطلاع‌رسانی‌ها
      );

      return NextResponse.json({
        success: true,
        url: fileUrl,
        message: "تصویر با موفقیت آپلود شد",
      });
    } catch (uploadError: any) {
      console.error("Error uploading to Object Storage:", uploadError);
      return NextResponse.json(
        { error: `خطا در آپلود تصویر: ${uploadError.message || "خطای نامشخص"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error uploading update image:", error);
    return NextResponse.json(
      { error: error?.message || "خطای نامشخص در آپلود فایل" },
      { status: 500 }
    );
  }
}
