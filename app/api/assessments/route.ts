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
    const type = searchParams.get("type"); // MBTI, DISC, HOLLAND, MSQ, CUSTOM
    const isActive = searchParams.get("isActive");

    // For MANAGER, only show assessments assigned to their department
    if (session.user.role === "MANAGER") {
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

      if (!user?.departmentId) {
        return NextResponse.json([]);
      }

      // Get all assignments for manager's department
      const assignments = await prisma.assessment_assignments.findMany({
        where: {
          departmentId: user.departmentId,
          allowManagerView: true, // Only show if manager is allowed to view
        },
        include: {
          assessments: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  assessment_questions: true,
                  assessment_assignments: true,
                  assessment_results: true,
                },
              },
            },
          },
        },
      });

      // Extract assessments and apply filters
      let assessmentsList = assignments
        .map((a: any) => {
          const assessment = a.assessments;
          if (!assessment) return null;
          // Transform to frontend format
          return {
            ...assessment,
            createdBy: assessment.users,
            _count: {
              questions: assessment._count?.assessment_questions || 0,
              assignments: assessment._count?.assessment_assignments || 0,
              results: assessment._count?.assessment_results || 0,
            },
            users: undefined,
          };
        })
        .filter((a: any) => a !== null);

      if (type) {
        assessmentsList = assessmentsList.filter((a: any) => a.type === type);
      }
      if (isActive !== null) {
        const activeFilter = isActive === "true";
        assessmentsList = assessmentsList.filter((a: any) => a.isActive === activeFilter);
      }

      return NextResponse.json(assessmentsList);
    }

    // For ADMIN, show all assessments
    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const assessments = await prisma.assessments.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            assessment_questions: true,
            assessment_assignments: true,
            assessment_results: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to frontend format
    const responseAssessments = assessments.map((assessment: any) => ({
      ...assessment,
      createdBy: assessment.users,
      _count: {
        questions: assessment._count?.assessment_questions || 0,
        assignments: assessment._count?.assessment_assignments || 0,
        results: assessment._count?.assessment_results || 0,
      },
      users: undefined,
    }));

    return NextResponse.json(responseAssessments);
  } catch (error: any) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", details: error.stack },
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

    const assessment = await prisma.assessments.create({
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
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            assessment_questions: true,
            assessment_assignments: true,
            assessment_results: true,
          },
        },
      },
    });

    // Transform to frontend format
    const responseAssessment = {
      ...assessment,
      createdBy: (assessment as any).users,
      _count: {
        questions: (assessment as any)._count?.assessment_questions || 0,
        assignments: (assessment as any)._count?.assessment_assignments || 0,
        results: (assessment as any)._count?.assessment_results || 0,
      },
      users: undefined,
    };

    return NextResponse.json(responseAssessment, { status: 201 });
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
