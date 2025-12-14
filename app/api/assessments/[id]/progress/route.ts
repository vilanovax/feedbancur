import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id]/progress - دریافت وضعیت جاری (USER)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.assessmentProgress.findUnique({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        { error: "No progress found for this assessment" },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/assessments/[id]/progress - ذخیره موقت پاسخ‌ها (USER)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, lastQuestion } = body;

    // Check if progress exists
    const existingProgress = await prisma.assessmentProgress.findUnique({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!existingProgress) {
      return NextResponse.json(
        { error: "Progress not found. Please start the assessment first." },
        { status: 404 }
      );
    }

    // Update progress
    const progress = await prisma.assessmentProgress.update({
      where: {
        assessmentId_userId: {
          assessmentId: params.id,
          userId: session.user.id,
        },
      },
      data: {
        answers: answers || existingProgress.answers,
        lastQuestion: lastQuestion ?? existingProgress.lastQuestion,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
