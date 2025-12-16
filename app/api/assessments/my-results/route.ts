import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assessments/my-results - دریافت نتایج آزمون‌های MBTI و DISC کاربر
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // دریافت تمام نتایج آزمون‌های کاربر
    const results = await prisma.assessmentResult.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // برای هر آزمون، فقط آخرین نتیجه را برگردان
    const latestResults = results.reduce((acc: any[], result) => {
      const assessmentId = result.assessmentId;
      const existing = acc.find((r) => r.assessment.id === assessmentId);
      
      if (!existing) {
        acc.push({
          id: result.id,
          assessmentId: result.assessmentId,
          assessment: result.assessment,
          result: result.result, // جزئیات کامل (MBTI/DISC details)
          score: result.score,
          isPassed: result.isPassed,
          completedAt: result.completedAt,
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json(latestResults);
  } catch (error) {
    console.error("Error fetching user assessment results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

