import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET - لیست پروژه‌ها (فقط ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const [total, projects] = await Promise.all([
      prisma.projects.count({ where }),
      prisma.projects.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedProjects = projects.map((project) => ({
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
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return NextResponse.json({
      data: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - ایجاد پروژه جدید (فقط ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      isPublic = true,
      requireLogin = false,
      allowAnonymous = true,
      membersCanViewFeedbacks = false,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "نام پروژه الزامی است" },
        { status: 400 }
      );
    }

    const project = await prisma.projects.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        description: description?.trim() || null,
        token: randomUUID(),
        isPublic,
        requireLogin,
        allowAnonymous,
        membersCanViewFeedbacks,
        isActive: true,
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
        createdAt: project.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
