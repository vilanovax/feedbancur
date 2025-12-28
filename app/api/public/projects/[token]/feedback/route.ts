import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToLiara } from "@/lib/liara-storage";
import { randomUUID } from "crypto";

// POST - ثبت فیدبک عمومی
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // پیدا کردن پروژه
    const project = await prisma.projects.findUnique({
      where: { token },
      select: {
        id: true,
        isPublic: true,
        requireLogin: true,
        allowAnonymous: true,
        isActive: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    if (!project.isActive) {
      return NextResponse.json(
        { error: "این پروژه غیرفعال است" },
        { status: 403 }
      );
    }

    if (!project.isPublic) {
      return NextResponse.json(
        { error: "این پروژه عمومی نیست" },
        { status: 403 }
      );
    }

    // بررسی نیاز به لاگین
    const session = await getServerSession(authOptions);

    if (project.requireLogin && !session?.user) {
      return NextResponse.json(
        { error: "برای ارسال فیدبک باید وارد شوید" },
        { status: 401 }
      );
    }

    // دریافت داده‌ها
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as string || "SUGGESTION";
    const isAnonymous = formData.get("isAnonymous") === "true";
    const senderName = formData.get("senderName") as string | null;
    const senderEmail = formData.get("senderEmail") as string | null;
    const imageFile = formData.get("image") as File | null;

    // اعتبارسنجی
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "عنوان الزامی است" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "محتوا الزامی است" },
        { status: 400 }
      );
    }

    // اگر ناشناس نیست و لاگین نشده، نام یا ایمیل لازم است
    if (!isAnonymous && !session?.user && !senderName && !senderEmail) {
      if (!project.allowAnonymous) {
        return NextResponse.json(
          { error: "نام یا ایمیل الزامی است" },
          { status: 400 }
        );
      }
    }

    // آپلود تصویر اگر وجود دارد
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      // بررسی نوع فایل
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "فقط فایل‌های تصویری مجاز هستند" },
          { status: 400 }
        );
      }

      // بررسی اندازه (حداکثر 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "حجم تصویر نباید بیشتر از 5 مگابایت باشد" },
          { status: 400 }
        );
      }

      // دریافت تنظیمات Object Storage
      const settings = await prisma.settings.findFirst();
      const objectStorageSettings = settings?.objectStorageSettings
        ? (typeof settings.objectStorageSettings === "string"
            ? JSON.parse(settings.objectStorageSettings)
            : settings.objectStorageSettings)
        : { enabled: false };

      if (objectStorageSettings.enabled) {
        try {
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const ext = imageFile.name.split(".").pop() || "jpg";
          const filename = `project-feedback-${timestamp}.${ext}`;

          imageUrl = await uploadToLiara(
            buffer,
            filename,
            imageFile.type,
            objectStorageSettings,
            "project-feedbacks"
          );
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          // ادامه بدون تصویر
        }
      }
    }

    // ایجاد فیدبک
    const feedback = await prisma.project_feedbacks.create({
      data: {
        id: randomUUID(),
        projectId: project.id,
        title: title.trim(),
        content: content.trim(),
        type,
        image: imageUrl ? JSON.stringify([imageUrl]) : null,
        isAnonymous: isAnonymous || (!session?.user && project.allowAnonymous),
        senderName: isAnonymous ? null : senderName?.trim() || null,
        senderEmail: isAnonymous ? null : senderEmail?.trim() || null,
        userId: session?.user?.id || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "فیدبک شما با موفقیت ثبت شد",
        id: feedback.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project feedback:", error);
    return NextResponse.json(
      { error: "خطا در ثبت فیدبک" },
      { status: 500 }
    );
  }
}
