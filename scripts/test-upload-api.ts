#!/usr/bin/env tsx

/**
 * تست مستقیم API آپلود فایل
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testUploadAPI() {
  try {
    console.log("🧪 تست تنظیمات API آپلود...\n");

    // شبیه‌سازی کد API
    const settings = await prisma.settings.findFirst();

    console.log("1️⃣ بررسی وجود settings:");
    console.log("   settings exists:", !!settings);
    console.log();

    if (!settings) {
      console.error("❌ تنظیمات یافت نشد!");
      return;
    }

    const objectStorageSettings = settings?.objectStorageSettings as any;

    console.log("2️⃣ بررسی objectStorageSettings:");
    console.log("   exists:", !!objectStorageSettings);
    console.log();

    if (!objectStorageSettings) {
      console.error("❌ objectStorageSettings خالی است!");
      return;
    }

    console.log("3️⃣ بررسی فیلدهای مورد نیاز:");
    console.log("   enabled:", objectStorageSettings.enabled, "✓" + (objectStorageSettings.enabled ? "✓" : "✗"));
    console.log("   accessKeyId:", !!objectStorageSettings.accessKeyId ? "✓" : "✗", `(${objectStorageSettings.accessKeyId})`);
    console.log("   secretAccessKey:", !!objectStorageSettings.secretAccessKey ? "✓" : "✗", `(${objectStorageSettings.secretAccessKey?.substring(0, 10)}...)`);
    console.log("   endpoint:", !!objectStorageSettings.endpoint ? "✓" : "✗", `(${objectStorageSettings.endpoint})`);
    console.log("   bucket:", !!objectStorageSettings.bucket ? "✓" : "✗", `(${objectStorageSettings.bucket})`);
    console.log();

    console.log("4️⃣ بررسی شرط API (خط 129-140 از route.ts):");

    const condition =
      !objectStorageSettings?.enabled ||
      !objectStorageSettings?.accessKeyId ||
      !objectStorageSettings?.secretAccessKey ||
      !objectStorageSettings?.endpoint ||
      !objectStorageSettings?.bucket;

    console.log("   شرط IF:", condition);
    console.log();

    if (condition) {
      console.error("❌ API خطای 400 برمی‌گرداند:");
      console.error('   { error: "تنظیمات Object Storage انجام نشده است" }');
      console.log();

      // نمایش دقیق کدام فیلد مشکل دارد
      if (!objectStorageSettings?.enabled) {
        console.error("   ❌ enabled = false یا undefined");
      }
      if (!objectStorageSettings?.accessKeyId) {
        console.error("   ❌ accessKeyId خالی است");
      }
      if (!objectStorageSettings?.secretAccessKey) {
        console.error("   ❌ secretAccessKey خالی است");
      }
      if (!objectStorageSettings?.endpoint) {
        console.error("   ❌ endpoint خالی است");
      }
      if (!objectStorageSettings?.bucket) {
        console.error("   ❌ bucket خالی است");
      }
    } else {
      console.log("✅ همه شرایط OK است - API باید کار کند!");
    }

  } catch (error) {
    console.error("❌ خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUploadAPI();
