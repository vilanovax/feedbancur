import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت یک کلمه کلیدی
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const keyword = await prisma.analyticsKeyword.findUnique({
      where: { id: params.id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(keyword);
  } catch (error) {
    console.error("Error fetching analytics keyword:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - ویرایش کلمه کلیدی
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedKeyword = await prisma.analyticsKeyword.update({
      where: { id: params.id },
      data: {
        keyword,
        type,
        priority,
        description,
        isActive,
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

    return NextResponse.json(updatedKeyword);
  } catch (error) {
    console.error("Error updating analytics keyword:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف کلمه کلیدی
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.analyticsKeyword.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Keyword deleted successfully" });
  } catch (error) {
    console.error("Error deleting analytics keyword:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
