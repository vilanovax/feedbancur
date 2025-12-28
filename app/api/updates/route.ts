import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET - دریافت لیست اطلاع‌رسانی‌ها
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search");
    const drafts = searchParams.get("drafts") === "true";
    const skip = (page - 1) * limit;

    // ساخت شرط‌های فیلتر
    const where: any = {};

    // فقط ادمین می‌تواند پیش‌نویس‌ها را ببیند
    if (drafts && session.user.role === "ADMIN") {
      where.isDraft = true;
    } else {
      // سایر کاربران فقط منتشر شده‌ها را می‌بینند
      where.isPublished = true;
      where.isDraft = false;
    }

    // فیلتر بر اساس دسته‌بندی
    if (category) {
      where.category = category;
    }

    // جستجو در عنوان و محتوا
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    // دریافت داده‌ها با pagination
    const [total, updates] = await Promise.all([
      prisma.updates.count({ where }),
      prisma.updates.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
            },
          },
          feedbacks: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
    ]);

    // تبدیل به فرمت frontend
    const formattedUpdates = updates.map((update) => ({
      id: update.id,
      title: update.title,
      content: update.content,
      summary: update.summary,
      category: update.category,
      source: update.source,
      tags: update.tags,
      imageUrl: update.imageUrl,
      isDraft: update.isDraft,
      isPublished: update.isPublished,
      publishedAt: update.publishedAt,
      createdAt: update.createdAt,
      createdBy: update.users,
      feedback: update.feedbacks,
    }));

    return NextResponse.json({
      data: formattedUpdates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - ایجاد اطلاع‌رسانی جدید (فقط ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // فقط ادمین می‌تواند اطلاع‌رسانی ایجاد کند
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, summary, category, tags, isDraft, imageUrl } = body;

    // اعتبارسنجی
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "عنوان، محتوا و دسته‌بندی الزامی هستند" },
        { status: 400 }
      );
    }

    // ایجاد اطلاع‌رسانی
    const update = await prisma.updates.create({
      data: {
        id: randomUUID(),
        title,
        content,
        summary: summary || null,
        category,
        source: "MANUAL",
        tags: tags || [],
        imageUrl: imageUrl || null,
        isDraft: isDraft || false,
        isPublished: !isDraft,
        publishedAt: isDraft ? null : new Date(),
        createdById: session.user.id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: update.id,
        title: update.title,
        content: update.content,
        summary: update.summary,
        category: update.category,
        source: update.source,
        tags: update.tags,
        imageUrl: update.imageUrl,
        isDraft: update.isDraft,
        isPublished: update.isPublished,
        publishedAt: update.publishedAt,
        createdAt: update.createdAt,
        createdBy: update.users,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
