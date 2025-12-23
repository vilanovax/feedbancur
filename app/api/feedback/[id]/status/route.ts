import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "ARCHIVED", "DEFERRED", "COMPLETED"]),
  userResponse: z.string().optional(), // برای وضعیت COMPLETED
  adminNotes: z.string().optional(), // برای وضعیت COMPLETED
});

// PATCH - تغییر وضعیت فیدبک
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN و MANAGER می‌توانند وضعیت را تغییر دهند
    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = statusUpdateSchema.parse(body);

    // بررسی وجود فیدبک
    const feedback = await prisma.feedbacks.findUnique({
      where: { id },
      include: {
        departments: true,
        users_feedbacks_userIdTousers: true,
        users_feedbacks_forwardedToIdTousers: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط می‌تواند فیدبک‌های بخش خودش یا فیدبک‌هایی که به او ارجاع شده‌اند را تغییر دهد
    if (session.user.role === "MANAGER") {
      const hasAccess = 
        feedback.departmentId === session.user.departmentId ||
        feedback.forwardedToId === session.user.id;
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "شما فقط می‌توانید وضعیت فیدبک‌های بخش خود یا فیدبک‌هایی که به شما ارجاع شده‌اند را تغییر دهید" },
          { status: 403 }
        );
      }
    }

    // داده‌های بروزرسانی
    const updateData: any = {
      status: data.status,
    };

    // برای وضعیت COMPLETED
    if (data.status === "COMPLETED") {
      updateData.completedById = session.user.id;
      updateData.completedAt = new Date();
      if (data.userResponse) {
        updateData.userResponse = data.userResponse;
      }
    }

    // بروزرسانی فیدبک
    const updatedFeedback = await prisma.feedbacks.update({
      where: { id },
      data: updateData,
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
          },
        },
        users_feedbacks_completedByIdTousers: {
          select: {
            id: true,
            name: true,
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

    // اگر وضعیت COMPLETED است و پیام‌هایی وجود دارد
    if (data.status === "COMPLETED") {
      // ارسال نوتیفیکیشن برای کاربر (اگر پیام وجود داشته باشد)
      if (data.userResponse && data.userResponse.trim()) {
        try {
          await prisma.notifications.create({
            data: {
              userId: feedback.userId,
              feedbackId: id,
              title: "فیدبک شما تکمیل شد",
              content: data.userResponse.trim(),
              type: "SUCCESS",
              redirectUrl: `/feedback/${id}`,
            },
          });
        } catch (error) {
          console.error("Error creating user notification:", error);
          // ادامه می‌دهیم حتی اگر خطا رخ دهد
        }
      }

      // ارسال یادداشت برای ادمین در چت (اگر فیدبک ارجاع شده باشد)
      if (data.adminNotes && data.adminNotes.trim() && feedback.forwardedToId) {
        try {
          await prisma.messages.create({
            data: {
              feedbackId: id,
              senderId: session.user.id,
              content: `[یادداشت ادمین]: ${data.adminNotes.trim()}`,
              isRead: false,
            },
          });
        } catch (error) {
          console.error("Error creating admin notes message:", error);
          // ادامه می‌دهیم حتی اگر خطا رخ دهد
        }
      }

      // ارسال نوتیفیکیشن به مدیرانی که فیدبک به آن‌ها ارجاع شده
      if (feedback.forwardedToId && feedback.forwardedToId !== session.user.id) {
        try {
          await prisma.notifications.create({
            data: {
              userId: feedback.forwardedToId,
              feedbackId: id,
              title: "فیدبک تمام شد",
              content: `فیدبک "${feedback.title}" شما توسط ${updatedFeedback.departments?.name || "نامشخص"} انجام شد.`,
              type: "SUCCESS",
              redirectUrl: `/feedback/${id}`,
            },
          });
        } catch (error) {
          console.error("Error creating manager notification:", error);
          // ادامه می‌دهیم حتی اگر خطا رخ دهد
        }
      }

      // ارسال نوتیفیکیشن به همه ادمین‌ها وقتی مدیر وضعیت را به COMPLETED تغییر می‌دهد (بر اساس تنظیمات)
      if (session.user.role === "MANAGER") {
        try {
          // بررسی تنظیمات نوتیفیکیشن
          const settings = await prisma.settings.findFirst();
          const notificationSettings = settings?.notificationSettings
            ? (typeof settings.notificationSettings === 'string'
                ? JSON.parse(settings.notificationSettings)
                : settings.notificationSettings)
            : { feedbackCompletedByManager: true };

          // اگر تنظیمات اجازه می‌دهد، نوتیفیکیشن ایجاد کن
          if (notificationSettings.feedbackCompletedByManager !== false) {
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

            // ایجاد نوتیفیکیشن برای هر ادمین
            const notificationPromises = admins.map((admin) =>
              prisma.notifications.create({
                data: {
                  userId: admin.id,
                  feedbackId: id,
                  title: "فیدبک تکمیل شد",
                  content: `فیدبک "${feedback.title}" توسط مدیر ${updatedFeedback.users_feedbacks_completedByIdTousers?.name || "نامشخص"} به وضعیت انجام شد تغییر یافت.`,
                  type: "INFO",
                  redirectUrl: `/feedback/${id}`,
                },
              })
            );

            await Promise.all(notificationPromises);
          } else {
            console.log("Admin notification disabled for feedback completed by manager in settings");
          }
        } catch (error) {
          console.error("Error creating admin notifications:", error);
          // ادامه می‌دهیم حتی اگر خطا رخ دهد
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "وضعیت فیدبک با موفقیت تغییر کرد",
      feedback: updatedFeedback,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating feedback status:", error);
    return NextResponse.json(
      { error: "خطا در تغییر وضعیت فیدبک" },
      { status: 500 }
    );
  }
}
