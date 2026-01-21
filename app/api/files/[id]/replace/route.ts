import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  validateFile,
  getFileExtension,
  DEFAULT_FILE_SHARE_SETTINGS,
  type FileShareSettings,
} from "@/lib/file-validation";
import { uploadToLiara, deleteFromLiara } from "@/lib/liara-storage";

/**
 * POST /api/files/[id]/replace
 * جایگزینی فایل (حذف فایل قدیمی + آپلود فایل جدید)
 * Body (FormData): file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const file = await prisma.shared_files.findUnique({
      where: { id: params.id },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const isOwner = file.uploadedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "فقط آپلودکننده فایل یا ادمین می‌تواند آن را جایگزین کند" },
        { status: 403 }
      );
    }

    // بررسی عضویت در پروژه (اگر فایل پروژه‌ای است)
    if (file.projectId && session.user.role !== "ADMIN") {
      const membership = await prisma.project_members.findUnique({
        where: {
          projectId_userId: {
            projectId: file.projectId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    // دریافت فایل جدید از FormData
    const formData = await request.formData();
    const newFile = formData.get("file") as File;

    if (!newFile) {
      return NextResponse.json(
        { error: "فایل جدید ارسال نشده است" },
        { status: 400 }
      );
    }

    // دریافت تنظیمات
    const settings = await prisma.settings.findFirst();
    const fileShareSettings: FileShareSettings =
      (settings?.fileShareSettings as any) || DEFAULT_FILE_SHARE_SETTINGS;

    const objectStorageSettings = settings?.objectStorageSettings as any;

    if (
      !objectStorageSettings?.enabled ||
      !objectStorageSettings?.accessKeyId ||
      !objectStorageSettings?.secretAccessKey ||
      !objectStorageSettings?.endpoint ||
      !objectStorageSettings?.bucket
    ) {
      return NextResponse.json(
        { error: "تنظیمات Object Storage انجام نشده است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی فایل جدید
    const validationError = await validateFile(newFile, fileShareSettings);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // تبدیل File به Buffer
    const bytes = await newFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ساخت نام فایل منحصربفرد
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const ext = getFileExtension(newFile.name);
    const uniqueFileName = `${timestamp}-${randomStr}${ext}`;

    // تعیین پوشه در Object Storage (همان پوشه فایل قبلی)
    const folderPath = file.projectId
      ? `shared-files/projects/${file.projectId}/${file.folderId || "root"}`
      : `shared-files/org/${file.folderId || "root"}`;

    try {
      // آپلود فایل جدید
      const newFileUrl = await uploadToLiara(
        buffer,
        uniqueFileName,
        newFile.type,
        objectStorageSettings,
        folderPath
      );

      // حذف فایل قدیمی از Object Storage
      try {
        await deleteFromLiara(file.storagePath, objectStorageSettings);
      } catch (deleteError) {
        console.error("Error deleting old file from storage:", deleteError);
        // ادامه می‌دهیم حتی اگر حذف فایل قدیمی با مشکل مواجه شود
      }

      // به‌روزرسانی رکورد دیتابیس
      const newStoragePath = `${folderPath}/${uniqueFileName}`;

      const updatedFile = await prisma.shared_files.update({
        where: { id: params.id },
        data: {
          storagePath: newStoragePath,
          url: newFileUrl,
          size: newFile.size,
          mimeType: newFile.type,
          originalName: newFile.name,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          folders: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Parse tags
      const fileWithTags = {
        ...updatedFile,
        tags: updatedFile.tags ? JSON.parse(updatedFile.tags) : [],
      };

      return NextResponse.json({
        success: true,
        file: fileWithTags,
        message: "فایل با موفقیت جایگزین شد",
      });
    } catch (uploadError: any) {
      return NextResponse.json(
        {
          error: `خطا در آپلود فایل جدید: ${uploadError.message || "خطای نامشخص"}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error replacing file:", error);
    return NextResponse.json(
      { error: "خطا در جایگزینی فایل" },
      { status: 500 }
    );
  }
}
