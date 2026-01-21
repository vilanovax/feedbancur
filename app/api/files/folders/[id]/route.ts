import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/files/folders/[id]
 * دریافت جزئیات پوشه
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

    const folder = await prisma.shared_folders.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            files: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "پوشه یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    if (folder.projectId) {
      // پوشه پروژه
      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId: folder.projectId,
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
      // پوشه سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پوشه" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files/folders/[id]
 * تغییر نام یا جابجایی پوشه
 * Body: { name?, parentId? }
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

    const folder = await prisma.shared_folders.findUnique({
      where: { id: params.id },
    });

    if (!folder) {
      return NextResponse.json({ error: "پوشه یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const isOwner = folder.createdById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (folder.projectId) {
      // پوشه پروژه
      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "فقط سازنده پوشه یا ادمین می‌تواند آن را ویرایش کند" },
          { status: 403 }
        );
      }

      // بررسی عضویت در پروژه
      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId: folder.projectId,
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
      // پوشه سازمانی - فقط Admin
      if (!isAdmin) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { name, parentId } = body;

    // اعتبارسنجی
    if (name !== undefined && (!name || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "نام پوشه نمی‌تواند خالی باشد" },
        { status: 400 }
      );
    }

    // جلوگیری از circular reference
    if (parentId && parentId === params.id) {
      return NextResponse.json(
        { error: "پوشه نمی‌تواند والد خودش باشد" },
        { status: 400 }
      );
    }

    if (parentId) {
      // بررسی اینکه parentId یکی از فرزندان این پوشه نباشد
      const checkCircular = async (folderId: string): Promise<boolean> => {
        if (folderId === params.id) return true;

        const children = await prisma.shared_folders.findMany({
          where: { parentId: folderId },
          select: { id: true },
        });

        for (const child of children) {
          if (await checkCircular(child.id)) return true;
        }

        return false;
      };

      if (await checkCircular(parentId)) {
        return NextResponse.json(
          { error: "نمی‌توانید پوشه را به زیرمجموعه خودش منتقل کنید" },
          { status: 400 }
        );
      }
    }

    // بررسی تکراری بودن نام
    if (name) {
      const existing = await prisma.shared_folders.findFirst({
        where: {
          name: name.trim(),
          parentId: parentId !== undefined ? (parentId || null) : folder.parentId,
          projectId: folder.projectId,
          id: { not: params.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "پوشه‌ای با این نام در این مکان وجود دارد" },
          { status: 400 }
        );
      }
    }

    // به‌روزرسانی پوشه
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) updateData.parentId = parentId || null;

    const updatedFolder = await prisma.shared_folders.update({
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
      },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "خطا در به‌روزرسانی پوشه" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/folders/[id]
 * حذف پوشه
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

    const folder = await prisma.shared_folders.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            children: true,
            files: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "پوشه یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const isOwner = folder.createdById === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (folder.projectId) {
      // پوشه پروژه
      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { error: "فقط سازنده پوشه یا ادمین می‌تواند آن را حذف کند" },
          { status: 403 }
        );
      }
    } else {
      // پوشه سازمانی - فقط Admin
      if (!isAdmin) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    }

    // بررسی خالی بودن پوشه
    if (folder._count.children > 0 || folder._count.files > 0) {
      return NextResponse.json(
        { error: "پوشه خالی نیست. ابتدا فایل‌ها و زیرپوشه‌ها را حذف کنید" },
        { status: 400 }
      );
    }

    // حذف پوشه
    await prisma.shared_folders.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "خطا در حذف پوشه" },
      { status: 500 }
    );
  }
}
