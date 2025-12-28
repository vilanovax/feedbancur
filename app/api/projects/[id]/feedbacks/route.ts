import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - لیست فیدبک‌های پروژه
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

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

    // اگر ادمین نیست، باید عضو باشد و دسترسی مشاهده فیدبک داشته باشد
    if (!isAdmin) {
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!project.membersCanViewFeedbacks) {
        return NextResponse.json(
          { error: "شما دسترسی به فیدبک‌های این پروژه ندارید" },
          { status: 403 }
        );
      }
    }

    const skip = (page - 1) * limit;

    const where: any = { projectId: id };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [feedbacks, total] = await Promise.all([
      prisma.project_feedbacks.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project_feedbacks.count({ where }),
    ]);

    return NextResponse.json({
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        title: f.title,
        content: f.content,
        type: f.type,
        image: f.image,
        isAnonymous: f.isAnonymous,
        senderName: f.senderName,
        senderEmail: f.senderEmail,
        status: f.status,
        adminNotes: isAdmin ? f.adminNotes : undefined,
        user: f.users,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching project feedbacks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
