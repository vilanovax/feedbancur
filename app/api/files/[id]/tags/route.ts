import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * PUT /api/files/[id]/tags
 * به‌روزرسانی تگ‌های فایل
 * Body: { tags: string[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const file = await prisma.shared_files.findUnique({
      where: { id: params.id },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const isOwner = file.uploadedById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isManager = session.user.role === "MANAGER";

    if (!isAdmin && !isManager && !isOwner) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    // بررسی عضویت در پروژه (اگر فایل پروژه‌ای است)
    if (file.projectId && !isAdmin) {
      const membership = await prisma.project_members.findUnique({
        where: {
          projectId_userId: {
            projectId: file.projectId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: "فرمت تگ‌ها نامعتبر است" },
        { status: 400 }
      );
    }

    // به‌روزرسانی تگ‌ها
    const updatedFile = await prisma.shared_files.update({
      where: { id: params.id },
      data: {
        tags: JSON.stringify(tags),
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        folders: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Parse tags
    const fileWithTags = {
      ...updatedFile,
      tags: updatedFile.tags ? JSON.parse(updatedFile.tags) : [],
    };

    return NextResponse.json({
      success: true,
      file: fileWithTags,
      message: "تگ‌ها به‌روزرسانی شد",
    });
  } catch (error) {
    console.error("Error updating tags:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی تگ‌ها" },
      { status: 500 }
    );
  }
}
