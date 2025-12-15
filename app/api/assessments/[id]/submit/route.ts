import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAssessmentScore } from "@/lib/assessment-calculator";

// POST /api/assessments/[id]/submit - ثبت نهایی آزمون
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
    const { answers } = body;

    // دریافت آزمون با سوالات
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // محاسبه نمره
    const calculationResult = calculateAssessmentScore(assessment, answers);

    // ذخیره نتیجه
    const assessmentResult = await prisma.assessmentResult.create({
      data: {
        assessmentId: id,
        userId: session.user.id,
        answers: answers,
        result: calculationResult.details || {}, // ذخیره جزئیات کامل در result
        score: calculationResult.score,
        isPassed: assessment.passingScore
          ? calculationResult.score >= assessment.passingScore
          : null,
        startedAt: new Date(), // TODO: باید از progress گرفته شود
        completedAt: new Date(),
      },
    });

    // حذف پیشرفت
    await prisma.assessmentProgress.deleteMany({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: assessmentResult.id,
        score: assessmentResult.score,
        personality: calculationResult.personality,
        passed: assessmentResult.isPassed,
      },
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
