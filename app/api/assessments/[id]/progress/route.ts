import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assessments/[id]/progress - ذخیره پیشرفت آزمون
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

    const body = await request.json();
    const { answers, lastQuestion } = body;

    // بررسی وجود پیشرفت
    const existingProgress = await prisma.assessmentProgress.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    if (!existingProgress) {
      return NextResponse.json(
        { error: "Progress not found" },
        { status: 404 }
      );
    }

    // به‌روزرسانی پیشرفت
    const updatedProgress = await prisma.assessmentProgress.update({
      where: { id: existingProgress.id },
      data: {
        answers: answers,
        currentQuestion: lastQuestion,
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({ success: true, progress: updatedProgress });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
