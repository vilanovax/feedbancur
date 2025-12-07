import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkStatusTexts() {
  try {
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      console.log("❌ تنظیمات یافت نشد!");
      return;
    }

    console.log("📋 تنظیمات فعلی:");
    console.log(JSON.stringify(settings.statusTexts, null, 2));
    
    if (settings.statusTexts && typeof settings.statusTexts === 'object') {
      const statusTexts = settings.statusTexts as any;
      console.log("\n✅ متن وضعیت‌ها:");
      console.log(`PENDING: ${statusTexts.PENDING || "در انتظار"}`);
      console.log(`REVIEWED: ${statusTexts.REVIEWED || "بررسی شده"}`);
      console.log(`ARCHIVED: ${statusTexts.ARCHIVED || "آرشیو شده"}`);
      console.log(`DEFERRED: ${statusTexts.DEFERRED || "رسیدگی آینده"}`);
      console.log(`COMPLETED: ${statusTexts.COMPLETED || "انجام شد"}`);
    }
  } catch (error) {
    console.error("❌ خطا:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatusTexts();

