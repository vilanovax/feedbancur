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

    const user = await prisma.users.findUnique({
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

    // If user has no department, return empty array
    if (!user.departmentId) {
      return NextResponse.json([]);
    }

    const assignments = await prisma.assessment_assignments.findMany({
      where: {
        departmentId: user.departmentId,
        assessments: {
          isActive: true,
        },
        OR: [
          // No date restrictions
          {
            startDate: null,
            endDate: null,
          },
          // Only start date, must have started
          {
            startDate: { lte: now },
            endDate: null,
          },
          // Only end date, must not have ended
          {
            startDate: null,
            endDate: { gte: now },
          },
          // Both dates, must be within range
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
        ],
      },
      include: {
        assessments: {
          include: {
            _count: {
              select: {
                assessment_questions: true,
              },
            },
          },
        },
      },
    });

    // Filter out null assessments and get user progress/results
    const assessmentsWithStatus = await Promise.all(
      assignments
        .filter((a) => a.assessments !== null)
        .map(async (assignment) => {
          const assessment = assignment.assessments!;

          // Check if user has already completed this assessment
          const result = await prisma.assessment_results.findFirst({
            where: {
              assessmentId: assessment.id,
              userId: session.user.id,
            },
            orderBy: {
              completedAt: "desc",
            },
          });

          // Check if user has progress
          const progress = await prisma.assessment_progress.findUnique({
            where: {
              assessmentId_userId: {
                assessmentId: assessment.id,
                userId: session.user.id,
              },
            },
          });

          const hasCompleted = !!result;
          const hasProgress = !!progress;
          // اگر آزمون تکمیل شده باشد، دیگر در حال انجام نیست
          const inProgress = hasProgress && !hasCompleted;

          return {
            ...assessment,
            assignment: {
              isRequired: assignment.isRequired,
              startDate: assignment.startDate,
              endDate: assignment.endDate,
            },
            userStatus: {
              hasCompleted,
              canRetake: assessment.allowRetake,
              inProgress,
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
