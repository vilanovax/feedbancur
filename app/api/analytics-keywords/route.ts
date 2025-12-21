import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET - دریافت لیست کلمات کلیدی
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (departmentId) {
      if (departmentId === "null") {
        where.departmentId = null;
      } else {
        where.departmentId = departmentId;
      }
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const keywords = await prisma.analytics_keywords.findMany({
      where,
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error("Error fetching analytics keywords:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - ایجاد کلمه کلیدی جدید (با پشتیبانی از چند کلمه با ویرگول)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { keyword, type, priority, description, isActive, departmentId } = body;

    if (!keyword || !type) {
      return NextResponse.json(
        { error: "Keyword and type are required" },
        { status: 400 }
      );
    }

    // جدا کردن کلمات با ویرگول
    const keywords = keyword
      .split(/[,،]/) // جدا کردن با ویرگول فارسی و انگلیسی
      .map((kw: string) => kw.trim())
      .filter((kw: string) => kw.length > 0);

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "At least one valid keyword is required" },
        { status: 400 }
      );
    }

    // ایجاد چندین کلمه کلیدی به صورت دسته‌ای
    const createdKeywords = await Promise.all(
      keywords.map((kw: string) =>
        prisma.analytics_keywords.create({
          data: {
            id: crypto.randomUUID(),
            keyword: kw,
            type,
            priority: priority || "MEDIUM",
            description,
            isActive: isActive !== undefined ? isActive : true,
            departmentId: departmentId || null,
            updatedAt: new Date(),
          },
          include: {
            departments: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      )
    );

    // اگر فقط یک کلمه بود، همان را برگردان، وگرنه آرایه را برگردان
    return NextResponse.json(
      createdKeywords.length === 1 ? createdKeywords[0] : createdKeywords,
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating analytics keyword:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
