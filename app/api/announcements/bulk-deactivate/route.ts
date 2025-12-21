import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - غیرفعال کردن گروهی اعلانات
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند غیرفعال کردن گروهی انجام دهد
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "لیست اعلانات معتبر نیست" },
        { status: 400 }
      );
    }

    // غیرفعال کردن اعلانات
    const result = await prisma.announcements.updateMany({
      where: {
        id: { in: ids },
        isActive: true, // فقط اعلانات فعال
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} اعلان با موفقیت غیرفعال شد`,
    });
  } catch (error) {
    console.error("Error bulk deactivating announcements:", error);
    return NextResponse.json(
      {
        error: "خطا در غیرفعال کردن گروهی اعلانات",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
