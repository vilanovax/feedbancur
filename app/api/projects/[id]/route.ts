import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - جزئیات پروژه
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        project_members: {
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
        },
        _count: {
          select: {
            project_feedbacks: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی دسترسی: ادمین یا عضو پروژه
    const isAdmin = session.user.role === "ADMIN";
    const isMember = project.project_members.some(
      (m) => m.userId === session.user.id
    );

    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      token: project.token,
      isPublic: project.isPublic,
      requireLogin: project.requireLogin,
      allowAnonymous: project.allowAnonymous,
      membersCanViewFeedbacks: project.membersCanViewFeedbacks,
      isActive: project.isActive,
      createdBy: project.users,
      members: project.project_members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.users,
      })),
      feedbacksCount: project._count.project_feedbacks,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - ویرایش پروژه (فقط ADMIN)
export async function PUT(
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

    const existingProject = await prisma.projects.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.requireLogin !== undefined) updateData.requireLogin = body.requireLogin;
    if (body.allowAnonymous !== undefined) updateData.allowAnonymous = body.allowAnonymous;
    if (body.membersCanViewFeedbacks !== undefined) updateData.membersCanViewFeedbacks = body.membersCanViewFeedbacks;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const project = await prisma.projects.update({
      where: { id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            project_members: true,
            project_feedbacks: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      token: project.token,
      isPublic: project.isPublic,
      requireLogin: project.requireLogin,
      allowAnonymous: project.allowAnonymous,
      membersCanViewFeedbacks: project.membersCanViewFeedbacks,
      isActive: project.isActive,
      createdBy: project.users,
      membersCount: project._count.project_members,
      feedbacksCount: project._count.project_feedbacks,
      updatedAt: project.updatedAt,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف پروژه (فقط ADMIN)
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

    const existingProject = await prisma.projects.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    await prisma.projects.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
