import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromLiara } from "@/lib/liara-storage";

/**
 * GET /api/files/[id]
 * دریافت جزئیات فایل (و افزایش شمارنده دانلود)
 */
export async function GET(
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
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    if (file.projectId) {
      // فایل پروژه
      if (session.user.role !== "ADMIN") {
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
    } else {
      // فایل سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    // افزایش شمارنده دانلود و به‌روزرسانی lastAccessedAt
    await prisma.shared_files.update({
      where: { id: params.id },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Parse tags
    const fileWithTags = {
      ...file,
      tags: file.tags ? JSON.parse(file.tags) : [],
    };

    return NextResponse.json(fileWithTags);
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فایل" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files/[id]
 * به‌روزرسانی اطلاعات فایل (نام، پوشه، تگ‌ها)
 * Body: { name?, folderId?, tags? }
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

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "فقط آپلودکننده فایل یا ادمین می‌تواند آن را ویرایش کند" },
        { status: 403 }
      );
    }

    // بررسی عضویت در پروژه (اگر فایل پروژه‌ای است)
    if (file.projectId && session.user.role !== "ADMIN") {
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
    const { name, folderId, tags } = body;

    // اعتبارسنجی
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "نام فایل نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: "فرمت تگ‌ها نامعتبر است" },
        { status: 400 }
      );
    }

    // بررسی پوشه جدید
    if (folderId !== undefined && folderId !== null) {
      const folder = await prisma.shared_folders.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "پوشه یافت نشد" },
          { status: 404 }
        );
      }

      // بررسی تطابق projectId
      if (folder.projectId !== file.projectId) {
        return NextResponse.json(
          { error: "پوشه متعلق به همان پروژه نیست" },
          { status: 400 }
        );
      }
    }

    // به‌روزرسانی فایل
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (folderId !== undefined) updateData.folderId = folderId;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    const updatedFile = await prisma.shared_files.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(fileWithTags);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی فایل" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * حذف نرم فایل (soft delete)
 */
export async function DELETE(
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

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "فقط آپلودکننده فایل یا ادمین می‌تواند آن را حذف کند" },
        { status: 403 }
      );
    }

    // بررسی عضویت در پروژه (اگر فایل پروژه‌ای است)
    if (file.projectId && session.user.role !== "ADMIN") {
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

    // حذف نرم (soft delete)
    await prisma.shared_files.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
      },
    });

    // نکته: فایل از Object Storage حذف نمی‌شود (برای امکان بازیابی)
    // Admin می‌تواند از طریق Trash به صورت دائمی حذف کند

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "خطا در حذف فایل" },
      { status: 500 }
    );
  }
}
