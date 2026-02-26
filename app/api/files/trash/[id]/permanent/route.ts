import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFromLiara } from "@/lib/liara-storage";
import { getObjectStorageSettings, isStorageConfigValid } from "@/lib/object-storage-settings";

/**
 * DELETE /api/files/trash/[id]/permanent
 * حذف دائمی فایل از Object Storage و دیتابیس
 * فقط Admin
 */
export async function DELETE(
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
        { error: "فایل باید ابتدا به سطل زباله منتقل شود" },
        { status: 400 }
      );
    }

    const objectStorageSettings = await getObjectStorageSettings(prisma);
    if (isStorageConfigValid(objectStorageSettings)) {
      try {
        await deleteFromLiara(file.storagePath, objectStorageSettings);
      } catch (deleteError) {
        console.error("Error deleting file from storage:", deleteError);
      }
    }

    // حذف دائمی از دیتابیس
    await prisma.shared_files.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "فایل به طور دائم حذف شد",
    });
  } catch (error) {
    console.error("Error permanently deleting file:", error);
    return NextResponse.json(
      { error: "خطا در حذف دائمی فایل" },
      { status: 500 }
    );
  }
}
