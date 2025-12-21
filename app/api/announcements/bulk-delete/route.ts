import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - حذف گروهی اعلانات
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ADMIN می‌تواند حذف گروهی انجام دهد
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

    // حذف پیام‌های مرتبط با اعلانات
    await prisma.announcement_messages.deleteMany({
      where: {
        announcementId: { in: ids },
      },
    });

    // حذف بازدیدهای مرتبط با اعلانات
    await prisma.announcement_views.deleteMany({
      where: {
        announcementId: { in: ids },
      },
    });

    // حذف اعلانات
    const result = await prisma.announcements.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} اعلان با موفقیت حذف شد`,
    });
  } catch (error) {
    console.error("Error bulk deleting announcements:", error);
    return NextResponse.json(
      {
        error: "خطا در حذف گروهی اعلانات",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
