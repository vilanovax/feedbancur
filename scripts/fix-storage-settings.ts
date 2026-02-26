#!/usr/bin/env tsx

/**
 * اسکریپت اصلاح تنظیمات Object Storage
 * فقط endpoint را نرمال می‌کند (حذف space و اسلش انتهایی). مقادیر را از دیتابیس تغییر نمی‌دهد.
 * برای تنظیم لیارا: از npm run configure-liara-storage استفاده کنید.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixSettings() {
  console.log("🔧 در حال اصلاح فرمت تنظیمات Object Storage...\n");

  try {
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ تنظیماتی یافت نشد");
      return;
    }

    const raw = settings.objectStorageSettings as any;
    if (!raw || typeof raw !== "object") {
      console.error("❌ objectStorageSettings یافت نشد یا نامعتبر است.");
      return;
    }

    const corrected = {
      ...raw,
      endpoint: String(raw.endpoint || "").trim().replace(/\/$/, "") || raw.endpoint,
      region: raw.region || "us-east-1",
    };

    await prisma.settings.update({
      where: { id: settings.id },
      data: { objectStorageSettings: corrected },
    });

    console.log("✅ endpoint نرمال شد:", corrected.endpoint);
  } catch (error) {
    console.error("❌ خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSettings();
