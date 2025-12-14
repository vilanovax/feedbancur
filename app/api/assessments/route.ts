import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments - لیست آزمون‌ها (ADMIN/MANAGER)
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
    const type = searchParams.get("type"); // MBTI, DISC, CUSTOM
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            results: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/assessments - ایجاد آزمون جدید (ADMIN)
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
    const {
      title,
      description,
      type,
      instructions,
      isActive,
      allowRetake,
      timeLimit,
      passingScore,
      showResults,
    } = body;

    // Validation
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description,
        type,
        instructions,
        isActive: isActive ?? true,
        allowRetake: allowRetake ?? false,
        timeLimit,
        passingScore,
        showResults: showResults ?? true,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            results: true,
          },
        },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
