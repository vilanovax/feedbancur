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

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // حداکثر 100
    const skip = (page - 1) * limit;

    // بهینه‌سازی: تعریف include config یکبار - با manager include شده در department
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
    let total = 0;

    try {
      // بهینه‌سازی: اجرای همزمان query و count
      const [feedbacksResult, countResult] = await Promise.all([
        prisma.feedbacks.findMany({
          where,
          include: includeConfig,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.feedbacks.count({ where }),
      ]);

      feedbacks = feedbacksResult;
      total = countResult;
    } catch (error: any) {
      // اگر مشکل از deletedAt است، بدون آن query بزن
      if (
        error?.message?.includes("deletedAt") ||
        error?.message?.includes("Unknown field") ||
        error?.message?.includes("Unknown column") ||
        error?.code === "P2009" ||
        error?.code === "P2011" ||
        error?.code === "P2021"
      ) {
        const whereWithoutDeleted = { ...where };
        delete whereWithoutDeleted.deletedAt;

        const [feedbacksResult, countResult] = await Promise.all([
          prisma.feedbacks.findMany({
            where: whereWithoutDeleted,
            include: includeConfig,
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take: limit,
          }),
          prisma.feedbacks.count({ where: whereWithoutDeleted }),
        ]);

        feedbacks = feedbacksResult;
        total = countResult;
      } else {
        // اگر خطای دیگری است، آن را throw کن تا catch block بیرونی آن را بگیرد
        throw error;
      }
    }

    // بهینه‌سازی N+1: جمع‌آوری همه managerIds و گرفتن آن‌ها با یک query
    const managerIds = new Set<string>();
    feedbacks.forEach((feedback: any) => {
      if (feedback.departments?.managerId) {
        managerIds.add(feedback.departments.managerId);
      }
    });

    // گرفتن اطلاعات managers با یک query (بجای N query)
    let managersMap: Map<string, { id: string; name: string }> = new Map();
    if (managerIds.size > 0) {
      const managers = await prisma.users.findMany({
        where: { id: { in: Array.from(managerIds) } },
        select: { id: true, name: true },
      });
      managers.forEach((m) => managersMap.set(m.id, m));
    }

    // پردازش فیدبک‌ها و تبدیل به فرمت frontend
    const processedFeedbacks = feedbacks.map((feedback: any) => {
      // تبدیل نام‌های Prisma به نام‌های frontend
      // بهینه‌سازی: استفاده از managersMap (یک query بجای N query)
      const department = feedback.departments
        ? {
            id: feedback.departments.id,
            name: feedback.departments.name,
            allowDirectFeedback: feedback.departments.allowDirectFeedback,
            managerId: feedback.departments.managerId,
            manager: feedback.departments.managerId
              ? managersMap.get(feedback.departments.managerId) || null
              : null,
          }
        : null;

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
      if (feedback.isAnonymous && session.user.role !== "ADMIN") {
        processedFeedback.user = {
          id: "anonymous",
          name: "ناشناس",
          mobile: null,
        };
      }
      return processedFeedback;
    });

    // برگرداندن response - backward compatible
    // اگر paginated=true باشد، ساختار جدید با pagination برگردان
    // در غیر این صورت، فقط array برگردان برای سازگاری با frontend فعلی
    const usePagination = searchParams.get("paginated") === "true";

    if (usePagination) {
      return NextResponse.json({
        data: processedFeedbacks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Backward compatible: فقط array برگردان
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
              } catch {
                // اگر آپلود به Object Storage ناموفق بود، به آپلود محلی fallback می‌کنیم
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
              } catch (localUploadError: any) {
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

      validatedData = feedbackSchema.parse(data);
    } else {
      const body = await request.json();
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
    } catch {
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
    } catch (dbError: any) {
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

          if (admins.length > 0) {
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

            await Promise.all(notificationPromises);
          }
        }
      } catch {
        // ادامه می‌دهیم حتی اگر خطا رخ دهد
      }
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
        { error: error.issues[0].message },
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

