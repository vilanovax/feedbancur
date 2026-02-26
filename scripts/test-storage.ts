/**
 * تست اتصال به Object Storage لیارا با خواندن تنظیمات از دیتابیس
 * اجرا: npx tsx scripts/test-storage.ts
 */
import { PrismaClient } from "@prisma/client";
import { uploadToLiara, deleteFromLiara } from "../lib/liara-storage";

const prisma = new PrismaClient();

async function main() {
  console.log("در حال خواندن تنظیمات از دیتابیس...");
  const settings = await prisma.settings.findFirst();
  const raw = settings?.objectStorageSettings;
  let objectStorageSettings: any = null;
  if (raw) {
    objectStorageSettings = typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  if (
    !objectStorageSettings?.enabled ||
    !objectStorageSettings?.accessKeyId ||
    !objectStorageSettings?.secretAccessKey ||
    !objectStorageSettings?.endpoint ||
    !objectStorageSettings?.bucket
  ) {
    console.error("❌ Object Storage پیکربندی نشده است. endpoint, accessKeyId, secretAccessKey, bucket را در تنظیمات پر کنید.");
    process.exit(1);
  }

  const endpoint = String(objectStorageSettings.endpoint || "").replace(/\/$/, "");
  const storageSettings = {
    ...objectStorageSettings,
    endpoint,
    region: objectStorageSettings.region || "us-east-1",
  };

  console.log("Endpoint:", endpoint);
  console.log("Bucket:", storageSettings.bucket);
  console.log("در حال آپلود فایل تست...");

  const testFolder = "test-connection";
  const testFileName = `test-${Date.now()}.txt`;
  const testContent = Buffer.from(
    "Liara Object Storage connection test – " + new Date().toISOString(),
    "utf-8"
  );

  try {
    const url = await uploadToLiara(
      testContent,
      testFileName,
      "text/plain; charset=utf-8",
      storageSettings,
      testFolder
    );
    console.log("✅ آپلود موفق. URL:", url);

    const storagePath = `${testFolder}/${testFileName}`;
    await deleteFromLiara(storagePath, storageSettings);
    console.log("✅ فایل تست حذف شد.");
  } catch (err: any) {
    console.error("❌ خطا:", err?.message || err);
    if (err?.code) console.error("   کد:", err.code);
    if (err?.cause) console.error("   علت:", err.cause);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
