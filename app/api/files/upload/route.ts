import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  validateFile,
  checkUserStorageQuota,
  checkProjectStorageQuota,
  sanitizeFilename,
  getFileExtension,
  DEFAULT_FILE_SHARE_SETTINGS,
  type FileShareSettings,
} from "@/lib/file-validation";
import { uploadToLiara } from "@/lib/liara-storage";
import { getObjectStorageSettings, isStorageConfigValid } from "@/lib/object-storage-settings";

/**
 * POST /api/files/upload
 * آپلود چند فایل همزمان
 * Body (FormData): files[], folderId?, projectId?, tags?
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    // دریافت FormData
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const tagsJson = formData.get("tags") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "هیچ فایلی انتخاب نشده است" },
        { status: 400 }
      );
    }

    // Parse tags
    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
        if (!Array.isArray(tags)) {
          return NextResponse.json(
            { error: "فرمت تگ‌ها نامعتبر است" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "فرمت تگ‌ها نامعتبر است" },
          { status: 400 }
        );
      }
    }

    // بررسی دسترسی
    if (!projectId) {
      // آپلود سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط ادمین می‌تواند فایل سازمانی آپلود کند" },
          { status: 403 }
        );
      }
    } else {
      // آپلود پروژه - Manager یا Admin
      if (session.user.role === "EMPLOYEE") {
        return NextResponse.json(
          { error: "کاربران عادی نمی‌توانند فایل آپلود کنند" },
          { status: 403 }
        );
      }

      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "شما به این پروژه دسترسی ندارید" },
            { status: 403 }
          );
        }
      }
    }

    // بررسی پوشه (اگر ارائه شده)
    if (folderId) {
      const folder = await prisma.shared_folders.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "پوشه یافت نشد" },
          { status: 404 }
        );
      }

      // بررسی تطابق projectId
      if (folder.projectId !== (projectId || null)) {
        return NextResponse.json(
          { error: "پوشه متعلق به این پروژه نیست" },
          { status: 400 }
        );
      }
    }

    // دریافت تنظیمات (از env یا دیتابیس، به‌صورت اتوماتیک)
    let settings;
    try {
      settings = await prisma.settings.findFirst();
    } catch (dbError: any) {
      console.error("❌ Error fetching settings:", dbError);
      return NextResponse.json(
        { error: "خطا در خواندن تنظیمات از دیتابیس" },
        { status: 500 }
      );
    }

    const fileShareSettings: FileShareSettings =
      (settings?.fileShareSettings as any) || DEFAULT_FILE_SHARE_SETTINGS;

    const objectStorageSettings = await getObjectStorageSettings(prisma);
    if (!isStorageConfigValid(objectStorageSettings)) {
      return NextResponse.json(
        {
          error: "تنظیمات Object Storage انجام نشده است. متغیرهای LIARA_* را در .env قرار دهید یا از بخش تنظیمات پیکربندی کنید.",
          code: "OBJECT_STORAGE_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    const storageSettings = objectStorageSettings;

    // اعتبارسنجی تمام فایل‌ها قبل از آپلود
    const validationErrors: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = await validateFile(file, fileShareSettings);

      if (error) {
        validationErrors.push(`فایل ${i + 1} (${file.name}): ${error}`);
      }

      totalSize += file.size;
    }

    if (validationErrors.length > 0) {
      console.error("❌ File validation errors:", validationErrors);
      return NextResponse.json(
        { error: "خطاهای اعتبارسنجی", errors: validationErrors },
        { status: 400 }
      );
    }

    console.log("✅ File validation passed");

    // بررسی سهمیه کاربر
    const userQuotaError = await checkUserStorageQuota(
      session.user.id,
      totalSize,
      fileShareSettings
    );

    if (userQuotaError) {
      console.error("❌ User quota error:", userQuotaError);
      return NextResponse.json({ error: userQuotaError }, { status: 400 });
    }

    console.log("✅ User quota check passed");

    // بررسی سهمیه پروژه (اگر در پروژه است)
    if (projectId) {
      const projectQuotaError = await checkProjectStorageQuota(
        projectId,
        totalSize,
        fileShareSettings
      );

      if (projectQuotaError) {
        console.error("❌ Project quota error:", projectQuotaError);
        return NextResponse.json(
          { error: projectQuotaError },
          { status: 400 }
        );
      }

      console.log("✅ Project quota check passed");
    }

    // آپلود فایل‌ها
    const uploadedFiles: any[] = [];
    const uploadErrors: string[] = [];

    for (const file of files) {
      try {
        // تبدیل File به Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ساخت نام فایل منحصربفرد
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const ext = getFileExtension(file.name);
        const uniqueFileName = `${timestamp}-${randomStr}${ext}`;

        // تعیین پوشه در Object Storage
        const folderPath = projectId
          ? `shared-files/projects/${projectId}/${folderId || "root"}`
          : `shared-files/org/${folderId || "root"}`;

        // آپلود به Liara
        const fileUrl = await uploadToLiara(
          buffer,
          uniqueFileName,
          file.type,
          storageSettings,
          folderPath
        );

        // ذخیره در دیتابیس
        const storagePath = `${folderPath}/${uniqueFileName}`;
        const sanitizedName = sanitizeFilename(file.name);

        const uploadedFile = await prisma.shared_files.create({
          data: {
            name: sanitizedName,
            originalName: file.name,
            storagePath,
            url: fileUrl,
            size: file.size,
            mimeType: file.type,
            folderId: folderId || null,
            projectId: projectId || null,
            uploadedById: session.user.id,
            tags: tags.length > 0 ? JSON.stringify(tags) : null,
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

        uploadedFiles.push(uploadedFile);
      } catch (uploadError: any) {
        uploadErrors.push(
          `${file.name}: ${uploadError.message || "خطای نامشخص"}`
        );
      }
    }

    if (uploadedFiles.length === 0 && uploadErrors.length > 0) {
      const firstError = uploadErrors[0] || "خطای نامشخص";
      const isConnectionError = /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network|اتصال/i.test(firstError);
      return NextResponse.json(
        {
          error: "آپلود فایل‌ها ناموفق بود.",
          details: firstError,
          errors: uploadErrors,
          ...(isConnectionError && {
            hint: "احتمالاً تنظیمات Object Storage (endpoint/کلیدها) اشتباه است یا سرویس در دسترس نیست. از بخش تنظیمات، endpoint لیارا (مثلاً https://storage.iran.liara.space) و Access Key را وارد کنید.",
          }),
        },
        { status: 500 }
      );
    }

    // موفقیت جزئی یا کامل
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined,
      message:
        uploadErrors.length > 0
          ? `${uploadedFiles.length} فایل با موفقیت آپلود شد، ${uploadErrors.length} فایل با خطا مواجه شد`
          : `${uploadedFiles.length} فایل با موفقیت آپلود شد`,
    });
  } catch (error: any) {
    console.error("Error uploading files:", error);
    const message = error?.message || "خطا در آپلود فایل‌ها";
    return NextResponse.json(
      {
        error: message,
        details: error?.message || undefined,
        ...(process.env.NODE_ENV === "development" && { stack: error?.stack }),
      },
      { status: 500 }
    );
  }
}
