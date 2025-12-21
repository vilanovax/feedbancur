import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/[id]/result - دریافت آخرین نتیجه آزمون کاربر
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

    // دریافت آخرین نتیجه کاربر برای این آزمون
    const result = await prisma.assessment_results.findFirst({
      where: {
        assessmentId: id,
        userId: session.user.id,
      },
      orderBy: {
        completedAt: "desc",
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            passingScore: true,
            showResults: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: "هیچ نتیجه‌ای برای این آزمون یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result.id,
      score: result.score,
      result: result.result, // جزئیات کامل (MBTI/DISC details)
      isPassed: result.isPassed,
      timeTaken: result.timeTaken,
      completedAt: result.completedAt,
      assessment: result.assessment,
    });
  } catch (error) {
    console.error("Error fetching assessment result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
