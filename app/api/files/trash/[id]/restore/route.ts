import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/files/trash/[id]/restore
 * بازیابی فایل حذف شده
 * فقط Admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const file = await prisma.shared_files.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
    }

    if (!file.deletedAt) {
      return NextResponse.json(
        { error: "این فایل حذف نشده است" },
        { status: 400 }
      );
    }

    // بازیابی فایل (حذف deletedAt)
    const restoredFile = await prisma.shared_files.update({
      where: { id: params.id },
      data: {
        deletedAt: null,
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
      ...restoredFile,
      tags: restoredFile.tags ? JSON.parse(restoredFile.tags) : [],
    };

    return NextResponse.json({
      success: true,
      file: fileWithTags,
      message: "فایل بازیابی شد",
    });
  } catch (error) {
    console.error("Error restoring file:", error);
    return NextResponse.json(
      { error: "خطا در بازیابی فایل" },
      { status: 500 }
    );
  }
}
