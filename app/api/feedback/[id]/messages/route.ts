import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToLiara } from "@/lib/liara-storage";

const messageSchema = z.object({
  content: z.string().optional(),
  image: z.string().optional(),
});

// GET - دریافت پیام‌های یک فیدبک
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

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      include: {
        forwardedTo: true,
        department: true,
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

    // دریافت پیام‌ها
    const messages = await prisma.message.findMany({
      where: { feedbackId: resolvedParams.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // علامت‌گذاری پیام‌های خوانده نشده به عنوان خوانده شده
    const unreadMessages = messages.filter(
      (msg) => !msg.isRead && msg.senderId !== session.user.id
    );

    if (unreadMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map((msg) => msg.id) },
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // به‌روزرسانی isRead در پاسخ
      messages.forEach((msg) => {
        if (unreadMessages.some((um) => um.id === msg.id)) {
          msg.isRead = true;
          msg.readAt = new Date();
        }
      });
    }

    return NextResponse.json(messages);
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
        const fileExtension = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `message-${timestamp}-${randomString}.${fileExtension}`;
        
        // بررسی فعال بودن Object Storage
        if (!objectStorageSettings.enabled) {
          return NextResponse.json(
            { error: "Object Storage غیرفعال است. لطفاً در تنظیمات فعال کنید." },
            { status: 400 }
          );
        }

        // آپلود به لیارا
        try {
          imageUrl = await uploadToLiara(
            buffer,
            fileName,
            imageFile.type,
            objectStorageSettings,
            "messages"
          );
          console.log("Image uploaded to Liara:", imageUrl);
        } catch (storageError: any) {
          console.error("Error uploading to Liara:", storageError);
          return NextResponse.json(
            { error: `خطا در آپلود تصویر: ${storageError.message || "خطای نامشخص"}` },
            { status: 500 }
          );
        }
      }
      
      data = {
        content: content || undefined,
        image: imageUrl,
      };
    } else {
      // اگر JSON است
      const body = await req.json();
      data = messageSchema.parse(body);
    }
    
    // حداقل یکی از content یا image باید وجود داشته باشد
    if (!data.content && !data.image) {
      return NextResponse.json(
        { error: "متن پیام یا تصویر الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود فیدبک و دسترسی
    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      include: {
        forwardedTo: true,
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
    const message = await prisma.message.create({
      data: {
        feedbackId: resolvedParams.id,
        senderId: session.user.id,
        content: data.content || "",
        image: data.image,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    console.log("Message created with image URL:", message.image);
    return NextResponse.json(message, { status: 201 });
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

