import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToLiara } from "@/lib/liara-storage";
// توجه: آپلود محلی حذف شده - فقط از Object Storage استفاده می‌شود

const messageSchema = z.object({
  content: z.string().optional(),
  image: z.string().optional(),
});

// GET - دریافت پیام‌های یک فیدبک با pagination
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام‌ها را ببینند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pagination parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedbacks.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users_feedbacks_forwardedToIdTousers: true,
        departments: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: فقط برای فیدبک‌های ارجاع شده
    if (!feedback.forwardedToId) {
      return NextResponse.json(
        { error: "این فیدبک ارجاع نشده است" },
        { status: 403 }
      );
    }

    // ADMIN می‌تواند همه فیدبک‌های ارجاع شده را ببیند
    // MANAGER فقط فیدبک‌های ارجاع شده به خودش را می‌بیند
    const hasAccess =
      session.user.role === "ADMIN" ||
      feedback.forwardedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت پیام‌ها با pagination
    const [total, messages] = await Promise.all([
      prisma.messages.count({
        where: { feedbackId: resolvedParams.id },
      }),
      prisma.messages.findMany({
        where: { feedbackId: resolvedParams.id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
    ]);

    // تبدیل users به sender برای سازگاری با frontend
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      sender: msg.users,
    }));

    // علامت‌گذاری پیام‌های خوانده نشده به عنوان خوانده شده
    const unreadMessages = formattedMessages.filter(
      (msg) => !msg.isRead && msg.senderId !== session.user.id
    );

    if (unreadMessages.length > 0) {
      await prisma.messages.updateMany({
        where: {
          id: { in: unreadMessages.map((msg) => msg.id) },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // به‌روزرسانی isRead در پاسخ
      formattedMessages.forEach((msg) => {
        if (unreadMessages.some((um) => um.id === msg.id)) {
          msg.isRead = true;
          msg.readAt = new Date();
        }
      });
    }

    // برگرداندن با اطلاعات pagination
    return NextResponse.json({
      data: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - ارسال پیام جدید
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند پیام ارسال کنند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log("Processing message for feedback:", resolvedParams.id);

    // بررسی اینکه آیا FormData است یا JSON
    const contentType = req.headers.get("content-type") || "";
    console.log("Content-Type:", contentType);
    let data: { content?: string; image?: string };
    
    if (contentType.includes("multipart/form-data")) {
      // اگر FormData است، تصویر را آپلود کن
      const formData = await req.formData();
      const content = formData.get("content") as string | null;
      const imageFile = formData.get("image") as File | null;
      
      console.log("FormData received:", {
        hasContent: !!content,
        hasImage: !!imageFile,
        imageSize: imageFile?.size,
        imageType: imageFile?.type,
      });
    
      let imageUrl: string | undefined;
      
      if (imageFile && imageFile.size > 0) {
        // دریافت تنظیمات چت و Object Storage
        const settings = await prisma.settings.findFirst();
        const chatSettings = settings?.chatSettings
          ? (typeof settings.chatSettings === 'string'
              ? JSON.parse(settings.chatSettings)
              : settings.chatSettings)
          : { maxFileSize: 5, allowedFileTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"] };
        
        const objectStorageSettings = settings?.objectStorageSettings
          ? (typeof settings.objectStorageSettings === 'string'
              ? JSON.parse(settings.objectStorageSettings)
              : settings.objectStorageSettings)
          : { enabled: false };
        
        // بررسی حجم فایل
        const maxSizeBytes = (chatSettings.maxFileSize || 5) * 1024 * 1024; // تبدیل به بایت
        if (imageFile.size > maxSizeBytes) {
          return NextResponse.json(
            { error: `حجم فایل نباید بیشتر از ${chatSettings.maxFileSize || 5} مگابایت باشد` },
            { status: 400 }
          );
        }
        
        // بررسی فرمت فایل
        const allowedTypes = chatSettings.allowedFileTypes || ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            { error: `فرمت فایل مجاز نیست. فرمت‌های مجاز: ${allowedTypes.join(", ")}` },
            { status: 400 }
          );
        }
        
        // آپلود تصویر
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        // استخراج پسوند فایل از نام یا نوع MIME
        let fileExtension = 'jpg';
        if (imageFile.name && imageFile.name.includes('.')) {
          fileExtension = imageFile.name.split('.').pop() || 'jpg';
        } else if (imageFile.type) {
          // استخراج پسوند از MIME type
          const mimeToExt: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
          };
          fileExtension = mimeToExt[imageFile.type] || 'jpg';
        }
        const fileName = `message-${timestamp}-${randomString}.${fileExtension}`;
        
        // بررسی کامل بودن تنظیمات Object Storage
        const hasValidObjectStorage =
          objectStorageSettings.enabled &&
          objectStorageSettings.accessKeyId &&
          objectStorageSettings.secretAccessKey &&
          objectStorageSettings.endpoint &&
          objectStorageSettings.bucket;

        if (hasValidObjectStorage) {
          // آپلود به Object Storage (لیارا / MinIO)
          try {
            imageUrl = await uploadToLiara(
              buffer,
              fileName,
              imageFile.type,
              objectStorageSettings,
              "messages"
            );
            console.log("✅ Image uploaded to Object Storage:", imageUrl);
          } catch (storageError: any) {
            console.warn("⚠️  Object Storage upload failed, falling back to local storage:", storageError.message);
            // Fallback: ذخیره لوکال
            const fs = await import("fs/promises");
            const path = await import("path");

            const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
            await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

            const filePath = path.join(uploadDir, fileName);
            await fs.writeFile(filePath, buffer);
            imageUrl = `/uploads/messages/${fileName}`;
            console.log("✅ Image saved locally:", imageUrl);
          }
        } else {
          // Fallback: ذخیره لوکال در صورت عدم تنظیم Object Storage
          console.warn("⚠️  Object Storage not configured, saving locally");

          const fs = await import("fs/promises");
          const path = await import("path");

          const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
          await fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, buffer);
          imageUrl = `/uploads/messages/${fileName}`;
          console.log("✅ Image saved locally:", imageUrl);
        }
      }
      
      data = {
        content: content || undefined,
        image: imageUrl,
      };
      console.log("Data prepared from FormData:", {
        hasContent: !!data.content,
        contentLength: data.content?.length || 0,
        hasImage: !!data.image,
      });
    } else {
      // اگر JSON است
      try {
        const body = await req.json();
        data = messageSchema.parse(body);
        console.log("Data prepared from JSON:", {
          hasContent: !!data.content,
          contentLength: data.content?.length || 0,
          hasImage: !!data.image,
        });
      } catch (jsonError: any) {
        console.error("Error parsing JSON body:", jsonError);
        return NextResponse.json(
          { error: "فرمت درخواست نامعتبر است" },
          { status: 400 }
        );
      }
    }
    
    console.log("Final data before validation:", {
      hasContent: !!data.content,
      contentValue: data.content,
      hasImage: !!data.image,
    });
    
    // حداقل یکی از content یا image باید وجود داشته باشد
    if ((!data.content || data.content.trim() === "") && !data.image) {
      return NextResponse.json(
        { error: "متن پیام یا تصویر الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود فیدبک و دسترسی
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users_feedbacks_forwardedToIdTousers: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: فقط برای فیدبک‌های ارجاع شده
    if (!feedback.forwardedToId) {
      return NextResponse.json(
        { error: "این فیدبک ارجاع نشده است" },
        { status: 403 }
      );
    }

    // ADMIN می‌تواند به همه فیدبک‌های ارجاع شده پیام بفرستد
    // MANAGER فقط به فیدبک‌های ارجاع شده به خودش می‌تواند پیام بفرستد
    const hasAccess =
      session.user.role === "ADMIN" ||
      feedback.forwardedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ایجاد پیام
    try {
      const message = await prisma.messages.create({
        data: {
          id: crypto.randomUUID(),
          feedbackId: resolvedParams.id,
          senderId: session.user.id,
          content: (data.content && data.content.trim()) ? data.content.trim() : "",
          image: data.image || null,
          updatedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // تبدیل users به sender برای سازگاری با frontend
      const formattedMessage = {
        ...message,
        sender: message.users,
      };

      console.log("Message created successfully:", {
        id: message.id,
        hasContent: !!message.content,
        hasImage: !!message.image,
      });

      // ایجاد نوتیفیکیشن برای گیرنده پیام
      try {
        const senderName = session.user.name || "کاربر";
        const messagePreview = message.content
          ? (message.content.length > 50 ? message.content.substring(0, 50) + "..." : message.content)
          : "تصویر";

        if (session.user.role === "ADMIN") {
          // ادمین پیام فرستاده → نوتیفیکیشن به مدیر (forwardedToId)
          if (feedback.forwardedToId) {
            await prisma.notifications.create({
              data: {
                userId: feedback.forwardedToId,
                feedbackId: resolvedParams.id,
                title: "پیام جدید از مدیریت",
                content: `${senderName}: ${messagePreview}`,
                type: "INFO",
                redirectUrl: `/mobile/manager/forwarded?openChat=${resolvedParams.id}`,
              },
            });
          }
        } else if (session.user.role === "MANAGER") {
          // مدیر پیام فرستاده → نوتیفیکیشن به همه ادمین‌ها
          const admins = await prisma.users.findMany({
            where: { role: "ADMIN", isActive: true },
            select: { id: true },
          });

          await Promise.all(
            admins.map((admin) =>
              prisma.notifications.create({
                data: {
                  userId: admin.id,
                  feedbackId: resolvedParams.id,
                  title: "پیام جدید در چت فیدبک",
                  content: `${senderName}: ${messagePreview}`,
                  type: "INFO",
                  redirectUrl: `/feedback/with-chat?openChat=${resolvedParams.id}`,
                },
              })
            )
          );
        }
      } catch (notifError) {
        console.error("Error creating notification for message:", notifError);
        // ادامه می‌دهیم حتی اگر نوتیفیکیشن ایجاد نشود
      }

      return NextResponse.json(formattedMessage, { status: 201 });
    } catch (dbError: any) {
      console.error("Database error creating message:", dbError);
      return NextResponse.json(
        { 
          error: "خطا در ایجاد پیام",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating message:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

