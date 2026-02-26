import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToLiara } from "@/lib/liara-storage";
import { getObjectStorageSettings, isStorageConfigValid } from "@/lib/object-storage-settings";
import sharp from "sharp";

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

    // بررسی اندازه فایل اولیه (حداکثر 10MB برای پردازش)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از 10 مگابایت باشد" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات Object Storage (از env یا دیتابیس، اتوماتیک)
    const objectStorageSettings = await getObjectStorageSettings(prisma);

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // بهینه‌سازی تصویر: resize و compress
    console.log("🖼️  شروع بهینه‌سازی تصویر...");
    let optimizedBuffer: Buffer;
    let optimizedMimeType: string = "image/png";
    
    try {
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();
      
      // حداکثر ابعاد برای لوگو: 500x500 پیکسل
      const maxWidth = 500;
      const maxHeight = 500;
      
      // محاسبه ابعاد جدید با حفظ نسبت
      let width = metadata.width || maxWidth;
      let height = metadata.height || maxHeight;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      // تبدیل به WebP برای فشرده‌سازی بهتر (یا PNG اگر WebP پشتیبانی نشود)
      let sharpInstance = image
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      
      // ابتدا سعی می‌کنیم WebP استفاده کنیم (فشرده‌تر)
      let useWebP = true;
      let quality = 85;
      
      try {
        optimizedBuffer = await sharpInstance
          .webp({
            quality: quality,
            effort: 6 // 0-6, بیشتر = فشرده‌تر اما کندتر
          })
          .toBuffer();
        
        optimizedMimeType = "image/webp";
        console.log(`✅ استفاده از WebP - حجم اولیه: ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
      } catch (webpError) {
        // اگر WebP پشتیبانی نشد، از PNG استفاده می‌کنیم
        console.log("⚠️  WebP پشتیبانی نشد، استفاده از PNG");
        useWebP = false;
        optimizedBuffer = await sharpInstance
          .png({
            quality: 80,
            compressionLevel: 9,
            adaptiveFiltering: true
          })
          .toBuffer();
        optimizedMimeType = "image/png";
      }
      
      // اگر حجم فایل هنوز بیشتر از 100KB است، کیفیت را کاهش می‌دهیم
      while (optimizedBuffer.length > 100 * 1024 && quality > 40) {
        quality -= 5;
        if (useWebP) {
          optimizedBuffer = await sharpInstance
            .webp({
              quality: quality,
              effort: 6
            })
            .toBuffer();
        } else {
          optimizedBuffer = await sharpInstance
            .png({
              quality: quality,
              compressionLevel: 9,
              adaptiveFiltering: true
            })
            .toBuffer();
        }
        console.log(`📉 کاهش کیفیت به ${quality}% - حجم: ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
      }
      
      // اگر هنوز بزرگ است، ابعاد را کاهش می‌دهیم
      if (optimizedBuffer.length > 100 * 1024) {
        let currentWidth = width;
        let currentHeight = height;
        while (optimizedBuffer.length > 100 * 1024 && currentWidth > 200 && currentHeight > 200) {
          currentWidth = Math.round(currentWidth * 0.9);
          currentHeight = Math.round(currentHeight * 0.9);
          
          if (useWebP) {
            optimizedBuffer = await image
              .resize(currentWidth, currentHeight, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .webp({
                quality: 70,
                effort: 6
              })
              .toBuffer();
          } else {
            optimizedBuffer = await image
              .resize(currentWidth, currentHeight, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .png({
                quality: 70,
                compressionLevel: 9,
                adaptiveFiltering: true
              })
              .toBuffer();
          }
          
          console.log(`📐 کاهش ابعاد به ${currentWidth}x${currentHeight} - حجم: ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
        }
      }
      
      console.log(`✅ تصویر بهینه شد: ${(originalBuffer.length / 1024).toFixed(2)}KB → ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
      
      // بررسی نهایی حجم
      if (optimizedBuffer.length > 100 * 1024) {
        return NextResponse.json(
          { error: `نمی‌توان تصویر را به کمتر از 100KB کاهش داد. حجم فعلی: ${(optimizedBuffer.length / 1024).toFixed(2)}KB` },
          { status: 400 }
        );
      }
    } catch (optimizeError: any) {
      console.error("Error optimizing image:", optimizeError);
      return NextResponse.json(
        { error: `خطا در بهینه‌سازی تصویر: ${optimizeError.message || "خطای نامشخص"}` },
        { status: 500 }
      );
    }

    // نام فایل (بر اساس فرمت بهینه شده)
    const timestamp = Date.now();
    const extension = optimizedMimeType === "image/webp" ? "webp" : "png";
    const filename = `logo-${timestamp}.${extension}`;

    const hasValidObjectStorage = isStorageConfigValid(objectStorageSettings);
    let fileUrl: string;

    if (hasValidObjectStorage && objectStorageSettings) {
      try {
        fileUrl = await uploadToLiara(
          optimizedBuffer,
          filename,
          optimizedMimeType,
          objectStorageSettings,
          "logo"
        );
        console.log("✅ Logo uploaded to Object Storage:", fileUrl);
      } catch (uploadError: any) {
        console.error("❌ Error uploading logo to Object Storage:", uploadError);
        return NextResponse.json(
          { error: `خطا در آپلود لوگو به Object Storage: ${uploadError.message || "خطای نامشخص"}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Object Storage (لیارا) پیکربندی نشده است. از بخش تنظیمات، ذخیره‌سازی فایل را تنظیم کنید." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: "لوگو با موفقیت آپلود شد",
    });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    const errorMessage = error?.message || "خطای نامشخص در آپلود فایل";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

