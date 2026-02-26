#!/usr/bin/env tsx

/**
 * اسکریپت پیکربندی Object Storage در دیتابیس
 * برای لیارا: متغیرهای LIARA_* را در .env قرار دهید و اجرا کنید: npm run configure-liara-storage
 * این اسکریپت از همان متغیرهای LIARA_* استفاده می‌کند (اختیاری برای تست محلی از MinIO دیگر پشتیبانی نمی‌شود).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function configureObjectStorage() {
  console.log("🔧 در حال پیکربندی Object Storage...\n");

  const endpoint = process.env.LIARA_STORAGE_ENDPOINT?.trim();
  const accessKeyId = process.env.LIARA_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.LIARA_SECRET_KEY?.trim();
  const bucket = process.env.LIARA_BUCKET?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("❌ برای پیکربندی از متغیرهای محیطی استفاده کنید:");
    console.error("   LIARA_STORAGE_ENDPOINT, LIARA_ACCESS_KEY, LIARA_SECRET_KEY, LIARA_BUCKET");
    console.error("   آن‌ها را در .env قرار دهید و دوباره اجرا کنید: npm run configure-liara-storage");
    process.exit(1);
  }

  try {
    const objectStorageSettings = {
      enabled: true,
      endpoint: endpoint.startsWith("http") ? endpoint.replace(/\/$/, "") : `https://${endpoint}`.replace(/\/$/, ""),
      bucket,
      accessKeyId,
      secretAccessKey,
      region: "us-east-1",
    };

    console.log("📝 تنظیمات جدید:");
    console.log(JSON.stringify(objectStorageSettings, null, 2));

    // دریافت یا ایجاد تنظیمات
    const settings = await prisma.settings.findFirst();

    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { objectStorageSettings },
      });
      console.log("✅ تنظیمات Object Storage به‌روزرسانی شد");
    } else {
      console.error("❌ ابتدا حداقل یک رکورد تنظیمات در دیتابیس ایجاد کنید (مثلاً seed).");
      process.exit(1);
    }

    console.log("\n📋 اطلاعات پیکربندی:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Endpoint:   ${objectStorageSettings.endpoint}`);
    console.log(`Bucket:     ${objectStorageSettings.bucket}`);
    console.log(`Access Key: ***${(objectStorageSettings.accessKeyId || "").slice(-4)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ پیکربندی با موفقیت انجام شد!");
    console.log("🚀 تست اتصال: npm run test:storage");
  } catch (error) {
    console.error("❌ خطا در پیکربندی:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

configureObjectStorage()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
