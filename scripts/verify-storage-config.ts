#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    const settings = await prisma.settings.findFirst();

    if (settings?.objectStorageSettings) {
      console.log("✅ تنظیمات Object Storage یافت شد:");
      console.log(JSON.stringify(settings.objectStorageSettings, null, 2));
    } else {
      console.log("❌ تنظیمات Object Storage یافت نشد");
    }
  } catch (error) {
    console.error("خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
