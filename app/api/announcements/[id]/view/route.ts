import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// POST - ثبت بازدید اعلان
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // بررسی وجود اعلان
    const announcement = await prisma.announcements.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "اعلان یافت نشد" },
        { status: 404 }
      );
    }

    // ثبت بازدید (اگر قبلاً ثبت نشده باشد)
    const view = await prisma.announcement_views.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: session.user.id,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        announcementId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(view);
  } catch (error) {
    console.error("Error recording announcement view:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
