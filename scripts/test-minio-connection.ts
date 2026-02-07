#!/usr/bin/env tsx

/**
 * تست اتصال به MinIO
 */

import { S3Client, ListBucketsCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 در حال تست اتصال به MinIO...\n");

    // دریافت تنظیمات از دیتابیس
    const settings = await prisma.settings.findFirst();
    const config = settings?.objectStorageSettings as any;

    if (!config) {
      console.error("❌ تنظیمات Object Storage یافت نشد");
      return;
    }

    console.log("📋 تنظیمات:");
    console.log(`Endpoint: ${config.endpoint}`);
    console.log(`Bucket: ${config.bucket}`);
    console.log(`Access Key: ${config.accessKeyId}`);
    console.log(`Force Path Style: ${config.forcePathStyle}`);
    console.log();

    // ایجاد S3 Client
    const s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });

    // تست 1: لیست buckets
    console.log("📦 تست 1: لیست buckets...");
    try {
      const listCommand = new ListBucketsCommand({});
      const listResult = await s3Client.send(listCommand);
      console.log(`✅ یافت شد: ${listResult.Buckets?.length || 0} bucket`);
      listResult.Buckets?.forEach((bucket) => {
        console.log(`   - ${bucket.Name}`);
      });
    } catch (error: any) {
      console.error(`❌ خطا: ${error.message}`);
    }
    console.log();

    // تست 2: بررسی bucket feedban
    console.log(`📁 تست 2: بررسی bucket '${config.bucket}'...`);
    try {
      const headCommand = new HeadBucketCommand({ Bucket: config.bucket });
      await s3Client.send(headCommand);
      console.log(`✅ Bucket '${config.bucket}' در دسترس است`);
    } catch (error: any) {
      console.error(`❌ خطا: ${error.message}`);
    }
    console.log();

    console.log("✅ تست اتصال به پایان رسید");
  } catch (error: any) {
    console.error("❌ خطا در تست:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
