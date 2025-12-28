import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// POST - تولید token جدید برای پروژه
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existingProject = await prisma.projects.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    const newToken = randomUUID();

    const project = await prisma.projects.update({
      where: { id },
      data: { token: newToken },
      select: {
        id: true,
        token: true,
      },
    });

    return NextResponse.json({
      id: project.id,
      token: project.token,
      message: "لینک اشتراک‌گذاری جدید ایجاد شد",
    });
  } catch (error) {
    console.error("Error regenerating project token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
