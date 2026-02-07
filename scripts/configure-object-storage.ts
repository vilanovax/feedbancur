#!/usr/bin/env tsx

/**
 * اسکریپت پیکربندی خودکار Object Storage
 * این اسکریپت تنظیمات MinIO را به صورت خودکار در دیتابیس ثبت می‌کند
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function configureObjectStorage() {
  console.log("🔧 در حال پیکربندی Object Storage...\n");

  try {
    // تنظیمات MinIO
    const objectStorageSettings = {
      enabled: true,
      endpoint: "http://localhost:9000",
      bucket: "feedban",
      accessKeyId: "bizbuzz-minio",
      secretAccessKey: "bizbuzz-minio-secret-key",
      region: "us-east-1",
      forcePathStyle: true,
    };

    console.log("📝 تنظیمات جدید:");
    console.log(JSON.stringify(objectStorageSettings, null, 2));

    // دریافت یا ایجاد تنظیمات
    const settings = await prisma.settings.findFirst();

    if (settings) {
      // به‌روزرسانی تنظیمات موجود
      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          objectStorageSettings: objectStorageSettings,
        },
      });
      console.log("✅ تنظیمات Object Storage به‌روزرسانی شد");
    } else {
      // ایجاد تنظیمات جدید
      await prisma.settings.create({
        data: {
          id: "default",
          siteName: "Feedban",
          siteDescription: "سیستم مدیریت بازخورد و پروژه",
          objectStorageSettings: objectStorageSettings,
        },
      });
      console.log("✅ تنظیمات Object Storage ایجاد شد");
    }

    console.log("\n📋 اطلاعات پیکربندی:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Endpoint:     ${objectStorageSettings.endpoint}`);
    console.log(`Bucket:       ${objectStorageSettings.bucket}`);
    console.log(`Access Key:   ${objectStorageSettings.accessKeyId}`);
    console.log(`Secret Key:   ${objectStorageSettings.secretAccessKey}`);
    console.log(`Region:       ${objectStorageSettings.region}`);
    console.log(`Path Style:   ${objectStorageSettings.forcePathStyle ? "Enabled" : "Disabled"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ پیکربندی با موفقیت انجام شد!");
    console.log("🚀 اکنون می‌توانید فایل‌ها را آپلود کنید");
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
