import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - انتشار پیش‌نویس (فقط ADMIN)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // بررسی وجود
    const existingUpdate = await prisma.updates.findUnique({
      where: { id },
    });

    if (!existingUpdate) {
      return NextResponse.json(
        { error: "اطلاع‌رسانی یافت نشد" },
        { status: 404 }
      );
    }

    if (!existingUpdate.isDraft) {
      return NextResponse.json(
        { error: "این اطلاع‌رسانی قبلاً منتشر شده است" },
        { status: 400 }
      );
    }

    const update = await prisma.updates.update({
      where: { id },
      data: {
        isDraft: false,
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: update.id,
      title: update.title,
      isDraft: update.isDraft,
      isPublished: update.isPublished,
      publishedAt: update.publishedAt,
      message: "اطلاع‌رسانی با موفقیت منتشر شد",
    });
  } catch (error) {
    console.error("Error publishing update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
