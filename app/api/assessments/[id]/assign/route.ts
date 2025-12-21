import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/[id]/assign - تخصیص به بخش (ADMIN)
export async function POST(
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
      departmentId,
      isRequired,
      startDate,
      endDate,
      allowManagerView,
    } = body;

    // Validation
    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Check if assessment exists
    const assessment = await prisma.assessments.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Check if department exists
    const department = await prisma.departments.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.assessment_assignments.findUnique({
      where: {
        assessmentId_departmentId: {
          assessmentId: id,
          departmentId,
        },
      },
    });

    let assignment;
    if (existingAssignment) {
      // Update existing assignment
      assignment = await prisma.assessment_assignments.update({
        where: {
          assessmentId_departmentId: {
            assessmentId: id,
            departmentId,
          },
        },
        data: {
          isRequired: isRequired ?? false,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          allowManagerView: allowManagerView ?? false,
        },
        include: {
          departments: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } else {
      // Create new assignment
      assignment = await prisma.assessment_assignments.create({
        data: {
          assessmentId: id,
          departmentId,
          isRequired: isRequired ?? false,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          allowManagerView: allowManagerView ?? false,
        },
        include: {
          departments: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    console.error("Error assigning assessment:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id]/assign - حذف تخصیص (ADMIN)
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

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.assessment_assignments.findUnique({
      where: {
        assessmentId_departmentId: {
          assessmentId: id,
          departmentId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    await prisma.assessment_assignments.delete({
      where: {
        assessmentId_departmentId: {
          assessmentId: id,
          departmentId,
        },
      },
    });

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
