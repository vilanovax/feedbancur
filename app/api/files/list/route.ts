import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/files/list
 * لیست فایل‌ها با صفحه‌بندی و فیلترها
 * Query params: projectId, folderId, search, tags, page, limit, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");
    const tagsParam = searchParams.get("tags"); // comma-separated
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdAt"; // name, createdAt, size, downloadCount
    const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc

    // بررسی دسترسی
    if (!projectId) {
      // فایل‌های سازمانی - فقط Admin
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز" },
          { status: 403 }
        );
      }
    } else {
      // فایل‌های پروژه - بررسی عضویت
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
      folderId: folderId || null,
      deletedAt: null, // فقط فایل‌های فعال
    };

    // فیلتر جستجو (نام فایل)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          originalName: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // فیلتر تگ‌ها
    if (tagsParam) {
      const tags = tagsParam.split(",").filter(Boolean);
      if (tags.length > 0) {
        // جستجو در JSON field - فایل‌هایی که حداقل یکی از تگ‌ها را دارند
        where.OR = tags.map((tag) => ({
          tags: {
            contains: tag,
          },
        }));
      }
    }

    // محاسبه offset
    const offset = (page - 1) * limit;

    // مرتب‌سازی
    const orderBy: any = {};
    if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "size") {
      orderBy.size = sortOrder;
    } else if (sortBy === "downloadCount") {
      orderBy.downloadCount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // دریافت فایل‌ها
    const [files, total] = await Promise.all([
      prisma.shared_files.findMany({
        where,
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
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.shared_files.count({ where }),
    ]);

    // Parse tags for each file
    const filesWithParsedTags = files.map((file) => ({
      ...file,
      tags: file.tags ? JSON.parse(file.tags) : [],
    }));

    return NextResponse.json({
      files: filesWithParsedTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فایل‌ها" },
      { status: 500 }
    );
  }
}
