import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - جزئیات یک فیدبک
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, feedbackId } = await params;

    // بررسی دسترسی
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        project_members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "پروژه یافت نشد" },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";
    const isMember = project.project_members.length > 0;

    if (!isAdmin && (!isMember || !project.membersCanViewFeedbacks)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const feedback = await prisma.project_feedbacks.findFirst({
      where: {
        id: feedbackId,
        projectId: id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: feedback.id,
      title: feedback.title,
      content: feedback.content,
      type: feedback.type,
      image: feedback.image,
      isAnonymous: feedback.isAnonymous,
      senderName: feedback.senderName,
      senderEmail: feedback.senderEmail,
      status: feedback.status,
      adminNotes: isAdmin ? feedback.adminNotes : undefined,
      user: feedback.users,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching project feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - به‌روزرسانی فیدبک (وضعیت و یادداشت ادمین)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, feedbackId } = await params;
    const body = await request.json();

    const existingFeedback = await prisma.project_feedbacks.findFirst({
      where: {
        id: feedbackId,
        projectId: id,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes?.trim() || null;
    }

    const feedback = await prisma.project_feedbacks.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: feedback.id,
      title: feedback.title,
      content: feedback.content,
      type: feedback.type,
      image: feedback.image,
      isAnonymous: feedback.isAnonymous,
      senderName: feedback.senderName,
      senderEmail: feedback.senderEmail,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      user: feedback.users,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    });
  } catch (error) {
    console.error("Error updating project feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - حذف فیدبک
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, feedbackId } = await params;

    const existingFeedback = await prisma.project_feedbacks.findFirst({
      where: {
        id: feedbackId,
        projectId: id,
      },
    });

    if (!existingFeedback) {
      return NextResponse.json(
        { error: "فیدبک یافت نشد" },
        { status: 404 }
      );
    }

    await prisma.project_feedbacks.delete({
      where: { id: feedbackId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
