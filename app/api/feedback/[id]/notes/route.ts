import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const notesSchema = z.object({
  notes: z.string().optional(),
});

// GET - دریافت یادداشت‌های مدیر برای یک فیدبک
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند یادداشت را ببیند
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        managerNotes: true,
        forwardedToId: true,
        departmentId: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: مدیر باید فیدبک را دریافت کرده باشد (ارجاع شده یا مستقیم به بخش)
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        session.user.role === "MANAGER");

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ notes: feedback.managerNotes || "" });
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // اگر فیلد managerNotes وجود نداشت، مقدار خالی برگردان
    if (
      error?.message?.includes("managerNotes") ||
      error?.code === "P2009" ||
      error?.code === "P2011" ||
      error?.message?.includes("Unknown field") ||
      error?.message?.includes("Unknown column")
    ) {
      console.warn("managerNotes field not found, returning empty string");
      return NextResponse.json({ notes: "" });
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        code: error?.code
      },
      { status: 500 }
    );
  }
}

// PATCH - به‌روزرسانی یادداشت‌های مدیر
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط MANAGER می‌تواند یادداشت بنویسد
    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle both Promise and direct params
    const resolvedParams = params instanceof Promise ? await params : params;

    const body = await req.json();
    const data = notesSchema.parse(body);

    // بررسی وجود فیدبک و دسترسی
    const feedback = await prisma.feedback.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        forwardedToId: true,
        departmentId: true,
      },
    });

    if (!feedback) {
      return NextResponse.json({ error: "فیدبک یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی: مدیر باید فیدبک را دریافت کرده باشد (ارجاع شده یا مستقیم به بخش)
    const hasAccess =
      feedback.forwardedToId === session.user.id ||
      (feedback.departmentId === session.user.departmentId &&
        session.user.role === "MANAGER");

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // به‌روزرسانی یادداشت
    const updatedFeedback = await prisma.feedback.update({
      where: { id: resolvedParams.id },
      data: {
        managerNotes: data.notes || null,
      },
      select: {
        id: true,
        managerNotes: true,
      },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating notes:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    // اگر فیلد managerNotes وجود نداشت
    if (
      error?.message?.includes("managerNotes") ||
      error?.code === "P2009" ||
      error?.code === "P2011" ||
      error?.message?.includes("Unknown field") ||
      error?.message?.includes("Unknown column")
    ) {
      console.warn("managerNotes field not found in database");
      return NextResponse.json(
        { 
          error: "فیلد یادداشت در دیتابیس وجود ندارد. لطفاً schema را push کنید.",
          code: error?.code
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        code: error?.code
      },
      { status: 500 }
    );
  }
}

