import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const createSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است").max(200),
  url: z.string().url("آدرس معتبر نیست"),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get("showAll") === "true";

  // Admin with showAll sees everything (for management page)
  if (session.user.role === "ADMIN" && showAll) {
    const links = await prisma.admin_links.findMany({
      include: {
        departments: { select: { id: true, name: true } },
        users: { select: { id: true, name: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(links);
  }

  // Regular users see only active links scoped to their department (or null = all)
  const deptFilter: any[] = [{ departmentId: null }];
  if (session.user.departmentId) {
    deptFilter.push({ departmentId: session.user.departmentId });
  }

  const links = await prisma.admin_links.findMany({
    where: {
      isActive: true,
      OR: deptFilter,
    },
    select: {
      id: true,
      title: true,
      url: true,
      description: true,
      icon: true,
      category: true,
      order: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const link = await prisma.admin_links.create({
      data: {
        id: randomUUID(),
        title: data.title,
        url: data.url,
        description: data.description ?? null,
        icon: data.icon ?? null,
        category: data.category ?? null,
        departmentId: data.departmentId ?? null,
        order: data.order ?? 0,
        isActive: data.isActive ?? true,
        createdById: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create admin link error:", error);
    return NextResponse.json({ error: "خطا در ایجاد لینک" }, { status: 500 });
  }
}
