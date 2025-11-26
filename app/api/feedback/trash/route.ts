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

    let feedbacks;
    try {
      feedbacks = await (prisma.feedback.findMany as any)({
        where: {
          deletedAt: { not: null },
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
        },
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
        feedbacks = await prisma.feedback.findMany({
          where: {
            status: "ARCHIVED",
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
          },
          orderBy: {
            updatedAt: "desc",
          },
        });
      } else {
        throw dbError;
      }
    }

    // پردازش فیدبک‌های ناشناس
    const processedFeedbacks = feedbacks.map((feedback: any) => {
      if (feedback.isAnonymous) {
        feedback.user = {
          id: "",
          name: "ناشناس",
          mobile: "",
        };
      }
      return feedback;
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
      result = await (prisma.feedback.deleteMany as any)({
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
        result = await prisma.feedback.deleteMany({
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

