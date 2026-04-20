import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  isDone: z.boolean().optional(),
});

async function requireOwnedItem(itemId: string, userId: string) {
  const item = await prisma.user_checklist_items.findUnique({
    where: { id: itemId },
    include: { user_checklists: true },
  });
  if (!item) return { error: "آیتم یافت نشد", status: 404 as const };
  if (item.user_checklists.userId !== userId) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { item };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const check = await requireOwnedItem(itemId, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const updated = await prisma.user_checklist_items.update({
      where: { id: itemId },
      data,
    });
    await prisma.user_checklists.update({
      where: { id: check.item.checklistId },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Update item error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const check = await requireOwnedItem(itemId, session.user.id);
  if ("error" in check) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.user_checklist_items.delete({ where: { id: itemId } });
  await prisma.user_checklists.update({
    where: { id: check.item.checklistId },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
