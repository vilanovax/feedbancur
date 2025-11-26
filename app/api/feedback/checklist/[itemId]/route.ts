import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateChecklistItemSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است").optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().optional(),
});

// PATCH - به‌روزرسانی آیتم چک لیست
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> | { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند آیتم را به‌روزرسانی کند
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const body = await req.json();
    const data = updateChecklistItemSchema.parse(body);

    // بررسی وجود آیتم و دسترسی
    const checklistItem = await prisma.checklistItem.findUnique({
      where: { id: resolvedParams.itemId },
      include: {
        feedback: true,
      },
    });

    if (!checklistItem) {
      return NextResponse.json({ error: "آیتم یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const feedback = checklistItem.feedback;
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        feedback.forwardedToId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedItem = await prisma.checklistItem.update({
      where: { id: resolvedParams.itemId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating checklist item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف آیتم چک لیست
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> | { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند آیتم را حذف کند
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    // بررسی وجود آیتم و دسترسی
    const checklistItem = await prisma.checklistItem.findUnique({
      where: { id: resolvedParams.itemId },
      include: {
        feedback: true,
      },
    });

    if (!checklistItem) {
      return NextResponse.json({ error: "آیتم یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const feedback = checklistItem.feedback;
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        feedback.forwardedToId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.checklistItem.delete({
      where: { id: resolvedParams.itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

