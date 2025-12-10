import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToLiara } from "@/lib/liara-storage";

const messageSchema = z.object({
  content: z.string().min(1, "محتوا الزامی است"),
});

// بررسی نوع فایل مجاز
function isAllowedFileType(fileType: string): boolean {
  const allowedTypes = [
    'image/', // همه تصاویر
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/zip',
    'application/x-rar-compressed',
  ];
  
  return allowedTypes.some(type => fileType.startsWith(type));
}

// GET - دریافت پیام‌های یک اعلان
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;

    // بررسی وجود اعلان
    const announcement = await prisma.announcement.findUnique({
      where: { id: resolvedParams.id },
      include: {
        department: true,
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "اعلان یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: کاربر باید در بخش اعلان باشد یا اعلان عمومی باشد
    if (announcement.departmentId) {
      if (session.user.role !== "ADMIN" && session.user.departmentId !== announcement.departmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // دریافت پیام‌ها
    const messages = await prisma.announcementMessage.findMany({
      where: { announcementId: resolvedParams.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching announcement messages:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پیام‌ها" },
      { status: 500 }
    );
  }
}

// POST - اضافه کردن پیام به اعلان
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام اضافه کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;

    // بررسی اینکه آیا FormData است یا JSON
    const contentType = req.headers.get("content-type") || "";
    let data: { content: string };
    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // اگر FormData است، فایل را آپلود کن
      const formData = await req.formData();
      const content = formData.get("content") as string | null;
      
      if (!content) {
        return NextResponse.json(
          { error: "محتوا الزامی است" },
          { status: 400 }
        );
      }

      data = { content };

      // فقط ADMIN می‌تواند فایل اضافه کند
      if (session.user.role === "ADMIN") {
        const file = formData.get("attachment") as File | null;
        
        if (file && file.size > 0) {
          // بررسی نوع فایل
          if (!isAllowedFileType(file.type)) {
            return NextResponse.json(
              { error: "نوع فایل مجاز نیست. فایل‌های مجاز: تصاویر، PDF، Word، ZIP، RAR" },
              { status: 400 }
            );
          }

          // بررسی حجم فایل (حداکثر 10MB)
          if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
              { error: "حجم فایل نباید بیشتر از 10 مگابایت باشد" },
              { status: 400 }
            );
          }

          // دریافت تنظیمات Object Storage
          const settings = await prisma.settings.findFirst();
          const objectStorageSettings = settings?.objectStorageSettings
            ? (typeof settings.objectStorageSettings === 'string'
                ? JSON.parse(settings.objectStorageSettings)
                : settings.objectStorageSettings)
            : { enabled: false };

          // بررسی فعال بودن Object Storage
          if (!objectStorageSettings.enabled) {
            return NextResponse.json(
              { error: "Object Storage غیرفعال است. لطفاً در تنظیمات فعال کنید." },
              { status: 400 }
            );
          }

          // آپلود فایل
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = file.name.split('.').pop() || 'bin';
          const fileName = `announcement-message-${timestamp}-${randomString}.${fileExtension}`;

          try {
            attachmentUrl = await uploadToLiara(
              buffer,
              fileName,
              file.type,
              objectStorageSettings,
              'announcements'
            );
            attachmentName = file.name;
            console.log("Announcement message attachment uploaded to Liara:", attachmentUrl);
          } catch (uploadError: any) {
            console.error("Error uploading attachment to Liara:", uploadError);
            return NextResponse.json(
              { error: `خطا در آپلود فایل: ${uploadError.message || "خطای نامشخص"}` },
              { status: 500 }
            );
          }
        }
      }
    } else {
      // اگر JSON است
      const body = await req.json();
      data = messageSchema.parse(body);
    }

    // بررسی وجود اعلان
    const announcement = await prisma.announcement.findUnique({
      where: { id: resolvedParams.id },
      include: {
        department: true,
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "اعلان یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: MANAGER فقط برای بخش خود می‌تواند پیام اضافه کند
    if (session.user.role === "MANAGER") {
      if (announcement.departmentId && announcement.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ایجاد پیام
    const message = await prisma.announcementMessage.create({
      data: {
        announcementId: resolvedParams.id,
        content: data.content,
        createdById: session.user.id,
        attachment: attachmentUrl,
        attachmentName: attachmentName,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // ایجاد نوتیفیکیشن برای کاربران همان بخش‌هایی که اعلان برایشان ارسال شده بود
    try {
      // پیدا کردن کاربران هدف
      let targetUsers: { id: string }[] = [];

      if (announcement.departmentId) {
        // اگر اعلان برای بخش خاصی است، کاربران آن بخش
        targetUsers = await prisma.user.findMany({
          where: {
            departmentId: announcement.departmentId,
            isActive: true,
            role: "EMPLOYEE", // فقط کارمندان
          },
          select: {
            id: true,
          },
        });
      } else {
        // اگر اعلان عمومی است، همه کارمندان
        targetUsers = await prisma.user.findMany({
          where: {
            isActive: true,
            role: "EMPLOYEE",
          },
          select: {
            id: true,
          },
        });
      }

      // ایجاد نوتیفیکیشن برای هر کاربر
      const notificationPromises = targetUsers.map((user) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: "پیام جدید به اعلان",
            content: `پیام جدیدی به اعلان "${announcement.title}" اضافه شد.`,
            type: "INFO",
          },
        })
      );

      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error("Error creating notifications:", notificationError);
      // ادامه می‌دهیم حتی اگر خطا رخ دهد
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating announcement message:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد پیام" },
      { status: 500 }
    );
  }
}


