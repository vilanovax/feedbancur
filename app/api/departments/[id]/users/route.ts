import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - دریافت لیست کاربران یک بخش
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // بررسی وجود بخش
    const department = await prisma.departments.findUnique({
      where: { id },
    });

    if (!department) {
      return NextResponse.json(
        { error: "بخش یافت نشد" },
        { status: 404 }
      );
    }

    // MANAGER فقط می‌تواند کاربران بخش خودش را ببیند
    if (
      session.user.role === "MANAGER" &&
      id !== session.user.departmentId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // دریافت کاربران بخش
    const users = await prisma.users.findMany({
      where: {
        departmentId: id,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching department users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
