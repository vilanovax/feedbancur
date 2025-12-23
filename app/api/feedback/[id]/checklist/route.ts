import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checklistItemSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است"),
  order: z.number().optional().default(0),
});

// GET - دریافت چک لیست یک فیدبک
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند چک لیست را ببیند
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedbacks.findUnique({
      where: { id: resolvedParams.id },
      include: {
        checklist_items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: مدیر باید فیدبک را دریافت کرده باشد (ارجاع شده یا مستقیم به بخش)
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        feedback.forwardedToId === session.user.id);

    if (!hasAccess) {
      console.log("Access denied:", {
        feedbackId: resolvedParams.id,
        managerId: session.user.id,
        feedbackForwardedToId: feedback.forwardedToId,
        feedbackDepartmentId: feedback.departmentId,
        managerDepartmentId: session.user.departmentId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(feedback.checklist_items || []);
  } catch (error) {
    console.error("Error fetching checklist:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - ایجاد آیتم جدید در چک لیست
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند آیتم ایجاد کند
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const body = await req.json();
    const data = checklistItemSchema.parse(body);

    // بررسی وجود فیدبک و دسترسی
    const feedback = await prisma.feedbacks.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        feedback.forwardedToId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت آخرین order برای قرار دادن آیتم جدید در انتها
    const lastItem = await prisma.checklist_items.findFirst({
      where: { feedbackId: resolvedParams.id },
      orderBy: { order: "desc" },
    });

    const newOrder = lastItem ? lastItem.order + 1 : 0;

    const checklistItem = await prisma.checklist_items.create({
      data: {
        feedbackId: resolvedParams.id,
        title: data.title,
        order: newOrder, // همیشه از newOrder استفاده می‌کنیم
      },
    });

    return NextResponse.json(checklistItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating checklist item:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

