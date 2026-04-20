import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const createSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").max(200),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checklists = await prisma.user_checklists.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(checklists);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const checklist = await prisma.user_checklists.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        title: data.title,
        updatedAt: new Date(),
      },
      include: { items: true },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create checklist error:", error);
    return NextResponse.json({ error: "خطا در ایجاد چک‌لیست" }, { status: 500 });
  }
}
