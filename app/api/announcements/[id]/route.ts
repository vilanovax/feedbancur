import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToLiara } from "@/lib/liara-storage";

// بررسی نوع فایل مجاز
function isAllowedFileType(fileType: string): boolean {
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-rar-compressed',
  ];
  
  return allowedTypes.some(type => fileType.startsWith(type));
}

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").optional(),
  content: z.string().min(1, "محتوا الزامی است").optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  departmentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
});

// GET - مشاهده جزئیات یک اعلان
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcement = await prisma.announcements.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی
    const canView =
      session.user.role === "ADMIN" ||
      announcement.departmentId === null ||
      announcement.departmentId === session.user.departmentId ||
      announcement.createdById === session.user.id;

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // تبدیل به فرمت frontend
    const responseAnnouncement = {
      ...announcement,
      createdBy: (announcement as any).users,
      department: (announcement as any).departments,
      users: undefined,
      departments: undefined,
    };

    return NextResponse.json(responseAnnouncement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش اعلان
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    
    // بررسی اینکه آیا FormData است یا JSON
    const contentType = req.headers.get('content-type') || '';
    let data: any;
    let newAttachments: Array<{ url: string; name: string }> = [];
    let existingAttachments: Array<{ url: string; name: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      // فقط ADMIN می‌تواند فایل اضافه کند
      if (session.user.role === 'ADMIN') {
        // دریافت فایل‌های موجود (که باید نگه داشته شوند)
        const existingAttachmentsStr = formData.get('existingAttachments') as string;
        if (existingAttachmentsStr) {
          try {
            existingAttachments = JSON.parse(existingAttachmentsStr);
          } catch (e) {
            console.error('Error parsing existing attachments:', e);
          }
        }

        // دریافت تنظیمات Object Storage
        const settings = await prisma.settings.findFirst();
        const objectStorageSettings = settings?.objectStorageSettings
          ? (typeof settings.objectStorageSettings === 'string'
              ? JSON.parse(settings.objectStorageSettings)
              : settings.objectStorageSettings)
          : { enabled: false };

        if (!objectStorageSettings.enabled) {
          return NextResponse.json(
            { error: 'Object Storage غیرفعال است. لطفاً در تنظیمات فعال کنید.' },
            { status: 400 }
          );
        }

        // پردازش فایل‌های جدید
        const fileCount = parseInt(formData.get('fileCount') as string) || 0;
        
        for (let i = 0; i < fileCount; i++) {
          const file = formData.get(`attachment_${i}`) as File | null;
          
          if (file && file.size > 0) {
            if (!isAllowedFileType(file.type)) {
              return NextResponse.json(
                { error: `نوع فایل "${file.name}" مجاز نیست` },
                { status: 400 }
              );
            }

            if (file.size > 10 * 1024 * 1024) {
              return NextResponse.json(
                { error: `حجم فایل "${file.name}" نباید بیشتر از 10 مگابایت باشد` },
                { status: 400 }
              );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.name.split('.').pop() || 'bin';
            const fileName = `announcement-${timestamp}-${i}-${randomString}.${fileExtension}`;

            try {
              const fileUrl = await uploadToLiara(
                buffer,
                fileName,
                file.type,
                objectStorageSettings,
                'announcements'
              );
              newAttachments.push({
                url: fileUrl,
                name: file.name,
              });
            } catch (uploadError: any) {
              console.error('Error uploading attachment:', uploadError);
              return NextResponse.json(
                { error: `خطا در آپلود فایل "${file.name}"` },
                { status: 500 }
              );
            }
          }
        }
      }

      // استخراج داده‌های فرم
      const departmentIdValue = formData.get('departmentId') as string | null;
      data = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        priority: formData.get('priority') as string,
        departmentId: departmentIdValue && departmentIdValue.trim() !== '' ? departmentIdValue : null,
        isActive: formData.get('isActive') === 'true',
        scheduledAt: formData.get('scheduledAt') as string || null,
      };
    } else {
      const body = await req.json();
      data = updateAnnouncementSchema.parse(body);
    }

    // بررسی وجود اعلان
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی ویرایش
    const canEdit =
      session.user.role === "ADMIN" ||
      existingAnnouncement.createdById === session.user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید اعلانات خودتان را ویرایش کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند اعلان را به بخش دیگری منتقل کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId !== undefined &&
      data.departmentId !== null &&
      data.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "شما نمی‌توانید اعلان را به بخش دیگری منتقل کنید" },
        { status: 403 }
      );
    }

    // MANAGER نمی‌تواند اعلان عمومی (برای همه) ایجاد کند
    if (
      session.user.role === "MANAGER" &&
      data.departmentId === null
    ) {
      return NextResponse.json(
        { error: "فقط مدیرعامل می‌تواند اعلان عمومی ایجاد کند" },
        { status: 403 }
      );
    }

    // آماده‌سازی داده‌های بروزرسانی
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.departmentId !== undefined) {
      updateData.departmentId = data.departmentId;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
      // اگر اعلان فعال شد و قبلاً منتشر نشده، زمان انتشار را ثبت کن
      if (data.isActive && !existingAnnouncement.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    // بروزرسانی فایل‌های ضمیمه (فقط برای ADMIN)
    if (session.user.role === 'ADMIN' && (newAttachments.length > 0 || existingAttachments.length >= 0)) {
      const allAttachments = [...existingAttachments, ...newAttachments];
      updateData.attachments = allAttachments.length > 0 ? allAttachments : null;
    }

    // بروزرسانی اعلان
    const updatedAnnouncement = await prisma.announcements.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // تبدیل به فرمت frontend
    const responseAnnouncement = {
      ...updatedAnnouncement,
      createdBy: (updatedAnnouncement as any).users,
      department: (updatedAnnouncement as any).departments,
      users: undefined,
      departments: undefined,
    };

    return NextResponse.json(responseAnnouncement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "خطا در بروزرسانی اعلان" },
      { status: 500 }
    );
  }
}

// DELETE - حذف اعلان
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // بررسی وجود اعلان
    const announcement = await prisma.announcements.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی حذف
    const canDelete =
      session.user.role === "ADMIN" ||
      announcement.createdById === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "شما فقط می‌توانید اعلانات خودتان را حذف کنید" },
        { status: 403 }
      );
    }

    // حذف اعلان
    await prisma.announcements.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "اعلان با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "خطا در حذف اعلان" },
      { status: 500 }
    );
  }
}
