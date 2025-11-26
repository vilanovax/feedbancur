import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - شمارش فیدبک‌های حذف شده (سطل آشغال)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند تعداد سطل آشغال را ببیند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ count: 0 });
    }

    let count;
    try {
      count = await (prisma.feedback.count as any)({
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
        count = await prisma.feedback.count({
          where: {
            status: "ARCHIVED",
          },
        });
      } else {
        // در صورت خطا، 0 برگردان
        count = 0;
      }
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting trash:", error);
    return NextResponse.json({ count: 0 });
  }
}

