#!/usr/bin/env tsx

/**
 * اسکریپت اصلاح تنظیمات Object Storage
 * این space اضافی و فیلدهای گمشده را برطرف می‌کند
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixSettings() {
  console.log("🔧 در حال اصلاح تنظیمات Object Storage...\n");

  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ تنظیماتی یافت نشد");
      return;
    }

    // تنظیمات صحیح بدون space اضافی
    const correctSettings = {
      enabled: true,
      endpoint: "http://localhost:9000",
      bucket: "feedban",
      accessKeyId: "bizbuzz-minio",
      secretAccessKey: "bizbuzz-minio-secret-key",
      region: "us-east-1",
      forcePathStyle: true,
    };

    console.log("📝 تنظیمات جدید:");
    console.log(JSON.stringify(correctSettings, null, 2));
    console.log();

    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        objectStorageSettings: correctSettings,
      },
    });

    console.log("✅ تنظیمات اصلاح شد!");
    console.log();

    // بررسی مجدد
    const updated = await prisma.settings.findFirst();
    const updatedSettings = updated?.objectStorageSettings as any;

    console.log("🔍 بررسی تنظیمات جدید:");
    console.log("endpoint:", JSON.stringify(updatedSettings?.endpoint), "length:", updatedSettings?.endpoint?.length);
    console.log("forcePathStyle:", updatedSettings?.forcePathStyle);
    console.log();

    if (updatedSettings?.endpoint?.trim() === "http://localhost:9000" && updatedSettings?.forcePathStyle === true) {
      console.log("✅ همه چیز صحیح است!");
    } else {
      console.log("⚠️  هنوز مشکل وجود دارد");
    }
  } catch (error) {
    console.error("❌ خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSettings();
