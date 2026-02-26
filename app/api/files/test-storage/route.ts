import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadToLiara, deleteFromLiara } from "@/lib/liara-storage";
import { getObjectStorageSettings, isStorageConfigValid } from "@/lib/object-storage-settings";

/**
 * GET /api/files/test-storage
 * تست اتصال به Object Storage (لیارا) و آپلود یک فایل تست
 * فقط ادمین
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "فقط ادمین" }, { status: 403 });
    }

    const storageSettings = await getObjectStorageSettings(prisma);
    if (!isStorageConfigValid(storageSettings)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Object Storage پیکربندی نشده است.",
          details: "متغیرهای LIARA_* را در .env قرار دهید یا از بخش تنظیمات پیکربندی کنید.",
        },
        { status: 400 }
      );
    }

    const testFolder = "test-connection";
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = Buffer.from("Liara Object Storage connection test – " + new Date().toISOString(), "utf-8");

    // آپلود فایل تست
    const url = await uploadToLiara(
      testContent,
      testFileName,
      "text/plain; charset=utf-8",
      storageSettings,
      testFolder
    );

    // حذف فایل تست تا bucket تمیز بماند
    const storagePath = `${testFolder}/${testFileName}`;
    try {
      await deleteFromLiara(storagePath, storageSettings);
    } catch (deleteErr: any) {
      // آپلود موفق بود؛ حذف اختیاری است
      console.warn("Test file upload OK but delete failed:", deleteErr?.message);
    }

    return NextResponse.json({
      ok: true,
      message: "اتصال به Object Storage لیارا موفق بود؛ فایل تست آپلود و سپس حذف شد.",
      uploadedUrl: url,
    });
  } catch (error: any) {
    console.error("Test storage error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "خطای نامشخص",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
