import type { PrismaClient } from "@prisma/client";

export interface ObjectStorageSettings {
  enabled: boolean;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
}

const ENV_KEYS = {
  endpoint: "LIARA_STORAGE_ENDPOINT",
  accessKeyId: "LIARA_ACCESS_KEY",
  secretAccessKey: "LIARA_SECRET_KEY",
  bucket: "LIARA_BUCKET",
} as const;

function fromEnv(): ObjectStorageSettings | null {
  const endpoint = process.env[ENV_KEYS.endpoint]?.trim();
  const accessKeyId = process.env[ENV_KEYS.accessKeyId]?.trim();
  const secretAccessKey = process.env[ENV_KEYS.secretAccessKey]?.trim();
  const bucket = process.env[ENV_KEYS.bucket]?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  const fullEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
  return {
    enabled: true,
    endpoint: fullEndpoint.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
    bucket,
    region: "us-east-1",
  };
}

function parseFromDb(raw: unknown): ObjectStorageSettings | null {
  if (!raw) return null;
  try {
    const o = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!o || typeof o !== "object") return null;
    const endpoint = String(o.endpoint ?? "").trim().replace(/\/$/, "");
    if (!o.accessKeyId || !o.secretAccessKey || !endpoint || !o.bucket) return null;
    return {
      enabled: Boolean(o.enabled),
      endpoint,
      accessKeyId: String(o.accessKeyId),
      secretAccessKey: String(o.secretAccessKey),
      bucket: String(o.bucket),
      region: String(o.region || "us-east-1"),
    };
  } catch {
    return null;
  }
}

/**
 * خواندن تنظیمات Object Storage: اول از env (LIARA_*)، در غیر این صورت از دیتابیس.
 * اگر env تنظیم شده باشد، مقدار در دیتابیس هم به‌روز می‌شود تا همه‌چیز اتوماتیک باشد.
 */
export async function getObjectStorageSettings(
  prisma: PrismaClient
): Promise<ObjectStorageSettings | null> {
  const fromEnvSettings = fromEnv();
  if (fromEnvSettings) {
    try {
      const row = await prisma.settings.findFirst();
      if (row) {
        await prisma.settings.update({
          where: { id: row.id },
          data: { objectStorageSettings: fromEnvSettings },
        });
      }
    } catch (e) {
      console.warn("Could not sync object storage settings from env to DB:", e);
    }
    return fromEnvSettings;
  }
  const settings = await prisma.settings.findFirst();
  return parseFromDb(settings?.objectStorageSettings);
}

/**
 * بررسی اینکه آیا تنظیمات برای آپلود کامل است یا نه.
 */
export function isStorageConfigValid(s: ObjectStorageSettings | null): boolean {
  return !!(
    s?.enabled &&
    s?.endpoint &&
    s?.accessKeyId &&
    s?.secretAccessKey &&
    s?.bucket
  );
}
