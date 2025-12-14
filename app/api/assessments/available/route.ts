import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/available - لیست آزمون‌های در دسترس (USER)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all active assessments that are:
    // 1. Assigned to user's department
    // 2. Currently within date range (if specified)
    const now = new Date();

    const assignments = await prisma.assessmentAssignment.findMany({
      where: {
        departmentId: user.departmentId || undefined,
        OR: [
          {
            AND: [
              { startDate: { lte: now } },
              { endDate: { gte: now } },
            ],
          },
          {
            AND: [{ startDate: null }, { endDate: null }],
          },
          {
            AND: [{ startDate: { lte: now } }, { endDate: null }],
          },
        ],
      },
      include: {
        assessment: {
          where: {
            isActive: true,
          },
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });

    // Filter out null assessments and get user progress/results
    const assessmentsWithStatus = await Promise.all(
      assignments
        .filter((a) => a.assessment !== null)
        .map(async (assignment) => {
          const assessment = assignment.assessment!;

          // Check if user has already completed this assessment
          const result = await prisma.assessmentResult.findFirst({
            where: {
              assessmentId: assessment.id,
              userId: session.user.id,
            },
            orderBy: {
              completedAt: "desc",
            },
          });

          // Check if user has progress
          const progress = await prisma.assessmentProgress.findUnique({
            where: {
              assessmentId_userId: {
                assessmentId: assessment.id,
                userId: session.user.id,
              },
            },
          });

          return {
            ...assessment,
            assignment: {
              isRequired: assignment.isRequired,
              startDate: assignment.startDate,
              endDate: assignment.endDate,
            },
            userStatus: {
              hasCompleted: !!result,
              canRetake: assessment.allowRetake,
              inProgress: !!progress,
              lastQuestion: progress?.lastQuestion || 0,
              completedAt: result?.completedAt || null,
            },
          };
        })
    );

    return NextResponse.json(assessmentsWithStatus);
  } catch (error) {
    console.error("Error fetching available assessments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
