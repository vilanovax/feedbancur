import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadToLiara } from "@/lib/liara-storage";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const feedbackSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  content: z.string().min(1, "محتوا الزامی است"),
  type: z.string().min(1, "نوع فیدبک الزامی است").default('SUGGESTION'),
  isAnonymous: z.boolean().default(false),
  departmentId: z.string().min(1, "بخش الزامی است"),
  image: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const forwardedToMe = searchParams.get("forwardedToMe") === "true";
    const receivedFeedbacks = searchParams.get("receivedFeedbacks") === "true"; // فیدبک‌های دریافتی مدیر

    const where: any = {};
    
    // فقط فیدبک‌های حذف نشده
    // Note: اگر فیلد deletedAt در دیتابیس وجود نداشته باشد، در catch block حذف می‌شود
    where.deletedAt = null;
    
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    
    // اگر مدیر می‌خواهد فیدبک‌های دریافتی (ارجاع شده + مستقیم به بخش) را ببیند
    if (receivedFeedbacks && session.user.role === "MANAGER") {
      // فیدبک‌هایی که به این مدیر ارجاع شده‌اند (شامل ارجاع دستی و مستقیم)
      where.forwardedToId = session.user.id;
      where.status = { not: "ARCHIVED" }; // غیر آرشیو
    }
    // اگر مدیر می‌خواهد فیدبک‌های ارجاع شده به خودش را ببیند
    else if (forwardedToMe && session.user.role === "MANAGER") {
      where.forwardedToId = session.user.id;
      // حذف فیدبک‌های انجام شده از نتایج ارجاع شده
      where.status = { not: "COMPLETED" };
    } 
    // کارمند فقط فیدبک‌های خودش را می‌بیند
    else if (session.user.role === "EMPLOYEE") {
      where.userId = session.user.id;
    } 
    // مدیر در حالت عادی: فقط فیدبک‌های خودش + فیدبک‌های ارجاع شده به او
    // مدیر نباید همه فیدبک‌های بخش خودش را ببیند، فقط فیدبک‌هایی که به او ارجاع شده‌اند
    else if (session.user.role === "MANAGER") {
      // فقط فیدبک‌های خود مدیر + فیدبک‌های ارجاع شده به مدیر
      where.OR = [
        { userId: session.user.id },
        { forwardedToId: session.user.id },
      ];
    }

    console.log("Fetching feedbacks with where:", JSON.stringify(where, null, 2));

    // بهینه‌سازی: تعریف include config یکبار
    const includeConfig = {
      users_feedbacks_userIdTousers: {
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
          allowDirectFeedback: true,
          managerId: true,
        },
      },
      users_feedbacks_forwardedToIdTousers: {
        select: {
          id: true,
          name: true,
        },
      },
      users_feedbacks_completedByIdTousers: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    };

    let feedbacks;
    try {
      feedbacks = await prisma.feedbacks.findMany({
        where,
        include: includeConfig,
        orderBy: {
          createdAt: "desc",
        },
        // محدود کردن تعداد نتایج برای مدیر (می‌تواند بعداً pagination اضافه شود)
        ...(receivedFeedbacks && session.user.role === "MANAGER" ? { take: 100 } : {}),
      });
      console.log("Found", feedbacks.length, "feedbacks");
    } catch (error: any) {
      console.error("Error fetching feedbacks (inner catch):", error);
      console.error("Error message:", error?.message);
      console.error("Error code:", error?.code);
      // اگر مشکل از deletedAt است، بدون آن query بزن
      if (
        error?.message?.includes("deletedAt") || 
        error?.message?.includes("Unknown field") ||
        error?.message?.includes("Unknown column") ||
        error?.code === "P2009" || 
        error?.code === "P2011" ||
        error?.code === "P2021"
      ) {
        console.warn("deletedAt field error, trying without it");
        const whereWithoutDeleted = { ...where };
        delete whereWithoutDeleted.deletedAt;
        feedbacks = await prisma.feedbacks.findMany({
          where: whereWithoutDeleted,
          include: includeConfig,
          orderBy: {
            createdAt: "desc",
          },
          ...(receivedFeedbacks && session.user.role === "MANAGER" ? { take: 100 } : {}),
        });
        console.log("Found", feedbacks.length, "feedbacks (without deletedAt filter)");
      } else {
        // اگر خطای دیگری است، آن را throw کن تا catch block بیرونی آن را بگیرد
        throw error;
      }
    }

    // جمع‌آوری managerId های منحصر به فرد
    const managerIds = new Set<string>();
    feedbacks.forEach((feedback: any) => {
      if (feedback.departments?.managerId) {
        managerIds.add(feedback.departments.managerId);
      }
    });

    console.log("Manager IDs found:", Array.from(managerIds));

    // دریافت اطلاعات مدیران
    const managers = managerIds.size > 0 
      ? await prisma.users.findMany({
          where: {
            id: { in: Array.from(managerIds) },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    console.log("Managers found:", managers);

    // ایجاد map برای دسترسی سریع به مدیر
    const managerMap = new Map(managers.map(m => [m.id, m]));

    // پردازش فیدبک‌ها و تبدیل به فرمت frontend
    const processedFeedbacks = feedbacks.map((feedback: any) => {
      // تبدیل نام‌های Prisma به نام‌های frontend
      const department = feedback.departments ? {
        ...feedback.departments,
        manager: feedback.departments.managerId 
          ? (managerMap.get(feedback.departments.managerId) || null)
          : null,
      } : null;

      // Debug log
      if (feedback.departments?.managerId) {
        console.log(`Department ${feedback.departments.name} (${feedback.departments.id}) has managerId: ${feedback.departments.managerId}`);
        console.log(`Manager found:`, department?.manager);
        if (!department?.manager) {
          console.log(`Manager not found for department ${feedback.departments.id}, managerId: ${feedback.departments.managerId}`);
          console.log(`Manager map has:`, Array.from(managerMap.keys()));
        }
      } else {
        console.log(`Department ${feedback.departments?.name} (${feedback.departments?.id}) has no managerId`);
      }

      const processedFeedback = {
        ...feedback,
        user: feedback.users_feedbacks_userIdTousers,
        department: department,
        forwardedTo: feedback.users_feedbacks_forwardedToIdTousers,
        completedBy: feedback.users_feedbacks_completedByIdTousers,
      };

      // حذف کلیدهای اضافی Prisma
      delete processedFeedback.users_feedbacks_userIdTousers;
      delete processedFeedback.departments;
      delete processedFeedback.users_feedbacks_forwardedToIdTousers;
      delete processedFeedback.users_feedbacks_completedByIdTousers;

      // پردازش فیدبک‌های ناشناس (حذف اطلاعات کاربر اگر isAnonymous = true)
      if (feedback.isAnonymous && session.user.role !== 'ADMIN') {
        processedFeedback.user = {
          id: 'anonymous',
          name: 'ناشناس',
          mobile: null,
        };
      }
      return processedFeedback;
    });

    return NextResponse.json(processedFeedbacks);
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    console.error("Error details:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        code: error?.code
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // بررسی اینکه آیا FormData است یا JSON
    const contentType = request.headers.get("content-type") || "";
    let validatedData: any;
    let imageUrls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageCount = parseInt(formData.get("imageCount") as string) || 0;
      
      // آپلود تصاویر اگر وجود داشته باشند
      if (imageCount > 0) {
        // دریافت تنظیمات Object Storage
        const settings = await prisma.settings.findFirst();
        const objectStorageSettings = settings?.objectStorageSettings
          ? (typeof settings.objectStorageSettings === 'string'
              ? JSON.parse(settings.objectStorageSettings)
              : settings.objectStorageSettings)
          : { enabled: false };

        // بررسی کامل بودن تنظیمات Object Storage
        const hasValidObjectStorage = 
          objectStorageSettings.enabled &&
          objectStorageSettings.accessKeyId &&
          objectStorageSettings.secretAccessKey &&
          objectStorageSettings.endpoint &&
          objectStorageSettings.bucket;

        for (let i = 0; i < imageCount; i++) {
          const imageFile = formData.get(`image_${i}`) as File | null;
          
          if (imageFile && imageFile.size > 0) {
            // بررسی نوع فایل
            if (!imageFile.type.startsWith("image/")) {
              return NextResponse.json(
                { error: "فقط فایل‌های تصویری مجاز هستند" },
                { status: 400 }
              );
            }

            // بررسی اندازه فایل (حداکثر 5MB)
            if (imageFile.size > 5 * 1024 * 1024) {
              return NextResponse.json(
                { error: "حجم هر فایل نباید بیشتر از 5 مگابایت باشد" },
                { status: 400 }
              );
            }

            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // نام فایل
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            // استخراج پسوند فایل از نام یا نوع MIME
            let fileExtension = 'jpg';
            if (imageFile.name && imageFile.name.includes('.')) {
              fileExtension = imageFile.name.split('.').pop() || 'jpg';
            } else if (imageFile.type) {
              const mimeToExt: { [key: string]: string } = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
              };
              fileExtension = mimeToExt[imageFile.type] || 'jpg';
            }
            const filename = `feedback-${timestamp}-${i}-${randomString}.${fileExtension}`;

            let imageUrl: string | undefined;

            if (hasValidObjectStorage) {
              // آپلود به لیارا
              try {
                imageUrl = await uploadToLiara(
                  buffer,
                  filename,
                  imageFile.type,
                  objectStorageSettings,
                  "feedback"
                );
                console.log("Feedback image uploaded to Liara:", imageUrl);
              } catch (uploadError: any) {
                console.error("Error uploading feedback image to Liara:", uploadError);
                // اگر آپلود به Object Storage ناموفق بود، به آپلود محلی fallback می‌کنیم
                console.log("Falling back to local upload...");
              }
            }

            // اگر Object Storage غیرفعال است یا آپلود ناموفق بود، آپلود محلی
            if (!imageUrl) {
              try {
                const uploadsDir = join(process.cwd(), "public", "uploads", "feedback");
                await mkdir(uploadsDir, { recursive: true });

                const filePath = join(uploadsDir, filename);
                await writeFile(filePath, buffer);

                imageUrl = `/uploads/feedback/${filename}`;
                console.log("Feedback image uploaded locally:", imageUrl);
              } catch (localUploadError: any) {
                console.error("Error uploading feedback image locally:", localUploadError);
                return NextResponse.json(
                  { error: `خطا در آپلود تصویر: ${localUploadError.message || "خطای نامشخص"}` },
                  { status: 500 }
                );
              }
            }

            if (imageUrl) {
              imageUrls.push(imageUrl);
            }
          }
        }
      }

      // ساخت object از FormData
      const data = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        type: formData.get("type") as string,
        isAnonymous: formData.get("isAnonymous") === "true",
        departmentId: formData.get("departmentId") as string,
        image: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      };

      console.log("FormData parsed:", {
        hasTitle: !!data.title,
        hasContent: !!data.content,
        type: data.type,
        isAnonymous: data.isAnonymous,
        departmentId: data.departmentId,
        imageCount: imageUrls.length,
      });

      validatedData = feedbackSchema.parse(data);
    } else {
      const body = await request.json();
      console.log("JSON body received:", {
        hasTitle: !!body.title,
        hasContent: !!body.content,
        type: body.type,
      });
      validatedData = feedbackSchema.parse(body);
      // اگر image به صورت array است، آن را به JSON string تبدیل کن
      if (Array.isArray(validatedData.image)) {
        validatedData.image = JSON.stringify(validatedData.image);
      }
    }

    // بررسی بخش و مدیر آن
    let department;
    try {
      department = await prisma.departments.findUnique({
        where: { id: validatedData.departmentId },
        select: {
          id: true,
          name: true,
          allowDirectFeedback: true,
          managerId: true,
          users: {
            where: {
              role: "MANAGER",
            },
            take: 1,
            select: {
              id: true,
            },
          },
        },
      });
    } catch (deptError: any) {
      console.error("Error fetching department:", deptError);
      return NextResponse.json(
        { error: "خطا در دریافت اطلاعات بخش" },
        { status: 500 }
      );
    }

    if (!department) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    // اگر بخش اجازه ارسال مستقیم دارد و مدیر دارد، فیدبک را مستقیم به مدیر ارسال کن
    let forwardedToId = null;
    let isDirectFeedback = false;
    
    if (department?.allowDirectFeedback) {
      // اول از managerId استفاده کن، اگر نبود از users
      if (department.managerId) {
        forwardedToId = department.managerId;
        isDirectFeedback = true;
      } else if (department.users.length > 0) {
        forwardedToId = department.users[0].id;
        isDirectFeedback = true;
      }
      
      console.log("Direct feedback check:", {
        allowDirectFeedback: department.allowDirectFeedback,
        managerId: department.managerId,
        usersCount: department.users.length,
        forwardedToId,
        isDirectFeedback,
      });
    }

    let feedback;
    try {
      feedback = await prisma.feedbacks.create({
        data: {
          title: validatedData.title,
          content: validatedData.content,
          image: validatedData.image,
          type: validatedData.type,
          isAnonymous: validatedData.isAnonymous,
          departmentId: validatedData.departmentId,
          userId: session.user.id,
          forwardedToId: forwardedToId,
          forwardedAt: forwardedToId ? new Date() : null,
          status: forwardedToId ? "REVIEWED" : "PENDING",
        },
      include: {
        users_feedbacks_userIdTousers: {
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
            allowDirectFeedback: true,
          },
        },
        users_feedbacks_forwardedToIdTousers: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      });
      console.log("Feedback created successfully:", {
        id: feedback.id,
        title: feedback.title,
        departmentId: feedback.departmentId,
        forwardedToId: feedback.forwardedToId,
      });
    } catch (dbError: any) {
      console.error("Database error creating feedback:", dbError);
      console.error("Error details:", dbError.message);
      console.error("Error code:", dbError.code);
      return NextResponse.json(
        { 
          error: "خطا در ایجاد فیدبک",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // اگر فیدبک مستقیم به بخش ارسال شد، نوتیفیکیشن برای ادمین ایجاد کن (بر اساس تنظیمات)
    if (isDirectFeedback && forwardedToId) {
      try {
        // بررسی تنظیمات نوتیفیکیشن
        const settings = await prisma.settings.findFirst();
        const notificationSettings = settings?.notificationSettings
          ? (typeof settings.notificationSettings === 'string'
              ? JSON.parse(settings.notificationSettings)
              : settings.notificationSettings)
          : { directFeedbackToManager: true };

        // اگر تنظیمات اجازه می‌دهد، نوتیفیکیشن ایجاد کن
        if (notificationSettings.directFeedbackToManager !== false) {
          console.log("Creating admin notifications for direct feedback:", {
            feedbackId: feedback.id,
            feedbackTitle: feedback.title,
            departmentName: feedback.departments.name,
          });

          // پیدا کردن همه ادمین‌ها
          const admins = await prisma.users.findMany({
            where: {
              role: "ADMIN",
              isActive: true,
            },
            select: {
              id: true,
            },
          });

          console.log("Found admins:", admins.length);

          if (admins.length === 0) {
            console.warn("No active admins found to send notification");
          } else {
            // ایجاد نوتیفیکیشن برای هر ادمین
            const notificationPromises = admins.map((admin) =>
              prisma.notifications.create({
                data: {
                  userId: admin.id,
                  feedbackId: feedback.id,
                  title: "فیدبک مستقیم به بخش",
                  content: `فیدبک "${feedback.title}" به صورت مستقیم به بخش ${feedback.departments.name} ارسال شد.`,
                  type: "INFO",
                  redirectUrl: `/feedback/${feedback.id}`,
                },
              })
            );

            const createdNotifications = await Promise.all(notificationPromises);
            console.log("Created notifications:", createdNotifications.length);
          }
        } else {
          console.log("Admin notification disabled for direct feedback in settings");
        }
      } catch (error) {
        console.error("Error creating admin notifications for direct feedback:", error);
        console.error("Error details:", error instanceof Error ? error.stack : String(error));
        // ادامه می‌دهیم حتی اگر خطا رخ دهد
      }
    } else {
      console.log("Skipping admin notification:", {
        isDirectFeedback,
        forwardedToId,
        allowDirectFeedback: department?.allowDirectFeedback,
      });
    }

    // تبدیل نام‌های Prisma به نام‌های frontend
    const responseFeedback = {
      ...feedback,
      user: (feedback as any).users_feedbacks_userIdTousers,
      department: (feedback as any).departments,
      forwardedTo: (feedback as any).users_feedbacks_forwardedToIdTousers,
    };
    delete (responseFeedback as any).users_feedbacks_userIdTousers;
    delete (responseFeedback as any).departments;
    delete (responseFeedback as any).users_feedbacks_forwardedToIdTousers;

    return NextResponse.json(responseFeedback, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

