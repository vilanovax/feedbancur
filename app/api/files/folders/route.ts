import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/files/folders
 * لیست پوشه‌ها
 * Query params: projectId, parentId, search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const parentId = searchParams.get("parentId");
    const search = searchParams.get("search");

    // بررسی دسترسی
    if (!projectId) {
      // پوشه‌های سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    } else {
      // پوشه‌های پروژه - بررسی عضویت
      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "شما به این پروژه دسترسی ندارید" },
            { status: 403 }
          );
        }
      }
    }

    // ساخت query
    const where: any = {
      projectId: projectId || null,
      parentId: parentId || null,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // دریافت پوشه‌ها
    const folders = await prisma.shared_folders.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "خطا در دریافت پوشه‌ها" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files/folders
 * ایجاد پوشه جدید
 * Body: { name, parentId?, projectId? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, projectId } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "نام پوشه الزامی است" },
        { status: 400 }
      );
    }

    // بررسی دسترسی
    if (!projectId) {
      // پوشه سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "فقط ادمین می‌تواند پوشه سازمانی ایجاد کند" },
          { status: 403 }
        );
      }
    } else {
      // پوشه پروژه - Manager یا Admin
      if (session.user.role === "EMPLOYEE") {
        return NextResponse.json(
          { error: "کاربران عادی نمی‌توانند پوشه ایجاد کنند" },
          { status: 403 }
        );
      }

      if (session.user.role !== "ADMIN") {
        const membership = await prisma.project_members.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: session.user.id,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "شما به این پروژه دسترسی ندارید" },
            { status: 403 }
          );
        }
      }
    }

    // بررسی تکراری بودن نام
    const existing = await prisma.shared_folders.findFirst({
      where: {
        name,
        parentId: parentId || null,
        projectId: projectId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "پوشه‌ای با این نام در این مکان وجود دارد" },
        { status: 400 }
      );
    }

    // بررسی عمق پوشه (حداکثر 5 سطح)
    if (parentId) {
      let depth = 1;
      let currentParent = parentId;

      while (currentParent && depth < 5) {
        const parent = await prisma.shared_folders.findUnique({
          where: { id: currentParent },
          select: { parentId: true },
        });

        if (!parent) break;
        if (!parent.parentId) break;

        currentParent = parent.parentId;
        depth++;
      }

      if (depth >= 5) {
        return NextResponse.json(
          { error: "حداکثر عمق پوشه‌بندی 5 سطح است" },
          { status: 400 }
        );
      }
    }

    // ایجاد پوشه
    const folder = await prisma.shared_folders.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        projectId: projectId || null,
        createdById: session.user.id,
      },
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

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد پوشه" },
      { status: 500 }
    );
  }
}
