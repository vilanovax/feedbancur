import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id] - جزئیات آزمون (ADMIN/MANAGER)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions based on role
    if (session.user.role === "ADMIN") {
      // Admins have access to all assessments
    } else if (session.user.role === "MANAGER" || session.user.role === "EMPLOYEE") {
      // For managers and employees, check if they have access through department assignment
      const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });

      if (!user?.departmentId) {
        console.error(`User ${session.user.id} has no departmentId`);
        return NextResponse.json(
          { error: "شما به بخشی اختصاص داده نشده‌اید" },
          { status: 403 }
        );
      }

      // Check if assessment is assigned to user's department
      const assignment = await prisma.assessment_assignments.findUnique({
        where: {
          assessmentId_departmentId: {
            assessmentId: id,
            departmentId: user.departmentId,
          },
        },
      });

      if (!assignment) {
        console.error(`Assessment ${id} not assigned to department ${user.departmentId} for user ${session.user.id}`);
        // Also check if assessment exists
        const assessmentExists = await prisma.assessments.findUnique({
          where: { id },
          select: { id: true },
        });
        
        if (!assessmentExists) {
          return NextResponse.json(
            { error: "آزمون یافت نشد" },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { error: "شما دسترسی به این آزمون ندارید. این آزمون به بخش شما اختصاص داده نشده است" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const assessment = await prisma.assessments.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assessment_questions: {
          orderBy: {
            order: "asc",
          },
        },
        assessment_assignments: {
          include: {
            departments: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            assessment_results: true,
            assessment_progress: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Transform to frontend format
    const formattedAssessment = {
      ...assessment,
      createdBy: assessment.users,
      assessment_assignments: assessment.assessment_assignments.map(a => ({
        ...a,
        department: (a as any).departments,
      })),
      _count: {
        results: assessment._count.assessment_results,
        progress: assessment._count.assessment_progress,
      },
    };

    return NextResponse.json(formattedAssessment);
  } catch (error: any) {
    console.error("Error fetching assessment:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "خطا در دریافت اطلاعات آزمون",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/assessments/[id] - ویرایش آزمون (ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if assessment exists
    const existingAssessment = await prisma.assessments.findUnique({
      where: { id },
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    const assessment = await prisma.assessments.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(instructions !== undefined && { instructions }),
        ...(isActive !== undefined && { isActive }),
        ...(allowRetake !== undefined && { allowRetake }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(passingScore !== undefined && { passingScore }),
        ...(showResults !== undefined && { showResults }),
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

    return NextResponse.json(responseAssessment);
  } catch (error) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id] - حذف آزمون (ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if assessment exists
    const existingAssessment = await prisma.assessments.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessment_results: true,
          },
        },
      },
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Check if there are any results
    if (existingAssessment._count.assessment_results > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete assessment with existing results. Please archive it instead.",
        },
        { status: 400 }
      );
    }

    await prisma.assessments.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
