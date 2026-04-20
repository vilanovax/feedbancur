import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).optional(),
  pinned: z.boolean().optional(),
});

async function requireOwnedNote(noteId: string, userId: string) {
  const note = await prisma.user_notes.findUnique({ where: { id: noteId } });
  if (!note) return { error: "یادداشت یافت نشد", status: 404 as const };
  if (note.userId !== userId) return { error: "Forbidden", status: 403 as const };
  return { note };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const check = await requireOwnedNote(id, session.user.id);
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.user_notes.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Update note error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const check = await requireOwnedNote(id, session.user.id);
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  await prisma.user_notes.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
