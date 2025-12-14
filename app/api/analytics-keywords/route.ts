import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const keywords = await prisma.analyticsKeyword.findMany({
      where,
      include: {
        department: {
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

// POST - ایجاد کلمه کلیدی جدید
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

    const newKeyword = await prisma.analyticsKeyword.create({
      data: {
        keyword,
        type,
        priority: priority || 0,
        description,
        isActive: isActive !== undefined ? isActive : true,
        departmentId: departmentId || null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(newKeyword, { status: 201 });
  } catch (error) {
    console.error("Error creating analytics keyword:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
