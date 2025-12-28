import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت جزئیات یک اطلاع‌رسانی
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const update = await prisma.updates.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
          },
        },
      },
    });

    if (!update) {
      return NextResponse.json(
        { error: "اطلاع‌رسانی یافت نشد" },
        { status: 404 }
      );
    }

    // اگر پیش‌نویس است، فقط ادمین می‌تواند ببیند
    if (update.isDraft && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: update.id,
      title: update.title,
      content: update.content,
      summary: update.summary,
      category: update.category,
      source: update.source,
      tags: update.tags,
      imageUrl: update.imageUrl,
      isDraft: update.isDraft,
      isPublished: update.isPublished,
      publishedAt: update.publishedAt,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
      createdBy: update.users,
      feedback: update.feedbacks,
    });
  } catch (error) {
    console.error("Error fetching update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - ویرایش اطلاع‌رسانی (فقط ADMIN)
export async function PUT(
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
    const body = await request.json();
    const { title, content, summary, category, tags, isDraft, imageUrl } = body;

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

    // آماده‌سازی داده‌های به‌روزرسانی
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // اگر از پیش‌نویس به منتشر شده تغییر کند
    if (isDraft !== undefined) {
      updateData.isDraft = isDraft;
      updateData.isPublished = !isDraft;
      if (!isDraft && !existingUpdate.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const update = await prisma.updates.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: update.id,
      title: update.title,
      content: update.content,
      summary: update.summary,
      category: update.category,
      source: update.source,
      tags: update.tags,
      imageUrl: update.imageUrl,
      isDraft: update.isDraft,
      isPublished: update.isPublished,
      publishedAt: update.publishedAt,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
      createdBy: update.users,
      feedback: update.feedbacks,
    });
  } catch (error: any) {
    console.error("Error updating update:", error);
    console.error("Error details:", error?.message, error?.code);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - حذف اطلاع‌رسانی (فقط ADMIN)
export async function DELETE(
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

    await prisma.updates.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
