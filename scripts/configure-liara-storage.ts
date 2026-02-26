#!/usr/bin/env tsx
/**
 * پیکربندی Object Storage لیارا در دیتابیس از طریق متغیرهای محیطی
 * استفاده: مقادیر را در .env قرار دهید و اجرا کنید: npm run configure-liara-storage
 *
 * متغیرها:
 *   LIARA_STORAGE_ENDPOINT  مثلاً https://storage.c2.liara.space
 *   LIARA_ACCESS_KEY        Access Key از پنل لیارا
 *   LIARA_SECRET_KEY        Secret Key از پنل لیارا
 *   LIARA_BUCKET            نام bucket (مثلاً feedban)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`❌ متغیر محیطی ${name} تنظیم نشده است. در .env قرار دهید.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const endpointRaw = getEnv("LIARA_STORAGE_ENDPOINT");
  const endpoint = endpointRaw.startsWith("http") ? endpointRaw : `https://${endpointRaw}`;
  const accessKeyId = getEnv("LIARA_ACCESS_KEY");
  const secretAccessKey = getEnv("LIARA_SECRET_KEY");
  const bucket = getEnv("LIARA_BUCKET");

  const objectStorageSettings = {
    enabled: true,
    endpoint: endpoint.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
    bucket,
    region: "us-east-1",
  };

  console.log("🔧 در حال پیکربندی Object Storage لیارا...\n");
  console.log("Endpoint:", objectStorageSettings.endpoint);
  console.log("Bucket:", bucket);
  console.log("Access Key:", accessKeyId ? "***" + accessKeyId.slice(-4) : "—");

  const settings = await prisma.settings.findFirst();
  if (!settings) {
    console.error("❌ ابتدا حداقل یک رکورد تنظیمات در دیتابیس ایجاد کنید (مثلاً از طریق seed).");
    process.exit(1);
  }

  await prisma.settings.update({
    where: { id: settings.id },
    data: { objectStorageSettings },
  });

  console.log("\n✅ تنظیمات Object Storage لیارا در دیتابیس ذخیره شد.");
  console.log("🚀 اکنون می‌توانید آپلود فایل را تست کنید: npm run test:storage");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
