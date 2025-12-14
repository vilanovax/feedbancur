import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/[id]/start - شروع آزمون (USER)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if assessment exists and is active
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            questionText: true,
            questionType: true,
            order: true,
            isRequired: true,
            options: true,
            image: true,
          },
        },
      },
    });

    if (!assessment || !assessment.isActive) {
      return NextResponse.json(
        { error: "Assessment not found or not active" },
        { status: 404 }
      );
    }

    // Check if user has access to this assessment (via department assignment)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    if (!user?.departmentId) {
      return NextResponse.json(
        { error: "User not assigned to any department" },
        { status: 403 }
      );
    }

    const assignment = await prisma.assessmentAssignment.findUnique({
      where: {
        assessmentId_departmentId: {
          assessmentId: params.id,
          departmentId: user.departmentId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assessment not assigned to your department" },
        { status: 403 }
      );
    }

    // Check if already completed
    const existingResult = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId: params.id,
        userId: session.user.id,
      },
    });

    if (existingResult && !assessment.allowRetake) {
      return NextResponse.json(
        { error: "You have already completed this assessment" },
        { status: 400 }
      );
    }

    // Create or get progress
    const progress = await prisma.assessmentProgress.upsert({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
      update: {
        startedAt: new Date(),
        lastQuestion: 0,
        answers: {},
      },
      create: {
        assessmentId: params.id,
        userId: session.user.id,
        answers: {},
        lastQuestion: 0,
      },
    });

    return NextResponse.json({
      progress,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        instructions: assessment.instructions,
        timeLimit: assessment.timeLimit,
        totalQuestions: assessment.questions.length,
      },
      questions: assessment.questions,
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
