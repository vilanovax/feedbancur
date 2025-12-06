import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const forwardedToMe = searchParams.get("forwardedToMe") === "true";
    const receivedFeedbacks = searchParams.get("receivedFeedbacks") === "true"; // فیدبک‌های دریافتی مدیر

    const where: any = {};
    
    // فقط فیدبک‌های حذف نشده
    where.deletedAt = null;
    
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    
    // اگر مدیر می‌خواهد فیدبک‌های دریافتی (ارجاع شده + مستقیم به بخش) را ببیند
    if (receivedFeedbacks && session.user.role === "MANAGER") {
      const orConditions: any[] = [
        { forwardedToId: session.user.id }, // فیدبک‌های ارجاع شده
      ];
      
      // اگر مدیر بخش دارد، فیدبک‌های مستقیم به بخش را هم اضافه کن
      if (session.user.departmentId) {
        orConditions.push({
          departmentId: session.user.departmentId,
          forwardedToId: null, // فیدبک‌های مستقیم به بخش (بدون ارجاع)
          userId: { not: session.user.id }, // به جز فیدبک‌های خود مدیر
        });
      }
      
      where.OR = orConditions;
      // فیلتر کردن فیدبک‌های آرشیو شده
      where.status = { not: "ARCHIVED" };
    }
    // اگر مدیر می‌خواهد فیدبک‌های ارجاع شده به خودش را ببیند
    else if (forwardedToMe && session.user.role === "MANAGER") {
      where.forwardedToId = session.user.id;
    } 
    // کارمند فقط فیدبک‌های خودش را می‌بیند
    else if (session.user.role === "EMPLOYEE") {
      where.userId = session.user.id;
    } 
    // مدیر در حالت عادی فقط فیدبک‌های خودش را می‌بیند
    else if (session.user.role === "MANAGER") {
      where.userId = session.user.id;
    }

    console.log("Fetching feedbacks with where:", JSON.stringify(where, null, 2));

    let feedbacks;
    try {
      feedbacks = await prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              allowDirectFeedback: true,
            },
          },
          forwardedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          completedBy: {
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log("Found", feedbacks.length, "feedbacks");
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      // اگر مشکل از deletedAt است، بدون آن query بزن
      if (error?.message?.includes("deletedAt") || error?.code === "P2009" || error?.code === "P2011") {
        console.warn("deletedAt field error, trying without it");
        delete where.deletedAt;
        feedbacks = await prisma.feedback.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            forwardedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            completedBy: {
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
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        console.log("Found", feedbacks.length, "feedbacks (without deletedAt filter)");
      } else {
        throw error;
      }
    }

    // پردازش فیدبک‌های ناشناس (حذف اطلاعات کاربر اگر isAnonymous = true)
    const processedFeedbacks = feedbacks.map((feedback) => {
      if (feedback.isAnonymous && session.user.role !== 'ADMIN') {
        return {
          ...feedback,
          user: {
            id: 'anonymous',
            name: 'ناشناس',
            mobile: null,
          },
        };
      }
      return feedback;
    });

    return NextResponse.json(processedFeedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
        // ایجاد پوشه uploads اگر وجود نداشته باشد
        const uploadsDir = join(process.cwd(), "public", "uploads", "feedback");
        if (!existsSync(uploadsDir)) {
          mkdirSync(uploadsDir, { recursive: true });
        }

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
        const extension = imageFile.name.split(".").pop();
            const filename = `feedback-${timestamp}-${i}-${Math.random().toString(36).substring(7)}.${extension}`;
        const filepath = join(uploadsDir, filename);

        // ذخیره فایل
        await writeFile(filepath, buffer);

        // URL فایل
            imageUrls.push(`/uploads/feedback/${filename}`);
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
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
      include: {
        users: {
          where: {
            role: "MANAGER",
          },
          take: 1,
        },
      },
    });

    // اگر بخش اجازه ارسال مستقیم دارد و مدیر دارد، فیدبک را مستقیم به مدیر ارسال کن
    let forwardedToId = null;
    if (department?.allowDirectFeedback && department.users.length > 0) {
      forwardedToId = department.users[0].id;
    }

    const feedback = await prisma.feedback.create({
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
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            allowDirectFeedback: true,
          },
        },
        forwardedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
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

