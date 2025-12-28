import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - لیست اعضای پروژه
export async function GET(
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

    const project = await prisma.projects.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    const members = await prisma.project_members.findMany({
      where: { projectId: id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
            departments: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(
      members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.users,
      }))
    );
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - افزودن عضو به پروژه
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
    const body = await request.json();

    const { userId, role = "MEMBER" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "شناسه کاربر الزامی است" },
        { status: 400 }
      );
    }

    // بررسی وجود پروژه
    const project = await prisma.projects.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وجود کاربر
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی عضویت قبلی
    const existingMember = await prisma.project_members.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "این کاربر قبلاً عضو پروژه است" },
        { status: 400 }
      );
    }

    const member = await prisma.project_members.create({
      data: {
        projectId: id,
        userId: userId,
        role: role,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
            departments: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.users,
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف عضو از پروژه
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "شناسه عضویت الزامی است" },
        { status: 400 }
      );
    }

    const member = await prisma.project_members.findFirst({
      where: {
        id: memberId,
        projectId: id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "عضویت یافت نشد" },
        { status: 404 }
      );
    }

    await prisma.project_members.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
