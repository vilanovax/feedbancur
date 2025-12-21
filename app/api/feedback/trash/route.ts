import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت فیدبک‌های حذف شده (سطل آشغال)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند سطل آشغال را ببیند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    };

    let feedbacks;
    try {
      feedbacks = await (prisma.feedbacks.findMany as any)({
        where: {
          deletedAt: { not: null },
        },
        include: includeConfig,
        orderBy: {
          deletedAt: "desc",
        },
      });
      console.log("Found", feedbacks.length, "deleted feedbacks");
    } catch (dbError: any) {
      console.error("Error fetching trash:", dbError);
      // اگر فیلد deletedAt وجود نداشت، از status ARCHIVED استفاده کن
      if (
        dbError?.message?.includes("deletedAt") ||
        dbError?.code === "P2009" ||
        dbError?.code === "P2011" ||
        dbError?.message?.includes("Unknown field")
      ) {
        console.warn("deletedAt field not found, using ARCHIVED status");
        feedbacks = await prisma.feedbacks.findMany({
          where: {
            status: "ARCHIVED",
          },
          include: includeConfig,
          orderBy: {
            updatedAt: "desc",
          },
        });
      } else {
        throw dbError;
      }
    }

    // پردازش فیدبک‌ها و تبدیل به فرمت frontend
    const processedFeedbacks = feedbacks.map((feedback: any) => {
      const processed = {
        ...feedback,
        user: feedback.users_feedbacks_userIdTousers,
        department: feedback.departments,
        forwardedTo: feedback.users_feedbacks_forwardedToIdTousers,
        completedBy: feedback.users_feedbacks_completedByIdTousers,
      };

      // حذف کلیدهای Prisma
      delete processed.users_feedbacks_userIdTousers;
      delete processed.departments;
      delete processed.users_feedbacks_forwardedToIdTousers;
      delete processed.users_feedbacks_completedByIdTousers;

      // پردازش فیدبک‌های ناشناس
      if (feedback.isAnonymous) {
        processed.user = {
          id: "",
          name: "ناشناس",
          mobile: "",
        };
      }
      return processed;
    });

    return NextResponse.json(processedFeedbacks);
  } catch (error) {
    console.error("Error fetching trash:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فیدبک‌های حذف شده" },
      { status: 500 }
    );
  }
}

// DELETE - خالی کردن سطل آشغال
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند سطل آشغال را خالی کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // حذف کامل همه فیدبک‌های حذف شده
    let result;
    try {
      result = await (prisma.feedbacks.deleteMany as any)({
        where: {
          deletedAt: { not: null },
        },
      });
    } catch (dbError: any) {
      // اگر فیلد deletedAt وجود نداشت، از status ARCHIVED استفاده کن
      if (
        dbError?.message?.includes("deletedAt") ||
        dbError?.code === "P2009" ||
        dbError?.code === "P2011" ||
        dbError?.message?.includes("Unknown field")
      ) {
        result = await prisma.feedbacks.deleteMany({
          where: {
            status: "ARCHIVED",
          },
        });
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} فیدبک با موفقیت حذف شد`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error emptying trash:", error);
    return NextResponse.json(
      { error: "خطا در خالی کردن سطل آشغال" },
      { status: 500 }
    );
  }
}

