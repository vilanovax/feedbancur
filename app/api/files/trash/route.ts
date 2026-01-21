import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/files/trash
 * لیست فایل‌های حذف شده (سطل زباله)
 * فقط Admin
 * Query params: projectId, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const offset = (page - 1) * limit;

    // ساخت query
    const where: any = {
      deletedAt: {
        not: null,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // دریافت فایل‌های حذف شده
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
        orderBy: {
          deletedAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.shared_files.count({ where }),
    ]);

    // Parse tags
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
    console.error("Error fetching trash:", error);
    return NextResponse.json(
      { error: "خطا در دریافت سطل زباله" },
      { status: 500 }
    );
  }
}
