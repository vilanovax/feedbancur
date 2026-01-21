import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

interface ObjectStorageSettings {
  enabled: boolean;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

/**
 * آپلود فایل به لیارا Object Storage
 * @param folder - مسیر در bucket (مثلاً "messages", "feedback", "logo")
 */
export async function uploadToLiara(
  file: Buffer,
  fileName: string,
  contentType: string,
  settings: ObjectStorageSettings,
  folder: string = "messages"
): Promise<string> {
  if (!settings.enabled) {
    throw new Error("Object storage is not enabled");
  }

  if (!settings.endpoint || !settings.accessKeyId || !settings.secretAccessKey || !settings.bucket) {
    throw new Error("Object storage settings are incomplete");
  }

  // ایجاد S3 client برای لیارا
  // لیارا از forcePathStyle استفاده می‌کند
  const s3Client = new S3Client({
    endpoint: settings.endpoint,
    region: settings.region || "us-east-1",
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    forcePathStyle: true, // برای لیارا لازم است
  });

  // آپلود فایل
  // توجه: برخی سرویس‌های S3-compatible از ACL در PutObjectCommand پشتیبانی نمی‌کنند
  // دسترسی عمومی باید در تنظیمات bucket در پنل لیارا فعال شود
  const command = new PutObjectCommand({
    Bucket: settings.bucket,
    Key: `${folder}/${fileName}`,
    Body: file,
    ContentType: contentType,
    // ACL حذف شد - دسترسی عمومی باید در پنل لیارا تنظیم شود
  });

  try {
    await s3Client.send(command);
  } catch (uploadError: any) {
    throw new Error(`خطا در آپلود فایل به لیارا: ${uploadError.message || "خطای نامشخص"}`);
  }

  // ساخت URL عمومی فایل
  // لیارا از فرمت virtual-hosted-style برای دسترسی عمومی استفاده می‌کند:
  // https://{bucket}.{endpoint}/{folder}/{fileName}
  // 
  // توجه: forcePathStyle: true فقط برای API calls استفاده می‌شود
  // برای دسترسی عمومی، لیارا از virtual-hosted-style استفاده می‌کند
  
  let publicUrl: string;
  const cleanEndpoint = settings.endpoint.replace(/^https?:\/\//, "").replace(/\/$/, "");
  
  // ساخت URL به فرمت virtual-hosted-style برای لیارا
  // فرمت: https://{bucket}.{endpoint}/{folder}/{fileName}
  if (cleanEndpoint.includes("storage") && cleanEndpoint.includes("liara")) {
    // برای لیارا: https://{bucket}.storage.{region}.liara.space/{folder}/{fileName}
    publicUrl = `https://${settings.bucket}.${cleanEndpoint}/${folder}/${fileName}`;
  } else {
    // برای سایر سرویس‌های S3-compatible که از virtual-hosted-style پشتیبانی می‌کنند
    publicUrl = `https://${settings.bucket}.${cleanEndpoint}/${folder}/${fileName}`;
  }

  return publicUrl;
}

/**
 * حذف فایل از Liara Object Storage
 * @param storagePath - مسیر کامل فایل در bucket (مثلاً "shared-files/org/root/file.pdf")
 */
export async function deleteFromLiara(
  storagePath: string,
  settings: ObjectStorageSettings
): Promise<void> {
  if (!settings.enabled) {
    throw new Error("Object storage is not enabled");
  }

  if (
    !settings.endpoint ||
    !settings.accessKeyId ||
    !settings.secretAccessKey ||
    !settings.bucket
  ) {
    throw new Error("Object storage settings are incomplete");
  }

  const s3Client = new S3Client({
    endpoint: settings.endpoint,
    region: settings.region || "us-east-1",
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const command = new DeleteObjectCommand({
    Bucket: settings.bucket,
    Key: storagePath,
  });

  try {
    await s3Client.send(command);
  } catch (deleteError: any) {
    throw new Error(
      `خطا در حذف فایل از لیارا: ${deleteError.message || "خطای نامشخص"}`
    );
  }
}

/**
 * ساخت URL موقت امن برای دانلود فایل
 * @param storagePath - مسیر کامل فایل در bucket
 * @param expiresIn - مدت زمان اعتبار به ثانیه (پیش‌فرض: 300 ثانیه = 5 دقیقه)
 */
export async function getSignedDownloadUrl(
  storagePath: string,
  settings: ObjectStorageSettings,
  expiresIn: number = 300
): Promise<string> {
  if (!settings.enabled) {
    throw new Error("Object storage is not enabled");
  }

  if (
    !settings.endpoint ||
    !settings.accessKeyId ||
    !settings.secretAccessKey ||
    !settings.bucket
  ) {
    throw new Error("Object storage settings are incomplete");
  }

  const s3Client = new S3Client({
    endpoint: settings.endpoint,
    region: settings.region || "us-east-1",
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const command = new GetObjectCommand({
    Bucket: settings.bucket,
    Key: storagePath,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error: any) {
    throw new Error(
      `خطا در ساخت URL موقت: ${error.message || "خطای نامشخص"}`
    );
  }
}

/**
 * محاسبه حجم استفاده شده در یک پوشه
 * @param prefix - پیشوند مسیر (مثلاً "shared-files/org/" یا "shared-files/projects/abc123/")
 */
export async function getStorageUsage(
  prefix: string,
  settings: ObjectStorageSettings
): Promise<number> {
  if (!settings.enabled) {
    throw new Error("Object storage is not enabled");
  }

  if (
    !settings.endpoint ||
    !settings.accessKeyId ||
    !settings.secretAccessKey ||
    !settings.bucket
  ) {
    throw new Error("Object storage settings are incomplete");
  }

  const s3Client = new S3Client({
    endpoint: settings.endpoint,
    region: settings.region || "us-east-1",
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    forcePathStyle: true,
  });

  let totalSize = 0;
  let continuationToken: string | undefined;

  try {
    do {
      const command = new ListObjectsV2Command({
        Bucket: settings.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          totalSize += object.Size || 0;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return totalSize;
  } catch (error: any) {
    throw new Error(
      `خطا در محاسبه حجم: ${error.message || "خطای نامشخص"}`
    );
  }
}

