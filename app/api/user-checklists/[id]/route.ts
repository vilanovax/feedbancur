import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const addItemSchema = z.object({
  text: z.string().min(1, "متن الزامی است").max(500),
});

async function requireOwnedChecklist(checklistId: string, userId: string) {
  const list = await prisma.user_checklists.findUnique({ where: { id: checklistId } });
  if (!list) return { error: "چک‌لیست یافت نشد", status: 404 as const };
  if (list.userId !== userId) return { error: "Forbidden", status: 403 as const };
  return { list };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const check = await requireOwnedChecklist(id, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const updated = await prisma.user_checklists.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Update checklist error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const check = await requireOwnedChecklist(id, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.user_checklists.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// POST: add item to checklist
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const check = await requireOwnedChecklist(id, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    const body = await req.json();
    const data = addItemSchema.parse(body);

    const maxOrder = await prisma.user_checklist_items.aggregate({
      where: { checklistId: id },
      _max: { order: true },
    });

    const item = await prisma.user_checklist_items.create({
      data: {
        id: randomUUID(),
        checklistId: id,
        text: data.text,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    await prisma.user_checklists.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Add item error:", error);
    return NextResponse.json({ error: "خطا در افزودن آیتم" }, { status: 500 });
  }
}
